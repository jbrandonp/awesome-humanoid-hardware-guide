import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
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
export declare class PatientEngagementService {
    private readonly whatsappQueue;
    private readonly prisma;
    private readonly logger;
    constructor(whatsappQueue: Queue, prisma: PrismaService);
    /**
     * INITIATION DE L'ENVOI (Producer)
     * Enregistre le message dans PostgreSQL (Traçabilité) et le pousse dans Redis (Bull)
     * afin que l'application ne perde aucune notification si l'API Meta est hors-ligne.
     */
    sendVaccinationReminder(payload: EngagementMessagePayload): Promise<EngagementResult>;
}
//# sourceMappingURL=engagement.service.d.ts.map