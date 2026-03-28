import { Controller, Post, Body, Query, UseGuards, Headers, Res } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';
import type { FastifyReply } from 'fastify';

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  @AuditLog('SYNC_PULL_PUSH')
  async synchronize(
    @Query('lastPulledAt') lastPulledAt: string,
    @Body('changes') changes: any,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
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

    let failedIds: string[] = [];

    // Process pushed changes from client
    if (changes) {
      await this.syncService.pushChanges(changes);
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
