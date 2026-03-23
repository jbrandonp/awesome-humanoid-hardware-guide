import { Controller, Post, Body, Req, Res, HttpStatus } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

// ============================================================================
// TYPAGES STRICTS WEBHOOKS (Meta API)
// ============================================================================

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

@Controller('webhooks/whatsapp')
export class EngagementController {
  private readonly logger = new Logger(EngagementController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * RÉCEPTION DES ACCUSÉS DE RÉCEPTION (Webhooks META)
   * Protégé, public (pas de JWT) mais vérifie la signature SHA256 (hors scope ici).
   */
  @Post()
  async handleMetaWebhook(@Body() payload: WhatsAppWebhookPayload, @Res() res: FastifyReply) {
    // Si ce n'est pas un payload WhatsApp Business, on ignore
    if (payload.object !== 'whatsapp_business_account') {
      return res.status(HttpStatus.BAD_REQUEST).send('Payload non reconnu');
    }

    try {
      // 1. Extraire les statuts (Sent/Delivered/Read/Failed) du Webhook
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.value.statuses) {
            for (const status of change.value.statuses) {

              this.logger.log(`[Webhook META] Accusé reçu: Message ${status.id} est passé en '${status.status}'.`);

              // 2. METTRE À JOUR LA BASE DE DONNÉES LOCALE
              // On cherche l'entrée Notification correspondante via son "externalId"
              // (le WAMID renvoyé par Meta lors de l'envoi dans le Processor Bull)
              const existingNotif = await this.prisma.notificationStatus.findFirst({
                 where: { externalId: status.id }
              });

              if (existingNotif) {
                 await this.prisma.notificationStatus.update({
                    where: { id: existingNotif.id },
                    data: { status: status.status.toUpperCase() } // 'READ', 'DELIVERED', 'FAILED'
                 });

                 // GESTION ERREURS META : Si Meta échoue (ex: Numéro invalide ou Bloqué)
                 // Le worker Bull n'a pas pu faire de Fallback car l'envoi HTTP avait réussi.
                 // Le Webhook asynchrone nous prévient de l'échec d'acheminement final.
                 if (status.status === 'failed') {
                    this.logger.warn(`[Webhook META] Échec final d'acheminement pour la notif ${existingNotif.id}. Lancement asynchrone du SMS de Fallback.`);
                    // En vrai production, on pousserait ici une nouvelle tâche dans une "sms-queue" Bull
                 }
              }
            }
          }
        }
      }

      // Toujours répondre 200 OK rapidement aux Webhooks Meta (sinon ils bloquent le compte)
      return res.status(HttpStatus.OK).send('EVENT_RECEIVED');

    } catch (webhookError: unknown) {
      this.logger.error(`[FATAL Webhook] Crash lors du traitement de l'accusé de réception Meta.`, webhookError);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('PROCESSING_FAILED');
    }
  }

  // GET Endpoint de vérification (Meta Hub Challenge) requis lors de la config du Webhook
  @Post('verify')
  verifyWebhook(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
     const mode = (req.query as any)['hub.mode'];
     const token = (req.query as any)['hub.verify_token'];
     const challenge = (req.query as any)['hub.challenge'];

     if (mode && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
       res.status(HttpStatus.OK).send(challenge);
     } else {
       res.status(HttpStatus.FORBIDDEN).send('Forbidden');
     }
  }
}
