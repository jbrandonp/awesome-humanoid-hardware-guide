import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryAlertService {
  private readonly logger = new Logger(InventoryAlertService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Predictive Inventory Check:
   * Alerte de stock basée sur la saisonnalité et la consommation.
   */
  async checkSeasonalStockRisks(): Promise<string[]> {
    const alerts: string[] = [];
    const currentMonth = new Date().getMonth(); // 0 = Janvier, 11 = Décembre

    // Mousson en Inde (Généralement Juin (5) à Septembre (8))
    const isMonsoonSeason = currentMonth >= 5 && currentMonth <= 8;

    // Simulation de données de stock locales (qui viendraient idéalement de Watermelon/Postgres)
    const currentStock = {
      Artemether: 50, // stock faible
      Paracétamol: 500, // ok
      Amoxicilline: 200, // ok
    };

    if (isMonsoonSeason) {
      this.logger.log(
        'Saison des pluies détectée. Vérification des stocks anti-paludéens...',
      );
      if (currentStock['Artemether'] < 100) {
        alerts.push(
          "ALERTE INVENTAIRE PRÉDICTIF : Le stock d'Artemether est faible (50). Le risque de Paludisme augmente durant la Mousson. Recommandation : Commander +200 unités.",
        );
      }
    }

    // Exemple hivernal (Novembre à Février)
    const isWinter = currentMonth >= 10 || currentMonth <= 1;
    if (isWinter && currentStock['Paracétamol'] < 300) {
      alerts.push(
        'ALERTE INVENTAIRE PRÉDICTIF : Grippe saisonnière. Stock de Paracétamol critique.',
      );
    }

    return alerts;
  }
}
