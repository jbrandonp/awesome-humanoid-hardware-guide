import { Module } from '@nestjs/common';
import { EpiTickerService } from './epi-ticker.service';
import { TickerController } from './ticker.controller';

@Module({
  providers: [EpiTickerService],
  controllers: [TickerController],
  exports: [EpiTickerService],
})
export class TickerModule {}
