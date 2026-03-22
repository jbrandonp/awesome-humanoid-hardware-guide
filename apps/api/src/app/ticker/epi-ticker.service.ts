import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export interface TickerAlert {
  id: string;
  type: 'EPIDEMIOLOGY' | 'INVENTORY' | 'SYSTEM';
  message: string;
  timestamp: Date;
}

@Injectable()
export class EpiTickerService {
  private readonly logger = new Logger(EpiTickerService.name);

  // Subject for Server-Sent Events (SSE)
  private tickerStream = new Subject<TickerAlert>();

  constructor(private prisma: PrismaService) {}

  /**
   * Retourne le flux observable pour les abonnés SSE
   */
  getTickerStream() {
    return this.tickerStream.asObservable();
  }

  /**
   * Data Mining Local : Analyse statistique anonyme
   * S'exécute par exemple toutes les heures.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async analyzeLocalEpidemiology() {
    this.logger.log('Lancement du Data Mining Local (Epi-Ticker)...');

    // Simulation de l'extraction des codes ICD-10 du jour
    // Ex: SELECT count(*) FROM prescriptions WHERE ...
    const simulatedMalariaCasesToday = Math.floor(Math.random() * 50);

    if (simulatedMalariaCasesToday > 30) {
      const alert: TickerAlert = {
        id: `EPI-${Date.now()}`,
        type: 'EPIDEMIOLOGY',
        message: `🚨 Alerte Flash: Pic anormal de cas de Paludisme détecté ce jour (+${simulatedMalariaCasesToday} cas).`,
        timestamp: new Date()
      };

      this.logger.warn(alert.message);
      this.tickerStream.next(alert);
    }
  }

  /**
   * Peut être appelé par d'autres services (ex: InventoryService)
   */
  broadcastAlert(alert: TickerAlert) {
     this.tickerStream.next(alert);
  }
}
