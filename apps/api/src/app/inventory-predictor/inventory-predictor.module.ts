import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryPredictorService } from './inventory-predictor.service';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule
  ],
  providers: [InventoryPredictorService],
  exports: [InventoryPredictorService],
})
export class InventoryPredictorModule {}
