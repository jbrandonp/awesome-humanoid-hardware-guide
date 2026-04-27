import type { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';
export interface WhatsAppWebhookPayload {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                statuses?: Array<{
                    id: string;
                    status: 'sent' | 'delivered' | 'read' | 'failed';
                    timestamp: string;
                    recipient_id: string;
                }>;
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    type: string;
                    text?: {
                        body: string;
                    };
                }>;
            };
            field: string;
        }>;
    }>;
}
export declare class EngagementController {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    /**
     * RÉCEPTION DES ACCUSÉS DE RÉCEPTION (Webhooks META)
     * Protégé, public (pas de JWT) mais vérifie la signature SHA256 (hors scope ici).
     */
    handleMetaWebhook(payload: WhatsAppWebhookPayload, res: FastifyReply): Promise<void>;
    verifyWebhook(req: FastifyRequest, res: FastifyReply): void;
}
//# sourceMappingURL=engagement.controller.d.ts.map