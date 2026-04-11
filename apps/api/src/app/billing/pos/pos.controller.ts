import { Controller, Post, Body, Headers, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReconciliationService } from './reconciliation.service';
import type {
  OpenSessionPayload,
  ProcessTransactionPayload,
  RefundPayload,
  CloseSessionPayload,
} from './reconciliation.service';
import { AuditLog } from '../../audit/audit.decorator';

@Controller('register')
@UseGuards(AuthGuard('jwt'))
export class PosController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('open')
  @AuditLog('POS_OPEN_SESSION')
  async openSession(@Body() payload: OpenSessionPayload): Promise<unknown> {
    if (!payload || !payload.terminalId || !payload.cashierId || payload.openingFloatCents === undefined) {
      throw new HttpException('Données incomplètes pour l\'ouverture de caisse.', HttpStatus.BAD_REQUEST);
    }
    return this.reconciliationService.openSession(payload);
  }

  @Post('transaction')
  @AuditLog('POS_PROCESS_TRANSACTION')
  async processTransaction(
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Body() payload: Omit<ProcessTransactionPayload, 'idempotencyKey'>
  ): Promise<unknown> {
    if (
      !payload ||
      !payload.sessionId ||
      !payload.invoiceId ||
      !idempotencyKey ||
      !payload.payments ||
      payload.payments.length === 0
    ) {
      throw new HttpException('Données d\'encaissement incomplètes ou clé d\'idempotence manquante.', HttpStatus.BAD_REQUEST);
    }
    return this.reconciliationService.processTransaction({ ...payload, idempotencyKey });
  }

  @Post('refund')
  @AuditLog('POS_PROCESS_REFUND')
  async processRefund(
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Body() payload: Omit<RefundPayload, 'idempotencyKey'>
  ): Promise<unknown> {
    if (
      !payload ||
      !payload.sessionId ||
      !payload.invoiceId ||
      !payload.originalTransactionId ||
      payload.refundAmountCents === undefined ||
      !payload.reason ||
      !idempotencyKey
    ) {
      throw new HttpException('Données de remboursement incomplètes ou clé d\'idempotence manquante.', HttpStatus.BAD_REQUEST);
    }

    // Application stricte du RBAC pour le remboursement dépassant le seuil métier
    const REFUND_SUPERVISOR_THRESHOLD_CENTS = 500000;
    if (payload.refundAmountCents > REFUND_SUPERVISOR_THRESHOLD_CENTS) {
      if (!payload.supervisorId) {
        throw new HttpException('Un ID de superviseur (ADMIN) est requis pour les remboursements dépassant le seuil.', HttpStatus.FORBIDDEN);
      }
    }

    return this.reconciliationService.processRefund({ ...payload, idempotencyKey });
  }

  @Post('close')
  @AuditLog('POS_CLOSE_SESSION')
  async closeSession(@Body() payload: CloseSessionPayload): Promise<unknown> {
    if (
      !payload ||
      !payload.sessionId ||
      !payload.cashierId ||
      !payload.denominations ||
      payload.cardTotalCents === undefined ||
      payload.upiTotalCents === undefined
    ) {
      throw new HttpException('Données de clôture de caisse incomplètes.', HttpStatus.BAD_REQUEST);
    }
    return this.reconciliationService.closeSession(payload);
  }
}
