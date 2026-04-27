import { Controller, Post, Body, Get, Put, Param } from '@nestjs/common';
import { QueueService } from './queue.service';
import { TriageInputSchema } from './triage.schema';
import { z } from 'zod';

const AddPatientSchema = z.object({
  patientId: z.string().uuid(),
  input: TriageInputSchema,
});

const OverrideTriageSchema = z.object({
  newScore: z.number().min(1).max(5),
  nurseId: z.string().uuid(),
  overrideReason: z.string().min(1),
});

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('add')
  async addPatient(@Body() body: unknown) {
    const data = AddPatientSchema.parse(body);
    return this.queueService.addPatientToQueue(data.patientId, data.input);
  }

  @Get()
  async getQueue() {
    return this.queueService.getQueue();
  }

  @Put(':patientId/override')
  async overrideTriage(
    @Param('patientId') patientId: string,
    @Body() body: unknown,
  ) {
    const data = OverrideTriageSchema.parse(body);
    return this.queueService.overrideTriageScore(
      patientId,
      data.newScore,
      data.nurseId,
      data.overrideReason,
    );
  }
}