import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalRecordService } from '../clinical-record/clinical-record.service';
import { randomUUID } from 'crypto';

interface AnonymizedRecord {
  anonymousId: string;
  isAnonymized: boolean;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

@Injectable()
export class PeerConsultService {
  private readonly logger = new Logger(PeerConsultService.name);

  constructor(
    private prisma: PrismaService,
    private clinicalRecordService: ClinicalRecordService,
  ) {}

  /**
   * Anonymisation stricte (Zero-PHI) d'un dossier MongoDB pour un second avis
   * Clone le dossier et masque toutes les données identifiantes.
   */
  anonymizeClinicalRecord(record: unknown): AnonymizedRecord {
    // Clonage profond pour éviter la mutation par référence
    const clonedRecord = JSON.parse(JSON.stringify(record));

    // Génération d'un UUID remplaçant les PII
    const anonymousId = randomUUID();

    // Suppression des clés identifiantes typiques
    delete clonedRecord.patientId;
    delete clonedRecord._id; // ID interne Mongo

    // Si le champ 'data' contient des infos textuelles structurées, on masque les identifiants connus
    if (clonedRecord.data) {
      delete clonedRecord.data.patientName;
      delete clonedRecord.data.phoneNumber;
      delete clonedRecord.data.address;
      delete clonedRecord.data.abhaNumber;
      delete clonedRecord.data.aadhar;
    }

    clonedRecord.anonymousId = anonymousId;
    clonedRecord.isAnonymized = true;

    return clonedRecord;
  }

  /**
   * Broadcast/Envoi d'un cas clinique vers une spécialité ou un confrère
   */
  async broadcastCase(
    doctorId: string,
    patientId: string,
    specialtyTarget: string,
    message: string,
    recordId: string,
  ): Promise<{ status: string; anonymousId: string; message: string }> {
    this.logger.log(
      `Médecin ${doctorId} demande un avis en ${specialtyTarget} pour le dossier ${recordId}`,
    );

    // 1. Vérification du Consentement (Loi DPDPA 2023)
    const consent = await this.prisma.dpdpaConsent.findFirst({
      where: {
        patientId: patientId,
        // On cherche un flag explicite ou le 'purpose' défini à NETWORK_CONSULT
        purpose: 'NETWORK_CONSULT',
        expiresAt: { gt: new Date() },
      },
    });

    if (!consent) {
      throw new ForbiddenException(
        "Le patient n'a pas donné son consentement explicite (NETWORK_CONSULT) pour la diffusion de ce dossier.",
      );
    }

    // 2. Récupération du dossier clinique (MongoDB) - OPTIMIZED: Fetch by ID directly
    const targetRecord =
      await this.clinicalRecordService.getPatientRecordById(recordId);

    if (!targetRecord) {
      throw new ForbiddenException('Dossier clinique introuvable.');
    }

    // 3. Anonymisation Radicale (Zero-PHI)
    const anonymizedRecord = this.anonymizeClinicalRecord(targetRecord);

    // 4. Traçabilité Inaltérable dans l'AuditLog
    await this.prisma.auditLog.create({
      data: {
        userId: doctorId,
        patientId: patientId,
        action: 'BROADCAST_CASE_NETWORK',
        metadata: {
          targetSpecialty: specialtyTarget,
          anonymousUUID: anonymizedRecord.anonymousId,
          question: message,
        },
      },
    });

    // 5. (Simulé) Routage vers le réseau de spécialistes
    this.logger.log(
      `[Réseau Spécialistes] Dossier anonymisé envoyé. UUID: ${anonymizedRecord.anonymousId}`,
    );

    return {
      status: 'BROADCAST_SUCCESS',
      anonymousId: anonymizedRecord.anonymousId,
      message:
        'Demande de second avis transmise au réseau des spécialistes avec succès.',
    };
  }
}
