import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AbdmService } from './abdm.service';
import { AbdmController } from './abdm.controller';
import { AbdmWebhookGateway } from './abdm-webhook.gateway';
import { AbdmProcessor } from './abdm.processor';
import { InventoryService } from './inventory.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'abdm-callbacks',
    }),
    PrismaModule,
  ],
  providers: [AbdmService, AbdmProcessor, InventoryService],
  controllers: [AbdmController, AbdmWebhookGateway],
})
export class AbdmModule {}
