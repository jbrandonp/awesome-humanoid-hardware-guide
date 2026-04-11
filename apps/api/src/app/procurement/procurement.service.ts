import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProcurementService {
  private readonly logger = new Logger(ProcurementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDrafts(): Promise<unknown> {
    return this.prisma.purchaseOrder.findMany({
      where: {
        status: 'DRAFT',
      },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approveDraft(id: string, updates?: { quantity?: number; supplierId?: string }): Promise<unknown> {
    this.logger.log(`[P2P] Approbation de la commande ${id}...`);

    return this.prisma.$transaction(async (tx) => {
      const draft = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!draft) {
        throw new NotFoundException(`Commande ${id} introuvable.`);
      }

      if (draft.status !== 'DRAFT') {
        throw new Error(`La commande n'est plus au statut DRAFT (${draft.status}).`);
      }

      const updateData: Prisma.PurchaseOrderUpdateInput = { status: 'APPROVED' };

      if (updates?.supplierId && updates.supplierId !== draft.supplierId) {
        updateData.supplier = { connect: { id: updates.supplierId } };
      }

      if (updates?.quantity && draft.items.length > 0) {
        const item = draft.items[0]; // Assuming 1 item per draft for auto-generated drafts
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { quantity: updates.quantity },
        });

        // Update total
        updateData.totalCents = updates.quantity * item.unitPriceCents;
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: {
          supplier: true,
          items: {
            include: { inventoryItem: true },
          },
        },
      });
    });
  }
}
