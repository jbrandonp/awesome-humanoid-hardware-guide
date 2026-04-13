import { HighAlertMedicationService } from './high-alert-medication.service';
export declare class HighAlertMedicationController {
    private readonly service;
    private readonly logger;
    constructor(service: HighAlertMedicationService);
    createDualSignOff(payload: unknown): Promise<{
        message: string;
        status: string;
    }>;
}
//# sourceMappingURL=high-alert-medication.controller.d.ts.map