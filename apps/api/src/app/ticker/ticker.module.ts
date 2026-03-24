import { Module } from '@nestjs/common';
import { EpiTickerService } from './epi-ticker.service';
import { TickerController } from './ticker.controller';
<<<<<<< HEAD
import { AuditModule } from '../audit/audit-dpdpa.module';

@Module({
  imports: [AuditModule],
=======

@Module({
>>>>>>> origin/main
  providers: [EpiTickerService],
  controllers: [TickerController],
  exports: [EpiTickerService]
})
export class TickerModule {}
