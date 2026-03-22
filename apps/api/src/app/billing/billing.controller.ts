import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { BillingService, BillItem } from './billing.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';

@Controller('billing')
@UseGuards(AuthGuard('jwt'))
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('calculate')
  @AuditLog('BILLING_CALCULATE')
  async calculateInvoice(
    @Body('items') items: BillItem[],
    @Body('currency') currency: string,
    @Body('taxRate') taxRate: number
  ) {
    if (!items || items.length === 0) {
      return { error: 'Aucun article à facturer.' };
    }

    // Support multi-devises et taxes locales
    const invoice = this.billingService.calculateTotal(items, currency || 'INR', taxRate || 0.05);

    return {
      message: 'Facture calculée',
      invoice
    };
  }
}
