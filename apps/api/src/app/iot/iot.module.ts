import { Module } from '@nestjs/common';
import { IotMedicalService } from './iot.service';
import { BioSensorService } from './biosensor.service';
import { IotController } from './iot.controller';

import { DpdpaModule } from '../audit/audit-dpdpa.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DpdpaModule, PrismaModule],
  controllers: [IotController],
  providers: [IotMedicalService, BioSensorService],
  exports: [IotMedicalService, BioSensorService]
})
export class IotModule {}
