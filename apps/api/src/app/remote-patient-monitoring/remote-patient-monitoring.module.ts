import { Module } from '@nestjs/common';
import { RemotePatientMonitoringService } from './remote-patient-monitoring.service';
import { TickerModule } from '../ticker/ticker.module';

@Module({
  imports: [TickerModule],
  providers: [RemotePatientMonitoringService],
  exports: [RemotePatientMonitoringService],
})
export class RemotePatientMonitoringModule {}
