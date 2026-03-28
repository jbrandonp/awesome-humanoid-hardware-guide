import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PatientEngagementService } from './engagement.service';
import { EngagementProcessor } from './engagement.processor';
import { EngagementController } from './engagement.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'engagement-whatsapp', // Nom de la file Redis
    }),
  ],
  providers: [PatientEngagementService, EngagementProcessor],
  controllers: [EngagementController],
  exports: [PatientEngagementService],
})
export class EngagementModule {}
