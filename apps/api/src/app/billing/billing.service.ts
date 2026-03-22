import { Injectable, Logger } from '@nestjs/common';

export interface BillItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  /**
   * Calcule le total d'une facture incluant les taxes par pays/devise.
   */
  calculateTotal(items: BillItem[], currency: string = 'INR', taxRate: number = 0.05): { total: number, tax: number, subtotal: number } {
    const subtotal = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    this.logger.log(`Calcul facture en ${currency}: Sous-total ${subtotal}, Taxe ${tax}, Total ${total}`);
    return { subtotal, tax, total };
  }

  // Idempotence : Dans une vraie DB, on créerait l'entrée ici avec son UUID unique généré par le client
}
