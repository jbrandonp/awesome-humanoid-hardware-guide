import { Controller, Get, Param, Query, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RemotePatientMonitoringService } from './remote-patient-monitoring.service';
import { VitalsSchema } from '@systeme-sante/models';
import { z } from 'zod';

const CreateVitalsSchema = VitalsSchema.omit({ id: true, _status: true, deleted_at: true })
  .merge(z.object({
    recordedAt: z.string().datetime().optional().default(new Date().toISOString()),
  }))
  .extend({
    systolic: z.number().optional().nullable(),
    diastolic: z.number().optional().nullable(),
    respiratoryRate: z.number().optional().nullable(),
    oxygenSaturation: z.number().optional().nullable(),
    glucose: z.number().optional().nullable(),
  })
  .transform((data) => ({
    ...data,
    bloodPressure: data.systolic ? `${data.systolic}/${data.diastolic}` : undefined,
  }));

@Controller('remote-patient-monitoring')
@UseGuards(AuthGuard('jwt'))
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

  @Post('vitals')
  async createVitals(@Body() body: unknown) {
    const data = CreateVitalsSchema.parse(body);
    return this.remotePatientMonitoringService.createVitals(data);
  }
}