import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TickerModule } from '../ticker/ticker.module';

@Module({
  imports: [PrismaModule, TickerModule],
  providers: [SyncService],
  controllers: [SyncController],
  exports: [SyncService]
})
export class SyncModule {}
