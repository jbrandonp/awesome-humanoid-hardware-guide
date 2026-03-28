import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (Inventory Prediction Engine)
// ============================================================================

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

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Moteur d'Inventaire Prédictif (Deep Dive)
   * Calcule les besoins en médicaments en croisant la consommation des 3 derniers mois
   * avec les facteurs de saisonnalité (ex: Mousson = Pics de paludisme).
   */
  async runPredictiveAnalysis(): Promise<PredictiveAlert[]> {
    this.logger.log(`[Predictive Inventory] Début de l'analyse croisée (Historique + Saisonnalité)...`);
    const alerts: PredictiveAlert[] = [];

    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11

    // 1. DÉFINITION DYNAMIQUE DE LA SAISONNALITÉ (Modèle de contexte local : Inde)
    // Mousson : typiquement de Juin (5) à Septembre (8)
    const isMonsoon = currentMonth >= 5 && currentMonth <= 8;
    // Hiver : Novembre (10) à Février (1)
    const isWinter = currentMonth >= 10 || currentMonth <= 1;

    // 2. EXÉCUTION SÉCURISÉE (Transaction Prisma)
    // Utilisation d'une transaction pour garantir une vue cohérente entre le stock actuel et l'historique
    await this.prisma.$transaction(async (tx) => {

      // On récupère tous les articles suivis en inventaire
      const items = await tx.inventoryItem.findMany({
        where: { isActive: true }
      });

      // Date d'il y a 3 mois (90 jours)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setDate(now.getDate() - 90);

      for (const item of items) {

        // --- A. Calcul de la Consommation de Base (Historique 3 mois) ---
        // On aggrège toutes les prescriptions validées ou les sorties de stock manuelles
        const historicalConsumptionResult = await tx.inventoryTransaction.aggregate({
          _sum: {
            quantityChange: true
          },
          where: {
            itemId: item.id,
            timestamp: { gte: threeMonthsAgo },
            type: 'DISPENSE' // Uniquement les sorties
          }
        });

        // La consommation passée sur 90 jours (on rend positif le changement qui était négatif en DB)
        const past90DaysUsage = Math.abs(historicalConsumptionResult._sum.quantityChange || 0);

        // Consommation moyenne journalière "baseline"
        const averageDailyUsage = past90DaysUsage / 90;

        // Temps de réapprovisionnement estimé en jours (Lead Time)
        const leadTimeDays = item.leadTimeDays || 7;

        // Stock de sécurité de base (ex: 14 jours de couverture supplémentaire)
        const baseSafetyStockDays = 14;

        // --- B. Application du Facteur de Saisonnalité (Seuil Dynamique) ---
        let seasonalFactor: SeasonalFactor = { multiplier: 1.0, reason: 'Consommation normale' };

        if (item.category === 'ANTI_MALARIAL' || item.category === 'ANTI_DENGUE') {
           if (isMonsoon) {
             // En période de mousson, la demande en antipaludéens explose (x3)
             seasonalFactor = { multiplier: 3.0, reason: 'Risque épidémique lié à la mousson (Paludisme/Dengue)' };
           }
        } else if (item.category === 'ANALGESIC' || item.category === 'ANTI_PYRETIC') {
           if (isWinter) {
             // En hiver, légère hausse des maladies respiratoires / fièvres
             seasonalFactor = { multiplier: 1.5, reason: 'Saison hivernale (Grippe/Fièvre)' };
           }
        }

        // --- C. Calcul du Seuil Critique Dynamique ---
        // Formule: (Demande Journalière * Temps de Réappro) + (Stock de Sécurité)
        // Le tout pondéré par le risque saisonnier.
        const projectedDailyUsage = averageDailyUsage * seasonalFactor.multiplier;

        const reorderPoint = Math.ceil(
          (projectedDailyUsage * leadTimeDays) + (projectedDailyUsage * baseSafetyStockDays)
        );

        // --- D. Détection et Alerte ---
        if (item.quantity <= reorderPoint) {

           // Si on est en dessous du seuil, on calcule combien commander pour tenir 1 mois (30 jours)
           // au rythme de la demande projetée.
           const recommendedOrder = Math.ceil((projectedDailyUsage * 30) - item.quantity);

           alerts.push({
             itemId: item.id,
             itemName: item.name,
             category: item.category as InventoryCategory,
             currentStock: item.quantity,
             dynamicThreshold: reorderPoint,
             recommendedOrder: recommendedOrder > 0 ? recommendedOrder : 0,
             reason: `Stock critique (${item.quantity} < ${reorderPoint}). ${seasonalFactor.reason}`
           });

           this.logger.warn(`[Alerte Inventaire] ${item.name} en rupture imminente. Seuil ajusté à ${reorderPoint}. Recommandation: commander ${recommendedOrder}.`);

           if (recommendedOrder > 0) {
             await this.generateDraftPurchaseOrder(item.id, recommendedOrder, tx);
           }
        }
      }
    });

    this.logger.log(`[Predictive Inventory] Analyse terminée. ${alerts.length} alertes générées.`);
    return alerts;
  }

  /**
   * P2P - Procure-to-Pay : Création automatique d'un Bon de Commande (Purchase Order) au statut DRAFT.
   * Remplace l'ancienne génération PDF directe.
   */
  async generateDraftPurchaseOrder(itemId: string, requestedQuantity: number, tx: any) {
    const item = await tx.inventoryItem.findUnique({
      where: { id: itemId },
      include: { supplier: true }
    });

    if (!item) return;

    // Idempotency: Verify no DRAFT or PENDING_APPROVAL order already exists for this item
    const existingOrder = await tx.purchaseOrderItem.findFirst({
      where: {
        inventoryItemId: itemId,
        purchaseOrder: {
          status: { in: ['DRAFT', 'PENDING_APPROVAL'] }
        }
      }
    });

    if (existingOrder) {
      this.logger.log(`[P2P] Ignoré : Une commande (DRAFT/PENDING) existe déjà pour l'article ${item.name}.`);
      return;
    }

    // Auto-select preferred supplier (from item.supplierId)
    // If none, we could fetch the first available active supplier or leave it unassigned (but schema requires supplierId)
    let supplierId = item.supplierId;
    if (!supplierId) {
      const defaultSupplier = await tx.supplier.findFirst({ where: { isActive: true } });
      if (!defaultSupplier) {
        this.logger.error(`[P2P] Aucun fournisseur actif trouvé pour commander ${item.name}. Action requise.`);
        return;
      }
      supplierId = defaultSupplier.id;
    }

    // Apply Minimum Order Quantity (MOQ)
    const finalQuantity = Math.max(requestedQuantity, item.moq);
    const lineTotalCents = item.unitPriceCents * finalQuantity;

    this.logger.log(`[P2P] Création du PurchaseOrder DRAFT pour ${item.name} (Qté: ${finalQuantity}, Fournisseur: ${supplierId})`);

    await tx.purchaseOrder.create({
      data: {
        supplierId: supplierId,
        status: 'DRAFT',
        totalCents: lineTotalCents, // Simplified: 1 order = 1 item for auto-generated drafts
        items: {
          create: [{
            inventoryItemId: item.id,
            quantity: finalQuantity,
            unitPriceCents: item.unitPriceCents // Assuming purchase price is roughly the unitPriceCents for this example
          }]
        }
      }
    });
  }
}
