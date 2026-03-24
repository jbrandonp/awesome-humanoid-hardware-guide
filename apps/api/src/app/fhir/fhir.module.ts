import { Module } from '@nestjs/common';
import { FhirService } from './fhir.service';
import { FhirController } from './fhir.controller';
<<<<<<< HEAD

@Module({
  providers: [FhirService],
=======
import { FhirMapper } from './fhir.mapper';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
  providers: [FhirService, FhirMapper],
>>>>>>> origin/main
  controllers: [FhirController],
  exports: [FhirService]
})
export class FhirModule {}
