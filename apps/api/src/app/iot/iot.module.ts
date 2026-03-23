import { Module } from '@nestjs/common';
import { IotMedicalService } from './iot.service';
import { BioSensorService } from './biosensor.service';

@Module({
  providers: [IotMedicalService, BioSensorService],
  exports: [IotMedicalService, BioSensorService],
})
export class IotModule {}
