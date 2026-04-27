import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { ReconciliationService } from './pos/reconciliation.service';
import { PosController } from './pos/pos.controller';

@Module({
  providers: [BillingService, ReconciliationService],
  controllers: [BillingController, PosController],
})
export class BillingModule {}
