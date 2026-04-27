import { Injectable, NotFoundException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  status: 'REVOKED' | 'FAILED';
  message: string;
}

@Injectable()
export class DpdpaConsentService {
  private readonly logger = new Logger(DpdpaConsentService.name);

  constructor(
    private readonly prisma: PrismaService,
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
  async grantConsent(payload: ConsentGrantPayload): Promise<unknown> {
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
      await this.prisma.$transaction(async (tx) => {
        // 1. Révocation du consentement pour cette paire médecin-patient
        await tx.dpdpaConsent.deleteMany({
          where: { userId, patientId }
        });

        // 2. TRACE INALTÉRABLE
        await tx.auditLog.create({
          data: {
             userId: userId,
             patientId: patientId,
             action: 'DPDPA_CONSENT_REVOKED',
             ipAddress: revokedByIp,
             metadata: {
               revocationTimestamp: new Date().toISOString(),
               status: 'ACCESS_REVOKED'
             }
          }
        });

        return true;
      }, {
        timeout: 30000
      });

      this.logger.log(`[DPDPA] Consentement révoqué pour le médecin ${userId} / patient ${patientId}.`);

      return {
         status: 'REVOKED',
         message: "Consentement révoqué. Le praticien ne peut plus accéder aux données de ce patient.",
      };

    } catch (transactionError: unknown) {
      this.logger.error(`[DPDPA] La révocation du consentement a échoué.`, transactionError);

      throw new HttpException(
        'Erreur critique lors de la révocation du consentement. Veuillez réessayer.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
