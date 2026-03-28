import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AuditModule } from '../audit/audit-dpdpa.module';

@Module({
  imports: [AuditModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
