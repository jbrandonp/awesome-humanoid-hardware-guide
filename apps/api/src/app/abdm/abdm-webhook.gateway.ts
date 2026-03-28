import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('v0.5')
export class AbdmWebhookGateway {
  private readonly logger = new Logger(AbdmWebhookGateway.name);

  constructor(
    @InjectQueue('abdm-callbacks') private readonly abdmQueue: Queue
  ) {}

  @Post('users/auth/on-init')
  @HttpCode(HttpStatus.ACCEPTED)
  async onAuthInit(@Body() payload: any) {
    this.logger.log(`Received ABDM callback: v0.5/users/auth/on-init`);
    await this.abdmQueue.add('process-auth-on-init', payload, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    return { status: 'QUEUED' };
  }

  // Add more webhook endpoints as needed, e.g., on-confirm, on-fetch, etc.
}
