import { BillingService } from './billing.service';
import type { CreateInvoicePayload } from './billing.service';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    createInvoice(idempotencyKey: string, payload: Omit<CreateInvoicePayload, 'idempotencyKey'>): Promise<unknown>;
}
//# sourceMappingURL=billing.controller.d.ts.map