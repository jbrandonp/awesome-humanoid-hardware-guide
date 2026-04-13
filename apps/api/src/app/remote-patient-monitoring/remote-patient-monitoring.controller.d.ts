import { RemotePatientMonitoringService } from './remote-patient-monitoring.service';
export declare class RemotePatientMonitoringController {
    private readonly remotePatientMonitoringService;
    constructor(remotePatientMonitoringService: RemotePatientMonitoringService);
    getVitals(patientId?: string): Promise<any[]>;
    getLatestVitals(patientId: string): Promise<any>;
    getAlerts(): Promise<any[]>;
    createVitals(body: unknown): Promise<any>;
}
//# sourceMappingURL=remote-patient-monitoring.controller.d.ts.map