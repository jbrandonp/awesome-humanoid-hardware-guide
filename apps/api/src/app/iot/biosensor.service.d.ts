export interface RppgVideoStreamPayload {
    patientId: string;
    practitionerId: string;
    fps: number;
    greenChannelMeans: number[];
    durationSeconds: number;
}
export interface BioSensorResult {
    status: 'SUCCESS' | 'POOR_SIGNAL_QUALITY';
    estimatedBpm?: number;
    confidenceScorePercentage: number;
    message: string;
}
export declare class BioSensorService {
    private readonly logger;
    private readonly MIN_HR_HZ;
    private readonly MAX_HR_HZ;
    /**
     * MOTEUR DE PHOTOPLÉTHYSMOGRAPHIE (rPPG) - DEEP DIVE
     *
     * Extrait le rythme cardiaque (BPM) à partir des micro-variations de couleur
     * de la peau capturées par l'objectif de la caméra du smartphone.
     *
     * L'algorithme est optimisé mathématiquement (Float64Array) pour ne pas exploser
     * la RAM du serveur Node.js, et gère les erreurs de mouvements brusques (Bruit).
     *
     * @param payload Données temporelles de la caméra (Green Channel Means)
     */
    processCameraPulseStream(payload: RppgVideoStreamPayload): BioSensorResult;
    /**
     * Implémentation bas niveau d'un Filtre Passe-Bande IIR (Infinite Impulse Response)
     * Isole la bande de fréquence (ex: 0.8 Hz à 3 Hz).
     * Mathématiques optimisées pour Node.js V8 (Évite la garbage collection en utilisant Float64Array).
     */
    private applyBandpassFilter;
    /**
     * Algorithme de détection de pics locaux dans un signal temporel
     * @returns Un tableau des indices (Frames) correspondant aux pics (battements cardiaques)
     */
    private findPeaks;
}
//# sourceMappingURL=biosensor.service.d.ts.map