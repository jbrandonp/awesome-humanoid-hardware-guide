import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
export declare class AbdmProcessor extends WorkerHost {
    private readonly logger;
    constructor();
    process(job: Job<unknown, unknown, string>): Promise<void>;
    private processAuthOnInit;
}
//# sourceMappingURL=abdm.processor.d.ts.map