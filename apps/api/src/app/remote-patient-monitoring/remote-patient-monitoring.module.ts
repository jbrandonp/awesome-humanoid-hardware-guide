import { Module } from '@nestjs/common';
import { RemotePatientMonitoringService } from './remote-patient-monitoring.service';
import { RemotePatientMonitoringController } from './remote-patient-monitoring.controller';
import { TickerModule } from '../ticker/ticker.module';

@Module({
  imports: [TickerModule],
  controllers: [RemotePatientMonitoringController],
  providers: [RemotePatientMonitoringService],
  exports: [RemotePatientMonitoringService],
})
export class RemotePatientMonitoringModule {}
