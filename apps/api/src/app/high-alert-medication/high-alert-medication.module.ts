import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit-dpdpa.module';
import { HighAlertMedicationService } from './high-alert-medication.service';
import { HighAlertMedicationController } from './high-alert-medication.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [HighAlertMedicationService],
  controllers: [HighAlertMedicationController],
  exports: [HighAlertMedicationService],
})
export class HighAlertMedicationModule {}
