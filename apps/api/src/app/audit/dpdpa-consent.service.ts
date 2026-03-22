import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DpdpaConsentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Vérifie si l'utilisateur possède un consentement valide.
   */
  async checkConsent(userId: string, patientId: string) {
    const consent = await this.prisma.dpdpaConsent.findFirst({
      where: {
        userId,
        patientId,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!consent) {
       return false;
    }
    return true;
  }

  /**
   * Accorde temporairement le consentement (via OTP Patient / QR Scan local).
   */
  async grantConsent(userId: string, patientId: string, durationMinutes: number, purpose: string) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    return this.prisma.dpdpaConsent.create({
      data: {
        userId,
        patientId,
        expiresAt,
        purpose
      }
    });
  }

  /**
   * Purge de consentement DPDPA:
   * Si le consentement est révoqué par le patient, le système doit purger
   * l'accès et déclencher la suppression locale côté client WatermelonDB.
   */
  async revokeConsent(userId: string, patientId: string) {
    const consent = await this.prisma.dpdpaConsent.findFirst({
        where: { userId, patientId }
    });

    if (!consent) {
        throw new NotFoundException('Consentement introuvable');
    }

    // On efface le consentement serveur
    await this.prisma.dpdpaConsent.deleteMany({
      where: { userId, patientId }
    });

    // Logique Tombstone / Soft Delete WatermelonDB:
    // Côté "SyncEngine", le système enverra un _status "deleted" ou purgera
    // les données locales du médecin la prochaine fois qu'il synchronisera
    // l'identifiant de ce patient (car son accès est révoqué et la ligne disparait).

    return { status: 'REVOKED', message: "Les données du patient seront purgées du cache local." };
  }
}
