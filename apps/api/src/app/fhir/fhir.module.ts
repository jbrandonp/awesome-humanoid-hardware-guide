import { Module } from '@nestjs/common';
import { FhirService } from './fhir.service';
import { FhirController } from './fhir.controller';

@Module({
  providers: [FhirService],
  controllers: [FhirController],
  exports: [FhirService]
})
export class FhirModule {}
