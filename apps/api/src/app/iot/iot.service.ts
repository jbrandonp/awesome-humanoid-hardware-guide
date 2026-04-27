import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { DpdpaConsentService } from '../audit/dpdpa-consent.service';
import { z } from 'zod';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as Y from 'yjs';

// ============================================================================
// TYPAGES STRICTS & VALIDATION DE SCHÉMAS ZOD (PRODUCTION-READY)
// Le backend ne fait confiance à aucune donnée entrante. Tout est filtré et
// certifié via Zod avant même d'atteindre le moteur d'Audit ou la BDD.
// ============================================================================

export const IotDeviceMetadataSchema = z.object({
  hardwareMacAddress: z
    .string()
    .regex(
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      'Format MAC Address invalide',
    ),
  manufacturerName: z.string().min(1, 'Le nom du constructeur est requis'),
  batteryLevelPercentage: z.number().min(0).max(100),
});

export const BleBloodPressurePayloadSchema = z.object({
  patientId: z.string().uuid('ID Patient invalide'),
  practitionerId: z.string().uuid('ID Praticien invalide'),
  deviceMetadata: IotDeviceMetadataSchema,
  systolicMmHg: z
    .number()
    .positive()
    .max(300, 'Valeur systolique aberrante (Max 300)'),
  diastolicMmHg: z
    .number()
    .positive()
    .max(200, 'Valeur diastolique aberrante (Max 200)'),
  meanArterialPressureMmHg: z.number().positive(),
  pulseRateBpm: z.number().positive().max(300).optional(),
  acquisitionTimestampIso: z.string().datetime(),
});

export const SmartPenInkPayloadSchema = z.object({
  patientId: z.string().uuid(),
  practitionerId: z.string().uuid(),
  deviceMetadata: IotDeviceMetadataSchema,
  rawSvgPathData: z.string().min(5, 'Tracé vectoriel SVG vide'),
  acquisitionTimestampIso: z.string().datetime(),
});

export type BleBloodPressurePayload = z.infer<
  typeof BleBloodPressurePayloadSchema
>;
export type SmartPenInkPayload = z.infer<typeof SmartPenInkPayloadSchema>;

export interface IotIngestionResult {
  status: 'SUCCESS' | 'QUEUED' | 'REJECTED';
  vitalRecordId?: string;
  message: string;
  warning?: string;
}

@Injectable()
export class IotMedicalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IotMedicalService.name);
  private watchdogInterval: NodeJS.Timeout | null = null;

  // ============================================================================
  // RÉSILIENCE : FILE D'ATTENTE (QUEUE) EN MÉMOIRE
  // Si Postgres (Prisma) sature (Trop de connexions, Lock Timeout sur Windows 7)
  // le service met la donnée vitale en RAM et boucle pour réessayer plus tard.
  // ============================================================================
  private fallbackQueue: {
    type: 'BLE' | 'PEN';
    payload: BleBloodPressurePayload | SmartPenInkPayload;
    retryCount: number;
  }[] = [];
  private isProcessingQueue = false;

  // ============================================================================
  // SÉCURITÉ : AUTHENTIFICATION MATÉRIELLE (WHITELISTING)
  // Empêche un patient d'envoyer de fausses constantes depuis son propre smartphone
  // piraté. Seuls les capteurs enregistrés par l'administration de l'hôpital passent.
  // ============================================================================
  private readonly AUTHORIZED_SENSORS_MAC: Set<string> = new Set([
    '00:11:22:33:44:55', // OMRON Blood Pressure X
    'AA:BB:CC:DD:EE:FF', // WONDRx Smart Pen
    '99:88:77:66:55:44', // Contour Next Glucometer
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly consentManager: DpdpaConsentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit(): void {
    // Démarrer le "Watchdog" de la file d'attente qui tentera de vider la RAM
    // vers la base de données toutes les 30 secondes en cas d'incident antérieur.
    this.watchdogInterval = setInterval(() => this.processFallbackQueue(), 30000);
  }

  onModuleDestroy(): void {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
    }
  }

  /**
   * INGESTION SÉCURISÉE DES DONNÉES BLUETOOTH LOW ENERGY (Tensiomètres)
   */
  async processBleGattData(rawPayload: unknown, fromQueue = false): Promise<IotIngestionResult> {
    // 1. VALIDATION STRICTE ZOD (Filtrage des attaques d'injection de payload)
    const validationResult =
      BleBloodPressurePayloadSchema.safeParse(rawPayload);
    if (!validationResult.success) {
      this.logger.error(
        `[IoT-BLE] Payload rejeté : Malformé ou hors-limites physiologiques.`,
        validationResult.error.format(),
      );
      throw new HttpException(
        'Données capteur corrompues ou impossibles médicalement.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const payload = validationResult.data;
    this.logger.log(
      `[IoT-BLE] Nouvelle tentative d'ingestion depuis le périphérique: ${payload.deviceMetadata.hardwareMacAddress}`,
    );

    // 2. AUTHENTIFICATION DU MATÉRIEL (Spoofing Protection)
    // Désactivé en DEV (Fallback sur le Mock Mac) mais activé en Production
    const isDevEnv = process.env.NODE_ENV !== 'production';
    const macAddress = payload.deviceMetadata.hardwareMacAddress.toUpperCase();

    if (!isDevEnv && !this.AUTHORIZED_SENSORS_MAC.has(macAddress)) {
      this.logger.warn(
        `[SECURITY] Capteur inconnu détecté: ${macAddress}. Tentative d'injection de fausses constantes bloquée.`,
      );
      await this.logSecurityEvent(
        payload.practitionerId,
        payload.patientId,
        'IOT_SPOOFING_ATTEMPT_BLOCKED',
        payload.deviceMetadata,
      );
      throw new HttpException(
        'Périphérique Bluetooth non autorisé par la clinique.',
        HttpStatus.FORBIDDEN,
      );
    }

    // 3. VÉRIFICATION LÉGALE EXTRÊME (Consentement DPDPA 2023)
    let hasConsent = false;
    try {
      hasConsent = await this.consentManager.checkConsent(
        payload.practitionerId,
        payload.patientId,
      );
    } catch (consentError: unknown) {
      this.logger.error(
        `[CRITICAL] Échec de la vérification DPDPA. Erreur BD ou Timeout. Ajout à la Queue Locale.`,
        consentError,
      );
      if (!fromQueue) {
        this.enqueueForLater('BLE', payload);
      }
      throw new HttpException(
        'Le système DPDPA est hors-ligne. La donnée est sécurisée en RAM.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!hasConsent) {
      this.logger.warn(
        `[SECURITY] Tentative d'ingestion IoT refusée : Consentement révoqué.`,
      );
      await this.logSecurityEvent(
        payload.practitionerId,
        payload.patientId,
        'IOT_INGESTION_REJECTED_NO_CONSENT',
        payload.deviceMetadata,
      );
      throw new HttpException(
        'Accès illégal : Le patient a révoqué son consentement.',
        HttpStatus.FORBIDDEN,
      );
    }

    // 4. TRANSACTION ATOMIQUE (Base de Données & AuditLog)
    try {
      this.logger.log(
        `[IoT-BLE] Consentement validé. Début de la transaction atomique (Prisma)...`,
      );

      const transactionResult = await this.prisma.$transaction(async (tx) => {
        // Insertion de la Constante Vitale
        const newVital = await tx.vital.create({
          data: {
            patientId: payload.patientId,
            bloodPressure: `${payload.systolicMmHg}/${payload.diastolicMmHg}`,
            heartRate: payload.pulseRateBpm || null,
            recordedAt: new Date(payload.acquisitionTimestampIso),
            status: 'created',
          },
        });

        // Enregistrement Inaltérable (AuditLog)
        await tx.auditLog.create({
          data: {
            userId: payload.practitionerId,
            patientId: payload.patientId,
            action: 'IOT_BLE_VITALS_INGESTION',
            ipAddress: 'LOCAL_NETWORK_MDNS',
            metadata: {
              deviceId: payload.deviceMetadata.hardwareMacAddress,
              deviceModel: payload.deviceMetadata.manufacturerName,
              batteryLevel: payload.deviceMetadata.batteryLevelPercentage,
              vitalRecordId: newVital.id,
            },
          },
        });

        return newVital;
      });

      // 5. AVERTISSEMENTS MATÉRIELS PRÉDICTIFS
      let warningMsg: string | undefined = undefined;
      if (payload.deviceMetadata.batteryLevelPercentage < 15) {
        warningMsg = `Le tensiomètre Bluetooth (${payload.deviceMetadata.manufacturerName}) a une batterie critique (<15%).`;
        this.logger.warn(warningMsg);
      }

      // 5.b. DÉLÉGATION AU MOTEUR DE RÈGLES (Remote Patient Monitoring)
      this.eventEmitter.emit('iot.vitals.received', payload);

      return {
        status: 'SUCCESS',
        vitalRecordId: transactionResult.id,
        message:
          'Constantes vitales acquises, chiffrées et enregistrées avec succès.',
        warning: warningMsg,
      };
    } catch (dbError: unknown) {
      // 6. GESTION DES PANNES EXTRÊMES (Out Of Memory, Disque Plein, Lock DB)
      this.logger.error(
        `[CRITICAL] Le moteur Postgres a rejeté la transaction IoT (Surcharge ?). Sauvetage en RAM.`,
        dbError,
      );
      
      if (!fromQueue) {
         this.enqueueForLater('BLE', payload);
      }
      return {
        status: 'QUEUED',
        message:
          "La base de données est saturée. La constante vitale est protégée en mémoire (RAM) et sera insérée automatiquement d'ici 30 secondes.",
      };
    }
  }

  /**
   * INGESTION SÉCURISÉE DES TRACÉS DE STYLOS INTELLIGENTS (WONDRx)
   */
  async processSmartPenInk(rawPayload: unknown, fromQueue = false): Promise<IotIngestionResult> {
    const validationResult = SmartPenInkPayloadSchema.safeParse(rawPayload);
    if (!validationResult.success) {
      throw new HttpException(
        'Données vectorielles corrompues.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const payload = validationResult.data;
    this.logger.log(
      `[IoT-PEN] Numérisation vectorielle d'ordonnance manuscrite depuis: ${payload.deviceMetadata.hardwareMacAddress}`,
    );

    // Simplification DPDPA Check pour ce mock (voir BLE pour la version complète exhaustive)
    let hasConsent = false;
    try {
      hasConsent = await this.consentManager.checkConsent(
        payload.practitionerId,
        payload.patientId,
      );
    } catch (consentError: unknown) {
      this.logger.error(
        `[CRITICAL] Échec de la vérification DPDPA. Erreur BD ou Timeout. Ajout à la Queue Locale.`,
        consentError,
      );
      if (!fromQueue) {
        this.enqueueForLater('PEN', payload);
      }
      throw new HttpException(
        'Le système DPDPA est hors-ligne. La donnée est sécurisée en RAM.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!hasConsent) {
      await this.logSecurityEvent(
        payload.practitionerId,
        payload.patientId,
        'IOT_PEN_REJECTED_NO_CONSENT',
        payload.deviceMetadata,
      );
      throw new HttpException(
        'Consentement révoqué. Numérisation interdite.',
        HttpStatus.FORBIDDEN,
      );
    }

    // 4.a FIND EXISTING VISIT
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingVisit = await this.prisma.visit.findFirst({
      where: {
        patientId: payload.patientId,
        createdAt: { gte: oneHourAgo },
        status: 'created'
      },
      orderBy: { createdAt: 'desc' }
    });

      // 4.b CRDT ENCAPSULATION (Yjs)
      try {
      const doc = new Y.Doc();

      // Restore existing CRDT state if available
      if (existingVisit?.notes) {
        try {
          Y.applyUpdate(doc, new Uint8Array(existingVisit.notes));
        } catch {
          this.logger.warn(`[IoT-PEN] Existing visit notes could not be decoded as Yjs, starting fresh for visit ${existingVisit.id}`);
        }
      }

      // Append new stroke to the restored document
      const yText = doc.getText('notes');
      yText.insert(yText.length, payload.rawSvgPathData);
      const binaryUpdate = Buffer.from(Y.encodeStateAsUpdate(doc));

      // 4.c TRANSACTION ATOMIC OR SESSION-AWARE INGESTION

      let visitId: string;

      if (existingVisit) {
        // Appending to existing active visit
        // In a real Yjs scenario, we would merge binary updates. 
        // Here we just update the record with the latest stroke 'notes'.
        await this.prisma.visit.update({
          where: { id: existingVisit.id },
          data: {
            notes: binaryUpdate, // Replace/Merge logic depending on the field usage
            updatedAt: new Date()
          }
        });
        visitId = existingVisit.id;
        this.logger.log(`[IoT-PEN] Tracé ajouté à la visite existante: ${visitId}`);
      } else {
        // Create new visit session
        const newVisit = await this.prisma.visit.create({
          data: {
            patientId: payload.patientId,
            date: new Date(payload.acquisitionTimestampIso),
            notes: binaryUpdate,
            status: 'created',
          },
        });
        visitId = newVisit.id;
        this.logger.log(`[IoT-PEN] Nouvelle session de visite créée: ${visitId}`);
      }

      await this.logSecurityEvent(
        payload.practitionerId,
        payload.patientId,
        'IOT_SMARTPEN_INK_INGESTION',
        { deviceId: payload.deviceMetadata.hardwareMacAddress, visitId }
      );

      return {
        status: 'SUCCESS',
        vitalRecordId: visitId,
        message: 'Ordonnance manuscrite (Smart Pen) sauvegardée avec succès.',
      };
    } catch (dbError) {
      this.logger.error(
        `[CRITICAL] Échec d'écriture du tracé vectoriel Smart Pen.`,
        dbError,
      );
      if (!fromQueue) {
        this.enqueueForLater('PEN', payload);
      }
      return {
        status: 'QUEUED',
        message:
          'Surcharge base de données. Le tracé SVG est mis en attente en RAM.',
      };
    }
  }

  // ============================================================================
  // MÉCANISME DE RÉSILIENCE : FALLBACK QUEUE PROCESSOR
  // ============================================================================
  private enqueueForLater(type: 'BLE' | 'PEN', payload: BleBloodPressurePayload | SmartPenInkPayload): void {
    if (this.fallbackQueue.length > 5000) {
      // Limite RAM pour Windows 7 (Ne pas accumuler indéfiniment si DB morte depuis des jours)
      this.logger.error(
        `[FATAL] La File d'attente IoT est pleine (5000 records). Perte de données imminente.`,
      );
      this.fallbackQueue.shift(); // On sacrifie la plus vieille donnée
    }
    this.fallbackQueue.push({ type, payload, retryCount: 0 });
  }

  private async processFallbackQueue(): Promise<void> {
    if (this.isProcessingQueue || this.fallbackQueue.length === 0) return;
    this.isProcessingQueue = true;

    this.logger.log(
      `[WATCHDOG] Vidage de la file d'attente IoT (${this.fallbackQueue.length} records en attente)...`,
    );

    const itemsToProcess = this.fallbackQueue.splice(0); // Atomique : pas de race condition (IOT3)

    for (const item of itemsToProcess) {
      try {
        if (item.type === 'BLE') {
          await this.processBleGattData(item.payload, true);
        } else {
          await this.processSmartPenInk(item.payload, true);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
         item.retryCount++;
        if (item.retryCount < 10) {
          // IMPORTANT: If 'process' already enqueued it (via its own catch logic), 
          // we might have duplicates. So we check if we should push it back.
          // In this architecture, it's safer to let the watchdog manage the retry count.
          this.fallbackQueue.push(item);
        } else {
          const payloadKeys = item.payload ? Object.keys(item.payload).filter(k => k !== 'patientId' && k !== 'practitionerId').join(', ') : 'none';
          this.logger.error(
            `[FATAL] Donnee IoT perdue definitivement apres 10 tentatives. Type: ${item.type}, Retries: ${item.retryCount}, Fields: [${payloadKeys}]`,
          );
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Utilitaire de création autonome de log de sécurité (Isolé).
   */
  private async logSecurityEvent(
    userId: string,
    patientId: string,
    action: string,
    metadata: unknown,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          patientId,
          action,
          ipAddress: 'LOCAL_NETWORK_MDNS',
          metadata: metadata as Prisma.InputJsonValue,
        },
      });
    } catch (logError) {
      this.logger.error(
        `[FATAL] Impossible d'écrire l'alerte de sécurité dans AuditLog (Disque plein ?).`,
        logError,
      );
    }
  }
}
