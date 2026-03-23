import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY
// ============================================================================

export interface EngagementMessagePayload {
  patientId: string;
  patientPhone: string;
  patientName: string;
  vaccineName: string;
  dateStr: string;
  practitionerId: string;
}

export interface EngagementResult {
  status: 'QUEUED' | 'ERROR';
  notificationId?: string;
  message: string;
}

@Injectable()
export class PatientEngagementService {
  private readonly logger = new Logger(PatientEngagementService.name);

  constructor(
    @InjectQueue('engagement-whatsapp') private readonly whatsappQueue: Queue,
    private readonly prisma: PrismaService
  ) {}

  /**
   * INITIATION DE L'ENVOI (Producer)
   * Enregistre le message dans PostgreSQL (Traçabilité) et le pousse dans Redis (Bull)
   * afin que l'application ne perde aucune notification si l'API Meta est hors-ligne.
   */
  async sendVaccinationReminder(payload: EngagementMessagePayload): Promise<EngagementResult> {
    this.logger.log(`[WhatsApp Business] Préparation du rappel de vaccination (${payload.vaccineName}) pour le patient ${payload.patientId}.`);

    const messageTemplate = `Bonjour ${payload.patientName}, c'est le moment de votre vaccin : ${payload.vaccineName}. Nous vous attendons le ${payload.dateStr} à la clinique. 🏥`;

    try {
      // 1. Transaction Atomique : Sauvegarde du statut initial "QUEUED"
      const notification = await this.prisma.$transaction(async (tx) => {
         const notif = await tx.notificationStatus.create({
            data: {
               patientId: payload.patientId,
               channel: 'WHATSAPP',
               status: 'QUEUED',
               messagePayload: messageTemplate,
               failCount: 0
            }
         });

         // 2. Traçabilité (AuditLog HIPAA/DPDPA)
         await tx.auditLog.create({
            data: {
               userId: payload.practitionerId,
               patientId: payload.patientId,
               action: 'ENGAGEMENT_VACCINE_REMINDER_QUEUED',
               ipAddress: 'SERVER_PROCESS',
               metadata: { notificationId: notif.id, targetPhone: payload.patientPhone }
            }
         });

         return notif;
      });

      // 3. Délégation asynchrone à Redis (Bull)
      // Si NestJS crashe ici, Bull gardera la tâche en mémoire et la relancera au reboot.
      await this.whatsappQueue.add('send-whatsapp', {
        notificationId: notification.id,
        patientId: payload.patientId,
        patientPhone: payload.patientPhone,
        message: messageTemplate
      }, {
        attempts: 3, // Fallback interne Bull avant de déclarer la tâche échouée (Dead Letter)
        backoff: {
          type: 'exponential',
          delay: 5000 // 5s, 10s, 20s
        }
      });

      return {
        status: 'QUEUED',
        notificationId: notification.id,
        message: 'Le rappel a été placé dans la file d\'attente sécurisée (Redis) et sera envoyé sous peu.'
      };

    } catch (error: unknown) {
      this.logger.error(`[FATAL] Impossible de sécuriser le rappel dans la base ou la file Redis.`, error);
      return {
        status: 'ERROR',
        message: 'Service de communication temporairement indisponible.'
      };
    }
  }
}
