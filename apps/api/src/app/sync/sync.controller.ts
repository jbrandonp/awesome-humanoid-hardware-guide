import { Controller, Post, Body, Query, UseGuards, Headers, Res, BadRequestException } from '@nestjs/common';
import { SyncService, type SyncPushPayload } from './sync.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';
import type { FastifyReply } from 'fastify';
import { z, ZodError } from 'zod';
import { PatientSchema, VisitSchema, VitalsSchema, PrescriptionSchema } from '@systeme-sante/models';

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  @AuditLog('SYNC_PULL_PUSH')
  async synchronize(
    @Query('lastPulledAt') lastPulledAt: string,
    @Body('changes') changes: unknown,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: FastifyReply
  ): Promise<{ changes: unknown; timestamp: number; failedIds?: string[] }> {
    let timestamp = 0;
    if (lastPulledAt) {
      if (!isNaN(Number(lastPulledAt))) {
        timestamp = parseInt(lastPulledAt, 10);
      } else {
        const date = new Date(lastPulledAt);
        if (!isNaN(date.getTime())) {
          timestamp = date.getTime();
        }
      }
    }

    const failedIds: string[] = [];

    // Process pushed changes from client
    if (changes) {
      // Validate changes against SyncPushPayload schema
      const SyncPushPayloadSchema = z.object({
        patients: z.object({
          created: z.array(PatientSchema).optional(),
          updated: z.array(PatientSchema).optional(),
          deleted: z.array(z.string()).optional(),
        }).optional(),
        visits: z.object({
          created: z.array(VisitSchema).optional(),
          updated: z.array(VisitSchema).optional(),
          deleted: z.array(z.string()).optional(),
        }).optional(),
        prescriptions: z.object({
          created: z.array(PrescriptionSchema).optional(),
          updated: z.array(PrescriptionSchema).optional(),
          deleted: z.array(z.string()).optional(),
        }).optional(),
        vitals: z.object({
          created: z.array(VitalsSchema).optional(),
          updated: z.array(VitalsSchema).optional(),
          deleted: z.array(z.string()).optional(),
        }).optional(),
      }).optional();

      try {
        const validatedChanges = SyncPushPayloadSchema.parse(changes);
        await this.syncService.pushChanges(validatedChanges as SyncPushPayload);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new BadRequestException({
            message: 'Invalid sync payload format',
            errors: error.issues,
          });
        }
        throw error;
      }
    }

    // Generate pull changes from server
    const pullChanges = await this.syncService.pullChanges(timestamp);

    if (failedIds.length > 0) {
      res.status(207);
    }

    return {
      changes: pullChanges,
      timestamp: Date.now(),
      ...(failedIds.length > 0 && { failedIds }),
    };
  }
}
