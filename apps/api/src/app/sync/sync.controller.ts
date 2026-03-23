import { Controller, Post, Get, Body, Query, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';
import { CompressionInterceptor } from './compression.interceptor';

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(CompressionInterceptor)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  private countChanges(changes: any): number {
    let count = 0;
    if (!changes) return count;

    for (const entityKey of Object.keys(changes)) {
      const entityChanges = changes[entityKey];
      if (entityChanges) {
        if (Array.isArray(entityChanges.created)) count += entityChanges.created.length;
        if (Array.isArray(entityChanges.updated)) count += entityChanges.updated.length;
        if (Array.isArray(entityChanges.deleted)) count += entityChanges.deleted.length;
      }
    }
    return count;
  }

  @Get('pullChanges')
  @AuditLog('SYNC_PULL')
  async pullChanges(
    @Query('lastPulledAt') lastPulledAt: string,
    @Query('limit') limit = '500'
  ) {
    if (!lastPulledAt || isNaN(Number(lastPulledAt))) {
      throw new BadRequestException('lastPulledAt must be a valid numeric timestamp');
    }

    const timestamp = parseInt(lastPulledAt, 10);
    const now = Date.now();

    if (timestamp > now) {
       throw new BadRequestException('lastPulledAt cannot be in the future');
    }

    const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 500, 500)); // Max 500 records par requête, min 1

    // Generate pull changes from server
    // Returns { changes, timestamp } where timestamp is the latest fetched record's updatedAt or the original timestamp
    const result = await this.syncService.pullChanges(timestamp, limitNum);

    return result;
  }

  @Post('pushChanges')
  @AuditLog('SYNC_PUSH')
  async pushChanges(
    @Body('changes') changes: any
  ) {
    if (!changes) {
      throw new BadRequestException('Missing changes payload');
    }

    const recordCount = this.countChanges(changes);
    if (recordCount > 500) {
      throw new BadRequestException(`Changes payload exceeds limit of 500 records. Received ${recordCount} records.`);
    }

    // Process pushed changes from client
    await this.syncService.pushChanges(changes);

    return { success: true };
  }

  @Post()
  @AuditLog('SYNC_PULL_PUSH')
  async synchronize(
    @Query('lastPulledAt') lastPulledAt: string,
    @Body('changes') changes: any,
    @Query('limit') limit = '500'
  ) {
    if (!lastPulledAt || isNaN(Number(lastPulledAt))) {
      throw new BadRequestException('lastPulledAt must be a valid numeric timestamp');
    }

    const timestamp = parseInt(lastPulledAt, 10);
    const now = Date.now();

    if (timestamp > now) {
       throw new BadRequestException('lastPulledAt cannot be in the future');
    }

    const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 500, 500));

    // Process pushed changes from client
    if (changes) {
      const recordCount = this.countChanges(changes);
      if (recordCount > 500) {
        throw new BadRequestException(`Changes payload exceeds limit of 500 records. Received ${recordCount} records.`);
      }
      await this.syncService.pushChanges(changes);
    }

    // Generate pull changes from server
    const result = await this.syncService.pullChanges(timestamp, limitNum);

    return result;
  }
}
