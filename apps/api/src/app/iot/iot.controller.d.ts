import { IotMedicalService } from './iot.service';
export declare class IotController {
    private readonly iotService;
    private readonly logger;
    constructor(iotService: IotMedicalService);
    /**
     * Endpoint pour recevoir les données de pression artérielle des dispositifs BLE
     * Authentification requise via JWT (à implémenter avec un guard)
     */
    receiveBleBloodPressure(body: unknown): Promise<{
        success: boolean;
        message: string;
        data?: unknown;
    }>;
    /**
     * Endpoint pour recevoir les données d'encre des stylos intelligents
     * Utilisé pour la saisie de prescriptions manuscrites numérisées
     */
    receiveSmartPenInk(body: unknown): Promise<{
        success: boolean;
        message: string;
        data?: unknown;
    }>;
    /**
     * Endpoint de santé pour les dispositifs IoT
     * Permet aux dispositifs de vérifier la connectivité et d'obtenir leur configuration
     */
    deviceHeartbeat(body: unknown): Promise<{
        status: string;
        timestamp: string;
        configuration?: unknown;
    }>;
}
//# sourceMappingURL=iot.controller.d.ts.map