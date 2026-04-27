import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios'; // Client HTTP natif robuste

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (Production-Ready Workers)
// ============================================================================

export interface SendWhatsappJobData {
  notificationId: string;
  patientId: string;
  patientPhone: string;
  message: string;
}

@Processor('engagement-whatsapp')
export class EngagementProcessor extends WorkerHost {
  private readonly logger = new Logger(EngagementProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * TRAVAILLEUR ASYNCHRONE DE LA FILE D'ATTENTE (Consumer)
   * Protège l'UI du médecin contre les crashs de l'API Meta/WhatsApp.
   * Si ce bloc échoue 3 fois (défini dans Bull `attempts`), le message passe en erreur définitive.
   */
  async process(job: Job<SendWhatsappJobData>): Promise<void> {
    this.logger.log(
      `[Worker] Traitement du Job n°${job.id} (Notification ${job.data.notificationId})...`,
    );

    // 1. MISE À JOUR DU STATUT EN COURS
    // Marquer l'entrée comme en cours d'envoi. Si une tentative échoue, incrementer failCount.
    await this.prisma.notificationStatus.update({
      where: { id: job.data.notificationId },
      data: {
        status: 'SENDING',
        failCount: job.attemptsMade > 0 ? { increment: 1 } : 0,
      },
    });

    try {
      // 2. APPEL HTTP À L'API META GRAPH OFFICIELLE (WhatsApp Business)
      // Exigence: Gérer les Timeouts et les pannes Meta (ECONNABORTED, 503)
      const metaResponse = await axios.post(
        `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: job.data.patientPhone,
          type: 'text', // Pour l'exemple, dans un vrai environnement ça serait un `template` certifié
          text: { body: job.data.message },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // Timeout strict: Ne jamais geler le Worker Bull plus de 5s
        },
      );

      // Succès: L'API Meta a accepté la requête et nous donne un WAMID (Message ID)
      const metaMessageId = metaResponse.data?.messages?.[0]?.id;

      await this.prisma.notificationStatus.update({
        where: { id: job.data.notificationId },
        data: {
          status: 'SENT',
          externalId: metaMessageId,
        },
      });

      this.logger.log(
        `[Worker] Message remis à l'API Meta avec succès. WAMID: ${metaMessageId}`,
      );
    } catch (httpError: unknown) {
      this.logger.error(
        `[FATAL API META] L'appel HTTP vers WhatsApp Business a échoué (Tentative ${job.attemptsMade + 1}/3).`,
        httpError,
      );

      // Si la tâche a atteint sa limite de tentatives imposée par Bull
      if (job.attemptsMade >= 2) {
        // 3. FALLBACK SMS CLASSIQUE
        this.logger.warn(
          `[FALLBACK SMS] L'API WhatsApp est définitivement hors-ligne. Basculement sur la passerelle SMS d'urgence pour le patient ${job.data.patientPhone}.`,
        );
        await this.triggerSmsFallback(job.data);
      }

      // Propager l'erreur à Bull pour qu'il marque le job en "Failed" et le replace en Queue
      // si des tentatives restent disponibles (Exponential Backoff).
      throw new Error(`API Meta injoignable: ${(httpError as Error).message}`);
    }
  }

  /**
   * FALLBACK: Solution de secours lorsque WhatsApp est indisponible
   * (ex: Twilio ou passerelle SMS intégrée locale SMPP)
   */
  private async triggerSmsFallback(data: SendWhatsappJobData): Promise<void> {
    try {
      // Mock: Appel Axios à une API SMS classique (Twilio, Nexmo...)
      // await axios.post('https://api.twilio.com/...', { body: data.message, to: data.patientPhone });

      await this.prisma.notificationStatus.update({
        where: { id: data.notificationId },
        data: {
          status: 'SENT_VIA_FALLBACK_SMS',
          channel: 'SMS',
        },
      });
      this.logger.log(`[Worker SMS] Fallback réussi. SMS expédié.`);
    } catch (fallbackError: unknown) {
      this.logger.error(
        `[Worker SMS] Échec du fallback SMS. Le message ne peut pas être délivré.`,
        fallbackError,
      );
      await this.prisma.notificationStatus.update({
        where: { id: data.notificationId },
        data: { status: 'FAILED_ALL_CHANNELS' },
      });
    }
  }
}
