import { Queue } from 'bullmq';
export declare class AbdmWebhookGateway {
    private readonly abdmQueue;
    private readonly logger;
    constructor(abdmQueue: Queue);
    onAuthInit(payload: unknown): Promise<{
        status: string;
    }>;
}
//# sourceMappingURL=abdm-webhook.gateway.d.ts.map