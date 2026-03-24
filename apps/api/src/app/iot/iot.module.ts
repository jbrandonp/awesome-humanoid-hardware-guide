import { Module } from '@nestjs/common';
import { IotMedicalService } from './iot.service';
import { BioSensorService } from './biosensor.service';

<<<<<<< HEAD
@Module({
=======
import { DpdpaModule } from '../audit/audit-dpdpa.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DpdpaModule, PrismaModule],
>>>>>>> origin/main
  providers: [IotMedicalService, BioSensorService],
  exports: [IotMedicalService, BioSensorService]
})
export class IotModule {}
