import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AbdmService } from './abdm.service';

@Processor('abdm-callbacks')
export class AbdmProcessor extends WorkerHost {
  private readonly logger = new Logger(AbdmProcessor.name);

  constructor(private readonly abdmService: AbdmService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
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
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}: ${error.message}`, error.stack);
      throw error; // Let BullMQ handle retries
    }
  }

  private async processAuthOnInit(data: any) {
    // Process the callback data here. For example, updating the DB, triggering events, etc.
    this.logger.log(`Successfully processed auth on-init payload: ${JSON.stringify(data)}`);
    // Example: await this.abdmService.handleAuthOnInit(data);
  }
}
