import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalRecordService } from '../clinical-record/clinical-record.service';
import { RevokeConsentJobPayload } from './consent-manager.service';
export declare class ConsentManagerProcessor extends WorkerHost {
    private readonly prisma;
    private readonly clinicalRecordService;
    private readonly logger;
    constructor(prisma: PrismaService, clinicalRecordService: ClinicalRecordService);
    process(job: Job<RevokeConsentJobPayload, unknown, string>): Promise<{
        success: boolean;
        recordsUpdatedCount: number;
    } | unknown>;
}
//# sourceMappingURL=consent-manager.processor.d.ts.map