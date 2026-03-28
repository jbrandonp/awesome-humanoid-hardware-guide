import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit-dpdpa.module';
import { PacsIndexerProcessor } from './pacs-indexer.processor';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    BullModule.registerQueue({
      name: 'pacs-indexer',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  providers: [PacsIndexerProcessor],
  exports: [BullModule],
})
export class PacsIndexerModule {}
