import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AbdmService } from './abdm.service';
import { AbdmController } from './abdm.controller';
import { AbdmWebhookGateway } from './abdm-webhook.gateway';
import { AbdmProcessor } from './abdm.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'abdm-callbacks',
    }),
  ],
  providers: [AbdmService, AbdmProcessor],
  controllers: [AbdmController, AbdmWebhookGateway],
})
export class AbdmModule {}
