import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    this.logger.log(
      `[Billing] Requête de facturation reçue. Patient: ${payload.patientId} | Clé: ${payload.idempotencyKey}`,
    );

    try {
      // 1. IDEMPOTENCE ABSOLUE
      // Vérifier si cette facture exacte n'a pas déjà été traitée (ex: retry réseau)
      const existingInvoice = await this.prisma.invoice.findUnique({
        where: { idempotencyKey: payload.idempotencyKey },
      });

      if (existingInvoice) {
        this.logger.warn(
          `[Billing] Rejet: Clé d'idempotence déjà utilisée (${payload.idempotencyKey}). Retour de la facture existante.`,
        );
        return {
          status: 'ALREADY_PROCESSED',
          invoiceId: existingInvoice.id,
          totalCents: existingInvoice.totalCents,
          currency: existingInvoice.currency,
          message: 'Cette facture a déjà été payée ou générée. Doublon annulé.',
        };
      }

      // 2. TRANSACTION ATOMIQUE (PostgreSQL)
      // Si la facturation échoue (ex: rupture de stock), la facture N'EST PAS créée.
      const invoice = await this.prisma.$transaction(async (tx) => {
        let subtotalCents = 0;

        // A. Calcul des lignes et déduction d'inventaire
        for (const item of payload.items) {
          // Lecture du stock actuel (Pessimistic Lock simulé)
          const inventoryItem = await tx.inventoryItem.findUnique({
            where: { name: item.inventoryItemName },
          });

          if (!inventoryItem) {
            throw new HttpException(
              `Article non reconnu dans l'inventaire: ${item.inventoryItemName}`,
              HttpStatus.BAD_REQUEST,
            );
          }

          if (inventoryItem.quantity < item.quantity) {
            throw new HttpException(
              `Rupture de stock pour ${item.inventoryItemName}. Reste: ${inventoryItem.quantity}, Demandé: ${item.quantity}. Facturation annulée.`,
              HttpStatus.CONFLICT,
            );
          }

          // Calcul du prix unitaire (Toujours en ENTIERS / Cents pour éviter les bugs Float Javascript type 0.1+0.2=0.30004)
          const lineTotalCents = inventoryItem.unitPriceCents * item.quantity;
          subtotalCents += lineTotalCents;

          // Déduction du stock (Gestion Logistique Sprint 4)
          await tx.inventoryItem.update({
            where: { name: inventoryItem.name },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        // B. Calcul des Taxes (Multiplication d'entiers puis arrondi)
        const taxRate =
          payload.taxRatePercent !== undefined ? payload.taxRatePercent : 0.05;
        const taxCents = Math.round(subtotalCents * taxRate);
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
            status: 'UNPAID',
          },
        });

        // D. Traçabilité Légale (AuditLog Financier)
        await tx.auditLog.create({
          data: {
            userId: payload.practitionerId,
            patientId: payload.patientId,
            action: 'INVOICE_GENERATED_AND_STOCK_DEDUCTED',
            ipAddress: 'LOCAL_NETWORK_MDNS',
            metadata: {
              invoiceId: newInvoice.id,
              totalCents: newInvoice.totalCents,
            },
          },
        });

        return newInvoice;
      });

      this.logger.log(
        `[Billing] Facture ${invoice.id} générée avec succès. Total: ${invoice.totalCents / 100} ${invoice.currency}`,
      );

      return {
        status: 'SUCCESS',
        invoiceId: invoice.id,
        totalCents: invoice.totalCents,
        currency: invoice.currency,
        message: "Facturation et déduction d'inventaire terminées avec succès.",
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        `[FATAL BILLING] La transaction financière a crashé. Rollback exécuté.`,
        error,
      );
      throw new HttpException(
        'Erreur critique du serveur financier. La transaction a été annulée par sécurité.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
