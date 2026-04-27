import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('abdm-callbacks')
export class AbdmProcessor extends WorkerHost {
  private readonly logger = new Logger(AbdmProcessor.name);

  constructor() {
    super();
  }

  async process(job: Job<unknown, unknown, string>): Promise<void> {
    this.logger.log(`Processing ABDM job: ${job.name} (Job ID: ${job.id})`);

    try {
      switch (job.name) {
        case 'process-auth-on-init':
          await this.processAuthOnInit(job.data);
          break;
        // Add more job processors here as needed
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to process job ${job.id}: ${errMsg}`, errStack);
      throw error; // Let BullMQ handle retries
    }
  }

  private async processAuthOnInit(data: unknown): Promise<void> {
    // Process the callback data here. For example, updating the DB, triggering events, etc.
    this.logger.log(`Successfully processed auth on-init payload: ${JSON.stringify(data)}`);
    // Example: await this.abdmService.handleAuthOnInit(data);
  }
}
