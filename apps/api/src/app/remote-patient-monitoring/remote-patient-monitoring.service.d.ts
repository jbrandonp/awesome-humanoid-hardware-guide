import type { BleBloodPressurePayload } from '../iot/iot.service';
import { EpiTickerService } from '../ticker/epi-ticker.service';
export declare class RemotePatientMonitoringService {
    private readonly tickerService;
    private readonly logger;
    private lastMeasurements;
    private mockVitals;
    private mockAlerts;
    private readonly SYSTOLIC_THRESHOLD_MMHG;
    constructor(tickerService: EpiTickerService);
    handleVitalsReceived(payload: BleBloodPressurePayload): void;
    private evaluateCriticalThresholds;
    private triggerHighPriorityAlert;
    getVitals(patientId?: string): Promise<any[]>;
    getLatestVitals(patientId: string): Promise<any | null>;
    getAlerts(): Promise<any[]>;
    createVitals(data: any): Promise<any>;
}
//# sourceMappingURL=remote-patient-monitoring.service.d.ts.map