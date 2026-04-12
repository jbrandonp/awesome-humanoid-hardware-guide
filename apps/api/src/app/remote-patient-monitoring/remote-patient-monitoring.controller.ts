import { Controller, Get, Param, Query } from '@nestjs/common';
import { RemotePatientMonitoringService } from './remote-patient-monitoring.service';

@Controller('remote-patient-monitoring')
export class RemotePatientMonitoringController {
  constructor(private readonly remotePatientMonitoringService: RemotePatientMonitoringService) {}

  @Get('vitals')
  async getVitals(@Query('patientId') patientId?: string) {
    return this.remotePatientMonitoringService.getVitals(patientId);
  }

  @Get('vitals/latest/:patientId')
  async getLatestVitals(@Param('patientId') patientId: string) {
    return this.remotePatientMonitoringService.getLatestVitals(patientId);
  }

  @Get('alerts')
  async getAlerts() {
    return this.remotePatientMonitoringService.getAlerts();
  }
}