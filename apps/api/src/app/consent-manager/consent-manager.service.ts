import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface RevokeConsentJobPayload {
  patientId: string;
  userId?: string;
  ipAddress: string;
}

@Injectable()
export class ConsentManagerService {
  private readonly logger = new Logger(ConsentManagerService.name);

  constructor(
    @InjectQueue('consent-queue') private readonly consentQueue: Queue
  ) {}

  async enqueueRevocationJob(payload: RevokeConsentJobPayload): Promise<string> {
    this.logger.log(`Enqueuing revocation job for patient: ${payload.patientId}`);

    const job = await this.consentQueue.add('revoke-consent-job', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    return job.id as string;
  }
}
