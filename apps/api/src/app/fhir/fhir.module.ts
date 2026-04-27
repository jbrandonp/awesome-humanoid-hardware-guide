import { Module } from '@nestjs/common';
import { FhirService } from './fhir.service';
import { FhirController } from './fhir.controller';
import { FhirMapper } from './fhir.mapper';
import { SmartOnFhirGuard } from './smart-on-fhir.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';
import { DpdpaModule } from '../audit/audit-dpdpa.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule, DpdpaModule],
  providers: [FhirService, FhirMapper, SmartOnFhirGuard],
  controllers: [FhirController],
  exports: [FhirService]
})
export class FhirModule {}
