import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  @AuditLog('SYNC_PULL_PUSH')
  async synchronize(
    @Query('lastPulledAt') lastPulledAt: string,
    @Body('changes') changes: any
  ) {
    const timestamp = parseInt(lastPulledAt, 10) || 0;

    // Process pushed changes from client
    if (changes) {
      await this.syncService.pushChanges(changes);
    }

    // Generate pull changes from server
    const pullChanges = await this.syncService.pullChanges(timestamp);

    return {
      changes: pullChanges,
      timestamp: Date.now()
    };
  }
}
