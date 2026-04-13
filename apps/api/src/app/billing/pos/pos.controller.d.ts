import { ReconciliationService } from './reconciliation.service';
import type { OpenSessionPayload, ProcessTransactionPayload, RefundPayload, CloseSessionPayload } from './reconciliation.service';
export declare class PosController {
    private readonly reconciliationService;
    constructor(reconciliationService: ReconciliationService);
    openSession(payload: OpenSessionPayload): Promise<unknown>;
    processTransaction(idempotencyKey: string, payload: Omit<ProcessTransactionPayload, 'idempotencyKey'>): Promise<unknown>;
    processRefund(idempotencyKey: string, payload: Omit<RefundPayload, 'idempotencyKey'>): Promise<unknown>;
    closeSession(payload: CloseSessionPayload): Promise<unknown>;
}
//# sourceMappingURL=pos.controller.d.ts.map