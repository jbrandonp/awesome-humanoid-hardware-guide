import { Queue } from 'bullmq';
export interface RevokeConsentJobPayload {
    patientId: string;
    userId?: string;
    ipAddress: string;
}
export declare class ConsentManagerService {
    private readonly consentQueue;
    private readonly logger;
    constructor(consentQueue: Queue);
    enqueueRevocationJob(payload: RevokeConsentJobPayload): Promise<string>;
}
//# sourceMappingURL=consent-manager.service.d.ts.map