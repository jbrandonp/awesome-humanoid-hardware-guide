import { Module } from '@nestjs/common';
import { NursingStationController } from './nursing-station.controller';
import { NursingStationService } from './nursing-station.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HighAlertMedicationModule } from '../high-alert-medication/high-alert-medication.module';

@Module({
  imports: [PrismaModule, HighAlertMedicationModule],
  controllers: [NursingStationController],
  providers: [NursingStationService],
  exports: [NursingStationService],
})
export class NursingStationModule {}