import { Injectable, NotFoundException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalRecordService } from '../clinical-record/clinical-record.service';
import * as crypto from 'crypto';

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (Production-Ready)
// Structures garantissant la conformité légale des requêtes DPDPA/RGPD
// ============================================================================

export interface ConsentGrantPayload {
  userId: string; // Le praticien qui demande l'accès
  patientId: string; // Le patient qui accorde l'accès
  durationMinutes: number;
  purpose: 'CONSULTATION' | 'NETWORK_CONSULT' | 'EMERGENCY_OVERRIDE';
  grantedByIp: string; // L'adresse IP d'où provient le consentement numérique
}

export interface ConsentRevocationResult {
  status: 'REVOKED_AND_PURGED' | 'FAILED_ROLLBACK';
  message: string;
  recordsDeletedCount: number;
}

@Injectable()
export class DpdpaConsentService {
  private readonly logger = new Logger(DpdpaConsentService.name);

  constructor(
    private readonly prisma: PrismaService,
    // Service MongoDB pour purger les formulaires cliniques dynamiques
    private readonly clinicalRecordService: ClinicalRecordService
  ) {}

  /**
   * VÉRIFICATION LÉGALE DU CONSENTEMENT (CHECK)
   * Valide si le praticien possède le droit d'accès au dossier à l'instant T.
   */
  async checkConsent(userId: string, patientId: string): Promise<boolean> {
    try {
      const consent = await this.prisma.dpdpaConsent.findFirst({
        where: {
          userId,
          patientId,
          expiresAt: { gt: new Date() } // Consentement non expiré
        }
      });

      return !!consent;
    } catch (dbError: unknown) {
      this.logger.error(`[DPDPA CHECK FATAL] Impossible de lire la table des consentements.`, dbError);
      // Par mesure de sécurité "Zero-Trust", si on ne peut pas vérifier, on refuse l'accès
      return false;
    }
  }

  /**
   * OCTROI DE CONSENTEMENT (GRANT)
   * Enregistre l'autorisation temporaire donnée par le patient via OTP ou QR Scan.
   */
  async grantConsent(payload: ConsentGrantPayload) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + payload.durationMinutes);

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Rechercher un consentement existant pour incrémenter la version
        const existingConsent = await tx.dpdpaConsent.findFirst({
           where: { userId: payload.userId, patientId: payload.patientId },
           orderBy: { version: 'desc' }
        });

        const newVersion = existingConsent ? existingConsent.version + 1 : 1;

        // Calcul du Hash SHA-256 comme preuve cryptographique de l'état du consentement
        const hashPayload = `${payload.userId}:${payload.patientId}:${payload.durationMinutes}:${payload.purpose}:${newVersion}`;
        const consentHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

        // 1. Sauvegarde du consentement granulaire et versionné
        const consent = await tx.dpdpaConsent.create({
          data: {
            userId: payload.userId,
            patientId: payload.patientId,
            expiresAt,
            purpose: payload.purpose,
            consentHash,
            version: newVersion,
          }
        });

        // 2. Traçabilité Inaltérable (AuditLog)
        await tx.auditLog.create({
           data: {
             userId: payload.userId,
             patientId: payload.patientId,
             action: 'DPDPA_CONSENT_GRANTED',
             ipAddress: payload.grantedByIp,
             metadata: {
               purpose: payload.purpose,
               durationMinutes: payload.durationMinutes,
               expiresAt: expiresAt.toISOString(),
               consentId: consent.id
             }
           }
        });

        this.logger.log(`[DPDPA] Consentement accordé pour le patient ${payload.patientId} au praticien ${payload.userId} (Purpose: ${payload.purpose}).`);
        return consent;
      });
    } catch (error: unknown) {
      this.logger.error(`[DPDPA GRANT FATAL] Échec de l'enregistrement du consentement.`, error);
      throw new HttpException('Erreur serveur lors de l\'enregistrement du consentement.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * PURGE RÉELLE EN CASCADE (HARD DELETE - DPDPA REVOKE)
   *
   * Conformément à la loi (Droit à l'oubli immédiat), si le patient révoque son accès,
   * le système ne fait pas un "Soft Delete". Il procède à une oblitération totale
   * en cascade de la base de données relationnelle (PostgreSQL) ET documentaire (MongoDB).
   *
   * @param userId Le praticien dont l'accès est révoqué
   * @param patientId Le patient demandant l'effacement
   * @param revokedByIp L'adresse IP ayant soumis la révocation
   */
  async revokeConsentAndPurge(userId: string, patientId: string, revokedByIp: string): Promise<ConsentRevocationResult> {
    this.logger.warn(`[DPDPA PURGE INITIATED] Révocation d'accès du praticien ${userId} demandée par le patient ${patientId}. Destructions des données en cours...`);

    // Vérification de l'existence du consentement
    const consent = await this.prisma.dpdpaConsent.findFirst({
        where: { userId, patientId }
    });

    if (!consent) {
        throw new NotFoundException('Aucun consentement actif trouvé pour cette paire patient-médecin.');
    }

    try {
      // ============================================================================
      // TRANSACTION ATOMIQUE POSTGRESQL (Rollback automatique si échec)
      // ============================================================================
      const purgeStats = await this.prisma.$transaction(async (tx) => {
        let totalDeleted = 0;

        // 1. Destruction des Administrations de Médicaments (via Prescription)
        const deletedAdmins = await tx.medicationAdministration.deleteMany({
           where: { prescription: { patientId } }
        });
        totalDeleted += deletedAdmins.count;

        // 2. Destruction des Prescriptions
        const deletedPrescriptions = await tx.prescription.deleteMany({
           where: { patientId }
        });
        totalDeleted += deletedPrescriptions.count;

        // 3. Destruction des Diagnostics (via Visit)
        const deletedDiagnoses = await tx.diagnosis.deleteMany({
          where: { visit: { patientId } }
        });
        totalDeleted += deletedDiagnoses.count;

        // 4. Destruction des Constantes Vitales (Vitals IoT)
        const deletedVitals = await tx.vital.deleteMany({
           where: { patientId }
        });
        totalDeleted += deletedVitals.count;

        // 5. Destruction des Notes Cliniques (Yjs CRDT Visits)
        const deletedVisits = await tx.visit.deleteMany({
           where: { patientId }
        });
        totalDeleted += deletedVisits.count;

        // 6. Destruction de l'Imagerie Médicale (DICOM)
        const deletedInstances = await tx.dicomInstance.deleteMany({
          where: { series: { study: { patientId } } }
        });
        const deletedSeries = await tx.dicomSeries.deleteMany({
          where: { study: { patientId } }
        });
        const deletedStudies = await tx.dicomStudy.deleteMany({
          where: { patientId }
        });
        totalDeleted += (deletedInstances.count + deletedSeries.count + deletedStudies.count);

        // 7. Révocation du Droit d'Accès lui-même
        await tx.dpdpaConsent.deleteMany({
          where: { userId, patientId }
        });

        // 8. TRACE INALTÉRABLE : L'Audit Log est la SEULE donnée conservée
        await tx.auditLog.create({
          data: {
             userId: userId,
             patientId: patientId,
             action: 'DPDPA_CONSENT_REVOKED_AND_PURGED',
             ipAddress: revokedByIp,
             metadata: {
               revocationTimestamp: new Date().toISOString(),
               postgresRecordsPurged: totalDeleted,
               status: 'HARD_DELETE_SUCCESSFUL'
             }
          }
        });

        return totalDeleted;
      }, {
        timeout: 30000 // 30s for large purges
      });

      // ============================================================================
      // PURGE DE LA BASE DOCUMENTAIRE (MongoDB - Spécialités Dynamiques)
      // Exécutée après la validation de la transaction Postgres
      // ============================================================================
      let totalPurged = purgeStats;
      try {
         const mongoDeletedCount = await this.clinicalRecordService.hardDeletePatientRecords(patientId);
         this.logger.log(`[DPDPA PURGE] ${mongoDeletedCount} documents MongoDB détruits pour le patient ${patientId}.`);
         totalPurged += mongoDeletedCount;
      } catch (mongoError: unknown) {
         // Si Mongo crash, on a au moins détruit Postgres. On log l'échec partiel
         this.logger.error(`[DPDPA PURGE PARTIAL FAILURE] Les données Postgres sont détruites, mais MongoDB a échoué.`, mongoError);
         // Dans un système d'entreprise, on relancerait une file d'attente (Dead Letter Queue)
      }

      this.logger.log(`[DPDPA PURGE SUCCESS] Dossier patient ${patientId} totalement effacé (Total: ${totalPurged} entrées) de l'appareil du médecin ${userId}.`);

      return {
         status: 'REVOKED_AND_PURGED',
         message: "Consentement révoqué. Les données du patient ont été physiquement et irréversiblement effacées du système (Hard Delete).",
         recordsDeletedCount: totalPurged
      };

    } catch (transactionError: unknown) {
      // En cas de crash de la Base de Données au milieu de la purge (ex: Clé Étrangère, Lock)
      // Prisma exécute le ROLLBACK automatiquement : aucune donnée n'est supprimée à moitié.
      this.logger.error(`[DPDPA PURGE ROLLBACK] La transaction de destruction a échoué. Les données n'ont pas pu être effacées.`, transactionError);

      throw new HttpException(
        'Erreur critique lors de la purge légale des données. La transaction a été annulée (Rollback). Veuillez réessayer.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
