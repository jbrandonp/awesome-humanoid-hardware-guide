import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterStatus, TransactionType, PaymentMethod } from '@prisma/client';

export interface OpenSessionPayload {
  terminalId: string;
  cashierId: string;
  openingFloatCents: number;
}

export interface FractionatedPayment {
  amountCents: number;
  paymentMethod: PaymentMethod;
}

export interface ProcessTransactionPayload {
  sessionId: string;
  invoiceId: string;
  idempotencyKey: string;
  payments: FractionatedPayment[];
}

export interface RefundPayload {
  sessionId: string;
  invoiceId: string;
  originalTransactionId: string;
  refundAmountCents: number;
  reason: string;
  supervisorId?: string;
  idempotencyKey: string;
}

export interface Denomination {
  valueCents: number;
  count: number;
}

export interface CloseSessionPayload {
  sessionId: string;
  cashierId: string;
  denominations: Denomination[];
  cardTotalCents: number;
  upiTotalCents: number;
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);
  private readonly REFUND_SUPERVISOR_THRESHOLD_CENTS = 500000; // 5000 INR (assuming 1 INR = 100 paise)

  constructor(private readonly prisma: PrismaService) {}

  async openSession(payload: OpenSessionPayload) {
    // Vérifier si une session est déjà ouverte pour ce terminal ou ce caissier
    const existingSession = await this.prisma.cashRegisterSession.findFirst({
      where: {
        OR: [{ terminalId: payload.terminalId }, { cashierId: payload.cashierId }],
        status: RegisterStatus.OPEN,
      },
    });

    if (existingSession) {
      throw new HttpException(
        `Une session est déjà ouverte pour ce terminal (${existingSession.terminalId}) ou ce caissier.`,
        HttpStatus.CONFLICT
      );
    }

    const session = await this.prisma.cashRegisterSession.create({
      data: {
        terminalId: payload.terminalId,
        cashierId: payload.cashierId,
        openingFloatCents: payload.openingFloatCents,
        status: RegisterStatus.OPEN,
      },
    });

    this.logger.log(`Session de caisse ouverte: ${session.id} (Fonds initial: ${session.openingFloatCents})`);
    return session;
  }

  async processTransaction(payload: ProcessTransactionPayload) {
    const session = await this.prisma.cashRegisterSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.status !== RegisterStatus.OPEN) {
      throw new HttpException('Session invalide ou fermée.', HttpStatus.BAD_REQUEST);
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payload.invoiceId },
    });

    if (!invoice) {
      throw new HttpException('Facture introuvable.', HttpStatus.NOT_FOUND);
    }

    // Calcul du total fractionné (entiers uniquement)
    const totalPaymentsCents = payload.payments.reduce((acc, curr) => acc + curr.amountCents, 0);
    
    // We allow payments >= invoice total (to handle change, though change logic is simplified here)
    if (totalPaymentsCents < invoice.totalCents && invoice.status !== 'PAID') {
       // In a real system we might allow partial payments, but for this exercise let's assume full settlement
       if (totalPaymentsCents !== invoice.totalCents) {
          throw new HttpException(`Le montant fractionné (${totalPaymentsCents}) ne correspond pas au total de la facture (${invoice.totalCents}).`, HttpStatus.BAD_REQUEST);
       }
    }

    // Idempotency: verify if this general idempotency key or invoice was already fully paid
    const existingTx = await this.prisma.financialTransaction.findFirst({
      where: { idempotencyKey: payload.idempotencyKey },
    });

    if (existingTx) {
      this.logger.warn(`Transaction déjà traitée (Idempotency Key: ${payload.idempotencyKey})`);
      return { status: 'ALREADY_PROCESSED', message: 'Transaction déjà enregistrée.' };
    }

    // Utilisation de transaction Prisma pour atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      const transactions = [];
      for (let i = 0; i < payload.payments.length; i++) {
        const p = payload.payments[i];
        const idempotencyKey = `${payload.idempotencyKey}-${i}`; // derive unique keys
        
        // Ensure derived key is not used
        const exists = await tx.financialTransaction.findUnique({ where: { idempotencyKey } });
        if(exists) continue;

        const transaction = await tx.financialTransaction.create({
          data: {
            sessionId: payload.sessionId,
            invoiceId: payload.invoiceId,
            type: TransactionType.PAYMENT,
            amountCents: p.amountCents,
            paymentMethod: p.paymentMethod,
            idempotencyKey: idempotencyKey,
            metadata: { originalIdempotencyKey: payload.idempotencyKey, index: i },
          },
        });
        transactions.push(transaction);
      }

      await tx.invoice.update({
        where: { id: payload.invoiceId },
        data: { status: 'PAID' },
      });

      return transactions;
    });

    return { status: 'SUCCESS', transactions: result };
  }

  async processRefund(payload: RefundPayload) {
    const session = await this.prisma.cashRegisterSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.status !== RegisterStatus.OPEN) {
      throw new HttpException('Session invalide ou fermée.', HttpStatus.BAD_REQUEST);
    }

    const originalTx = await this.prisma.financialTransaction.findUnique({
      where: { id: payload.originalTransactionId },
    });

    if (!originalTx) {
      throw new HttpException('Transaction originale introuvable.', HttpStatus.NOT_FOUND);
    }

    if (payload.refundAmountCents > originalTx.amountCents) {
      throw new HttpException('Le montant du remboursement dépasse la transaction originale.', HttpStatus.BAD_REQUEST);
    }

    // RBAC: Supervision requise pour les gros montants
    if (payload.refundAmountCents > this.REFUND_SUPERVISOR_THRESHOLD_CENTS) {
      if (!payload.supervisorId) {
        throw new HttpException(
          `Ce montant nécessite l'approbation d'un superviseur (> ${this.REFUND_SUPERVISOR_THRESHOLD_CENTS} cents).`,
          HttpStatus.FORBIDDEN
        );
      }
      
      const supervisor = await this.prisma.user.findUnique({ where: { id: payload.supervisorId } });
      if (!supervisor || supervisor.role !== 'ADMIN') { // Only ADMIN can approve
        throw new HttpException('Superviseur invalide ou droits insuffisants.', HttpStatus.FORBIDDEN);
      }
    }

    // Vérification Idempotence
    const existingRefund = await this.prisma.financialTransaction.findUnique({
      where: { idempotencyKey: payload.idempotencyKey },
    });

    if (existingRefund) {
      return { status: 'ALREADY_PROCESSED', transaction: existingRefund };
    }

    const refundTx = await this.prisma.financialTransaction.create({
      data: {
        sessionId: payload.sessionId,
        invoiceId: payload.invoiceId,
        type: TransactionType.REFUND,
        amountCents: -Math.abs(payload.refundAmountCents), // Négatif
        paymentMethod: originalTx.paymentMethod,
        idempotencyKey: payload.idempotencyKey,
        supervisorId: payload.supervisorId,
        metadata: { reason: payload.reason, originalTxId: originalTx.id },
      },
    });

    return { status: 'SUCCESS', transaction: refundTx };
  }

  async closeSession(payload: CloseSessionPayload) {
    const session = await this.prisma.cashRegisterSession.findUnique({
      where: { id: payload.sessionId },
      include: { financialTransactions: true },
    });

    if (!session || session.status !== RegisterStatus.OPEN) {
      throw new HttpException('Session introuvable ou déjà fermée.', HttpStatus.BAD_REQUEST);
    }

    if (session.cashierId !== payload.cashierId) {
      throw new HttpException('Seul le caissier ayant ouvert la session peut la clôturer.', HttpStatus.FORBIDDEN);
    }

    // 1. Calculer le total attendu en base
    let expectedCashCents = session.openingFloatCents;
    let expectedCardCents = 0;
    let expectedUpiCents = 0;

    for (const tx of session.financialTransactions) {
      if (tx.paymentMethod === PaymentMethod.CASH) {
        expectedCashCents += tx.amountCents;
      } else if (tx.paymentMethod === PaymentMethod.CARD) {
        expectedCardCents += tx.amountCents;
      } else if (tx.paymentMethod === PaymentMethod.UPI) {
        expectedUpiCents += tx.amountCents;
      }
    }

    const expectedTotalAmountCents = expectedCashCents + expectedCardCents + expectedUpiCents;

    // 2. Calculer le total déclaré
    let actualCashCents = 0;
    for (const denom of payload.denominations) {
      actualCashCents += (denom.valueCents * denom.count);
    }

    const actualTotalAmountCents = actualCashCents + payload.cardTotalCents + payload.upiTotalCents;

    // 3. Calcul de l'écart
    const discrepancyCents = actualTotalAmountCents - expectedTotalAmountCents;
    
    // Si l'écart dépasse 2% du total attendu, PENDING_APPROVAL
    const twoPercentCents = Math.round(expectedTotalAmountCents * 0.02);
    const requiresApproval = Math.abs(discrepancyCents) > twoPercentCents;
    
    const finalStatus = requiresApproval ? RegisterStatus.PENDING_APPROVAL : RegisterStatus.CLOSED;

    const updatedSession = await this.prisma.cashRegisterSession.update({
      where: { id: session.id },
      data: {
        expectedCloseAmountCents: expectedTotalAmountCents,
        actualCloseAmountCents: actualTotalAmountCents,
        discrepancyCents: discrepancyCents,
        status: finalStatus,
        closedAt: new Date(),
      },
    });

    if (requiresApproval) {
      this.logger.warn(`Clôture de session ${session.id} nécessite une approbation (Écart: ${discrepancyCents} cents)`);
    } else {
      this.logger.log(`Session ${session.id} clôturée avec succès.`);
    }

    return updatedSession;
  }
}
