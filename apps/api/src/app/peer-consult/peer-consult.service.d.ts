import { PrismaService } from '../prisma/prisma.service';
import { ClinicalRecordService } from '../clinical-record/clinical-record.service';
interface AnonymizedRecord {
    anonymousId: string;
    isAnonymized: boolean;
    data?: Record<string, unknown>;
    [key: string]: unknown;
}
export declare class PeerConsultService {
    private prisma;
    private clinicalRecordService;
    private readonly logger;
    constructor(prisma: PrismaService, clinicalRecordService: ClinicalRecordService);
    /**
     * Anonymisation stricte (Zero-PHI) d'un dossier MongoDB pour un second avis
     * Clone le dossier et masque toutes les données identifiantes.
     */
    anonymizeClinicalRecord(record: unknown): AnonymizedRecord;
    /**
     * Broadcast/Envoi d'un cas clinique vers une spécialité ou un confrère
     */
    broadcastCase(doctorId: string, patientId: string, specialtyTarget: string, message: string, recordId: string): Promise<{
        status: string;
        anonymousId: string;
        message: string;
    }>;
}
export {};
//# sourceMappingURL=peer-consult.service.d.ts.map