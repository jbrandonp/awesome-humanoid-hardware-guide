import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export type InventoryCategory = 'ANTI_MALARIAL' | 'ANTIBIOTIC' | 'ANALGESIC' | 'ANTI_DENGUE' | 'ANTI_PYRETIC' | 'GENERAL';
export interface SeasonalFactor {
    multiplier: number;
    reason: string;
}
export interface PredictiveAlert {
    itemId: string;
    itemName: string;
    category: InventoryCategory;
    currentStock: number;
    dynamicThreshold: number;
    recommendedOrder: number;
    reason: string;
}
export declare class InventoryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    /**
     * Moteur d'Inventaire Prédictif (Deep Dive)
     * Calcule les besoins en médicaments en croisant la consommation des 3 derniers mois
     * avec les facteurs de saisonnalité (ex: Mousson = Pics de paludisme).
     */
    runPredictiveAnalysis(): Promise<PredictiveAlert[]>;
    /**
     * P2P - Procure-to-Pay : Création automatique d'un Bon de Commande (Purchase Order) au statut DRAFT.
     * Remplace l'ancienne génération PDF directe.
     */
    generateDraftPurchaseOrder(itemId: string, requestedQuantity: number, tx: Prisma.TransactionClient): Promise<void>;
}
//# sourceMappingURL=inventory.service.d.ts.map