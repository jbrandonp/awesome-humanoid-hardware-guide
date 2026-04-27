import { PrismaService } from '../prisma/prisma.service';
export interface KioskPatient {
    id: string;
    firstName: string;
    lastName: string;
}
export interface KioskState {
    currentPatient: KioskPatient | null;
    lastCalledPatients: KioskPatient[];
    queueLength: number;
    estimatedWaitTime: number;
}
export declare class KioskService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    /**
     * Retrieves the current kiosk state.
     * Since there's no explicit "Queue" table, we deduce the state from the most recent Visits.
     * The most recently created Visit is considered the "currently called" patient.
     * The 5 preceding Visits are considered the "last called" patients.
     */
    getCurrentState(): Promise<KioskState>;
    callNextPatient(): Promise<{
        success: boolean;
        patient: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    }>;
    resetQueue(): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=kiosk.service.d.ts.map