import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import type { CreateInvoicePayload } from './billing.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';

@Controller('billing')
@UseGuards(AuthGuard('jwt'))
export class BillingController {
  constructor(private readonly billingService: BillingService) { }

  @Post('invoice')
  @AuditLog('BILLING_GENERATE_INVOICE')
  async createInvoice(
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Body() payload: Omit<CreateInvoicePayload, 'idempotencyKey'>
  ): Promise<unknown> {
    if (
      !payload ||
      !idempotencyKey ||
      !payload.patientId ||
      !payload.items ||
      payload.items.length === 0
    ) {
      throw new HttpException(
        'Données de facturation (Payload Zéro-Any) incomplètes ou corrompues.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.billingService.generateInvoice({ ...payload, idempotencyKey });
  }
}
