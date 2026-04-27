import { KioskService, KioskState } from './kiosk.service';
export declare class KioskController {
    private readonly kioskService;
    constructor(kioskService: KioskService);
    getKioskState(): Promise<KioskState>;
    callNextPatient(): Promise<{
        success: boolean;
        patient: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    }>;
    resetKiosk(): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=kiosk.controller.d.ts.map