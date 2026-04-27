import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateLineTotalCents, calculatePercentageCents } from './billing.utils';

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (Production-Ready Financial Engine)
// ============================================================================

export interface BillItem {
  inventoryItemName: string;
  quantity: number;
}

export interface CreateInvoicePayload {
  idempotencyKey: string; // UUID unique généré par la tablette au moment du clic
  patientId: string;
  practitionerId: string;
  items: BillItem[];
  currency?: string; // Default: 'INR'
  taxRatePercent?: number; // Default: 5% (0.05)
}

export interface InvoiceResult {
  status: 'SUCCESS' | 'ALREADY_PROCESSED';
  invoiceId: string;
  totalCents: number;
  currency: string;
  message: string;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * MOTEUR DE FACTURATION & D'INVENTAIRE (Idempotence & Cents-Maths)
   *
   * Traite la création d'une facture et met à jour les stocks locaux en une
   * unique transaction atomique. Empêche la double-facturation si un docteur
   * clique deux fois sur le bouton "Facturer" ou si la tablette perd le WiFi.
   */
  async generateInvoice(payload: CreateInvoicePayload): Promise<InvoiceResult> {
    this.logger.log(`[Billing] Requête de facturation reçue. Patient: ${payload.patientId} | Clé: ${payload.idempotencyKey}`);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. IDEMPOTENCE ABSOLUE — dans la transaction (atomique)
        const existingInvoice = await tx.invoice.findUnique({
          where: { idempotencyKey: payload.idempotencyKey }
        });

        if (existingInvoice) {
          return { __duplicate: true as const, invoice: existingInvoice };
        }

        let subtotalCents = 0;

        // A. Calcul des lignes et déduction d'inventaire
        // ⚡ OPTIMIZATION: N+1 Query Fix
         // Fetch all inventory items in a single query
         const itemNames = payload.items.map(i => i.inventoryItemName);
         const foundItemsList = await tx.inventoryItem.findMany({
            where: { name: { in: itemNames } }
         });

         // Create a memory map for O(1) lookups
         const itemsMap = new Map(foundItemsList.map(item => [item.name, item]));

         for (const item of payload.items) {
            // Lecture du stock actuel (from memory map instead of DB)
            const foundItem = itemsMap.get(item.inventoryItemName);

            if (!foundItem) {
               throw new HttpException(`Article non reconnu dans l'inventaire: ${item.inventoryItemName}`, HttpStatus.BAD_REQUEST);
            }

            if (foundItem.quantity < item.quantity) {
               throw new HttpException(
                 `Rupture de stock pour ${item.inventoryItemName}. Reste: ${foundItem.quantity}, Demandé: ${item.quantity}. Facturation annulée.`,
                 HttpStatus.CONFLICT
               );
            }

            // Calcul du total de la ligne utilisant Dinero.js
            const lineTotalCents = calculateLineTotalCents(foundItem.unitPriceCents, item.quantity, payload.currency || 'INR');
            subtotalCents += lineTotalCents;

            // Déduction atomique du stock (Empêche les stocks négatifs en cas de concurrence)
            const updateResult = await tx.inventoryItem.updateMany({
               where: { 
                 name: foundItem.name,
                 quantity: { gte: item.quantity } // Condition de garde atomique
               },
               data: { quantity: { decrement: item.quantity } }
            });

            if (updateResult.count === 0) {
               throw new HttpException(
                 `Rupture de stock concurrente pour ${item.inventoryItemName}. Facturation annulée pour protéger l'intégrité de l'inventaire.`,
                 HttpStatus.CONFLICT
               );
            }
         }

         // B. Calcul des Taxes (Utilisation de Dinero.js)
         const taxRate = payload.taxRatePercent !== undefined ? payload.taxRatePercent : 0.05;
         const taxCents = calculatePercentageCents(subtotalCents, taxRate, payload.currency || 'INR');
         const totalCents = subtotalCents + taxCents;

         // C. Création de la facture
         const newInvoice = await tx.invoice.create({
            data: {
               idempotencyKey: payload.idempotencyKey,
               patientId: payload.patientId,
               currency: payload.currency || 'INR',
               subtotalCents,
               taxCents,
               totalCents,
               status: 'UNPAID'
            }
         });

         // D. Traçabilité Légale (AuditLog Financier)
         await tx.auditLog.create({
            data: {
               userId: payload.practitionerId,
               patientId: payload.patientId,
               action: 'INVOICE_GENERATED_AND_STOCK_DEDUCTED',
               ipAddress: 'LOCAL_NETWORK_MDNS',
               metadata: { invoiceId: newInvoice.id, totalCents: newInvoice.totalCents }
            }
         });

         return newInvoice;
      });

      if ('__duplicate' in result) {
        this.logger.warn(`[Billing] Clé d'idempotence déjà utilisée (${payload.idempotencyKey}). Retour de la facture existante.`);
        return {
           status: 'ALREADY_PROCESSED',
           invoiceId: result.invoice.id,
           totalCents: result.invoice.totalCents,
           currency: result.invoice.currency,
           message: "Cette facture a déjà été payée ou générée. Doublon annulé."
        };
      }

      this.logger.log(`[Billing] Facture ${result.id} générée avec succès. Total: ${result.totalCents / 100} ${result.currency}`);

      return {
         status: 'SUCCESS',
         invoiceId: result.id,
         totalCents: result.totalCents,
         currency: result.currency,
         message: "Facturation et déduction d'inventaire terminées avec succès."
      };

    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`[FATAL BILLING] La transaction financière a crashé. Rollback exécuté.`, error);
      throw new HttpException('Erreur critique du serveur financier. La transaction a été annulée par sécurité.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
