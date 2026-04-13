import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
export type TickerAlertType = 'EPIDEMIOLOGY' | 'INVENTORY' | 'SYSTEM' | 'INCIDENT';
export interface TickerAlert {
    id: string;
    type: TickerAlertType;
    message: string;
    timestamp: Date;
}
export interface EpidemiologicalStats {
    icd10Code: string;
    casesToday: number;
    averageCasesLast14Days: number;
    zScore: number;
    isAnomalous: boolean;
}
export declare class EpiTickerService {
    private readonly prisma;
    private readonly logger;
    private readonly tickerStream;
    private readonly EPIDEMIC_MULTIPLIER_THRESHOLD;
    private readonly MIN_CASES_REQUIRED_FOR_ALERT;
    constructor(prisma: PrismaService);
    /**
     * Retourne le flux observable pour les abonnés SSE (Tauri/React)
     */
    getTickerStream(): Observable<TickerAlert>;
    /**
     * DATA MINING LOCAL & ANONYMISÉ (Epi-Ticker)
     *
     * S'exécute automatiquement toutes les heures sans requérir d'interaction humaine.
     * L'algorithme ne rapatrie pas les millions de lignes dans la RAM de NestJS.
     * Il délègue l'agrégation statistique au moteur SQL (PostgreSQL via Prisma),
     * protégeant ainsi l'empreinte mémoire stricte de l'application sur Windows 7.
     */
    analyzeLocalEpidemiology(): Promise<void>;
    /**
     * Passerelle pour injecter des alertes externes (ex: Predictive Inventory)
     */
    broadcastAlert(alert: TickerAlert): void;
}
//# sourceMappingURL=epi-ticker.service.d.ts.map