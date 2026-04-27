import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';
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
export declare class ReconciliationService {
    private readonly prisma;
    private readonly logger;
    private readonly REFUND_SUPERVISOR_THRESHOLD_CENTS;
    constructor(prisma: PrismaService);
    openSession(payload: OpenSessionPayload): Promise<unknown>;
    processTransaction(payload: ProcessTransactionPayload): Promise<unknown>;
    processRefund(payload: RefundPayload): Promise<unknown>;
    closeSession(payload: CloseSessionPayload): Promise<unknown>;
}
//# sourceMappingURL=reconciliation.service.d.ts.map