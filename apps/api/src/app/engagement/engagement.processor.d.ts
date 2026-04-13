import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
export interface SendWhatsappJobData {
    notificationId: string;
    patientId: string;
    patientPhone: string;
    message: string;
}
export declare class EngagementProcessor extends WorkerHost {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    /**
     * TRAVAILLEUR ASYNCHRONE DE LA FILE D'ATTENTE (Consumer)
     * Protège l'UI du médecin contre les crashs de l'API Meta/WhatsApp.
     * Si ce bloc échoue 3 fois (défini dans Bull `attempts`), le message passe en erreur définitive.
     */
    process(job: Job<SendWhatsappJobData>): Promise<void>;
    /**
     * FALLBACK: Solution de secours lorsque WhatsApp est indisponible
     * (ex: Twilio ou passerelle SMS intégrée locale SMPP)
     */
    private triggerSmsFallback;
}
//# sourceMappingURL=engagement.processor.d.ts.map