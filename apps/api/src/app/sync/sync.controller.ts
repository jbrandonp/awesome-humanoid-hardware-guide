import { Controller, Post, Body, Query, UseGuards, Headers, Res, HttpStatus } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';
import { FastifyReply } from 'fastify';

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
    const timestamp = parseInt(lastPulledAt, 10) || 0;

    let failedIds: string[] = [];

    // Process pushed changes from client
    if (changes) {
      failedIds = await this.syncService.pushChanges(changes, deviceId);
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
