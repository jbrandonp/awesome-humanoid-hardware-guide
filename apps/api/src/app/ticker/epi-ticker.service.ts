import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Subject, Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (Production-Ready Data Mining)
// ============================================================================

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

@Injectable()
export class EpiTickerService {
  private readonly logger = new Logger(EpiTickerService.name);

  // File d'attente asynchrone (Server-Sent Events)
  private readonly tickerStream = new Subject<TickerAlert>();

  // Seuil critique de déclenchement d'alerte épidémique (Z-Score > 2.0 ou x3 de la moyenne mobile)
  private readonly EPIDEMIC_MULTIPLIER_THRESHOLD = 3.0;
  private readonly MIN_CASES_REQUIRED_FOR_ALERT = 5; // Pour éviter des faux positifs sur des maladies très rares (ex: 0 à 1 cas)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retourne le flux observable pour les abonnés SSE (Tauri/React)
   */
  getTickerStream(): Observable<TickerAlert> {
    return this.tickerStream.asObservable();
  }

  /**
   * DATA MINING LOCAL & ANONYMISÉ (Epi-Ticker)
   *
   * S'exécute automatiquement toutes les heures sans requérir d'interaction humaine.
   * L'algorithme ne rapatrie pas les millions de lignes dans la RAM de NestJS.
   * Il délègue l'agrégation statistique au moteur SQL (PostgreSQL via Prisma),
   * protégeant ainsi l'empreinte mémoire stricte de l'application sur Windows 7.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async analyzeLocalEpidemiology(): Promise<void> {
    this.logger.log('[Epi-Ticker] Lancement de l\'analyse statistique épidémiologique...');

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const fourteenDaysAgo = new Date(todayStart);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // ========================================================================
      // 1. REQUÊTE AGRÉGÉE (SQL GROUP BY) - HAUTE PERFORMANCE
      // Nous ne comptons que les diagnostics (code ICD-10 dans les prescriptions)
      // pour évaluer si une maladie spécifique connaît une explosion ce jour-là.
      // (Note : Dans un schéma complet, on utiliserait une table "Diagnostics" ou "Visits",
      // ici nous nous basons sur la "prescription" qui contient "medicationName" ou "icd10").
      // ========================================================================

      const last14DaysData = await this.prisma.prescription.groupBy({
        by: ['medicationName'], // Simule un groupement par pathologie/traitement
        where: {
          prescribedAt: { gte: fourteenDaysAgo, lt: todayStart },
          status: { not: 'deleted' }
        },
        _count: {
          _all: true
        }
      });

      const todayData = await this.prisma.prescription.groupBy({
        by: ['medicationName'],
        where: {
          prescribedAt: { gte: todayStart },
          status: { not: 'deleted' }
        },
        _count: {
          _all: true
        }
      });

      // ========================================================================
      // 2. ALGORITHME DE DÉTECTION D'ANOMALIE (MOVING AVERAGE / HEURISTIQUE)
      // ========================================================================
      const statsResult: EpidemiologicalStats[] = [];

      for (const todayRecord of todayData) {
        const pathologyId = todayRecord.medicationName;
        const casesToday = todayRecord._count._all;

        // On ignore le bruit de fond statistique (faux positifs)
        if (casesToday < this.MIN_CASES_REQUIRED_FOR_ALERT) continue;

         const historyRecord = last14DaysData.find((h: Record<string, unknown>) => h.medicationName === pathologyId);

        // Moyenne Mobile (Moving Average) quotidienne sur 14 jours
        const averageCasesLast14Days = historyRecord ? (historyRecord._count._all / 14) : 0;

        let isAnomalous = false;

        if (averageCasesLast14Days === 0) {
           // Nouvelle pathologie soudaine (Apparition subite de 5+ cas dans la journée)
           isAnomalous = true;
        } else {
           // Si les cas d'aujourd'hui représentent x3 la moyenne habituelle
           const multiplier = casesToday / averageCasesLast14Days;
           if (multiplier >= this.EPIDEMIC_MULTIPLIER_THRESHOLD) {
              isAnomalous = true;
           }
        }

        if (isAnomalous) {
           statsResult.push({
              icd10Code: pathologyId,
              casesToday,
              averageCasesLast14Days,
              zScore: 0, // Ignoré dans cette heuristique, implémenter Standard Deviation pour vrai Z-Score
              isAnomalous
           });
        }
      }

      // ========================================================================
      // 3. DIFFUSION DES ALERTES (SERVER-SENT EVENTS - SSE)
      // ========================================================================
      for (const anomaly of statsResult) {
        const alert: TickerAlert = {
          id: `EPI-${Date.now()}-${randomUUID()}`,
          type: 'EPIDEMIOLOGY',
          message: `🚨 ALERTE SANITAIRE : Pic épidémique suspect de '${anomaly.icd10Code}'. ${anomaly.casesToday} cas enregistrés aujourd'hui (Moy. normale: ${anomaly.averageCasesLast14Days.toFixed(1)}/jour).`,
          timestamp: new Date()
        };

        this.logger.warn(`[Epi-Ticker] ${alert.message}`);

        // Diffusion en temps réel sur le réseau local aux interfaces Tauri (Zero-WebSockets)
        this.tickerStream.next(alert);
      }

      if (statsResult.length === 0) {
         this.logger.log('[Epi-Ticker] Analyse terminée. Aucune anomalie épidémique détectée.');
      }

    } catch (dbError: unknown) {
      // 4. GESTION DES ERREURS EXTRÊMES
      // Le CRON ne doit JAMAIS faire crasher le service Node.js s'il perd la connexion
      // au moteur Postgres ou s'il rencontre un timeout de lecture.
      this.logger.error(`[CRITICAL] Échec du Data Mining Épidémiologique. Le moteur de base de données est peut-être surchargé.`, dbError);
    }
  }

  /**
   * Passerelle pour injecter des alertes externes (ex: Predictive Inventory)
   */
  broadcastAlert(alert: TickerAlert): void {
     this.tickerStream.next(alert);
  }
}
