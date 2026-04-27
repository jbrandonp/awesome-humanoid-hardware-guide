import { ProcurementService } from './procurement.service';
export declare class ProcurementController {
    private readonly procurementService;
    constructor(procurementService: ProcurementService);
    getDrafts(): Promise<unknown>;
    approveDraft(id: string, body: unknown): Promise<unknown>;
}
//# sourceMappingURL=procurement.controller.d.ts.map