import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';
import { ConsentManagerController } from './consent-manager.controller';
import { ConsentManagerService } from './consent-manager.service';
import { ConsentManagerProcessor } from './consent-manager.processor';

@Module({
  imports: [
    PrismaModule,
    ClinicalRecordModule,
    BullModule.registerQueue({
      name: 'consent-queue',
    }),
  ],
  controllers: [ConsentManagerController],
  providers: [ConsentManagerService, ConsentManagerProcessor],
  exports: [ConsentManagerService],
})
export class ConsentManagerModule {}
