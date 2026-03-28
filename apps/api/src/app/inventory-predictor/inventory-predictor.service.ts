import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Worker } from 'worker_threads';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { 
  InventoryAlertEvent, 
  PredictionResult, 
  TrainingWorkerData,
  DailyConsumption
} from './inventory-predictor.interfaces';

@Injectable()
export class InventoryPredictorService {
  private readonly logger = new Logger(InventoryPredictorService.name);
  private readonly CRITICAL_MSE_THRESHOLD = 0.05;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  @Cron('0 2 * * *') // Run every night at 02:00
  async runNightlyPredictions() {
    this.logger.log('Starting nightly inventory prediction job...');
    
    try {
      const inventoryItems = await this.prisma.inventoryItem.findMany();

      for (const item of inventoryItems) {
        // Retrieve consumption history from prescriptions over the last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const prescriptions = await this.prisma.prescription.findMany({
          where: {
            medicationName: item.name,
            prescribedAt: {
              gte: ninetyDaysAgo
            },
            status: { not: 'deleted' }, // Use status instead of deletedAt for soft deletes as per standard query pattern
            deletedAt: null
          },
          orderBy: { prescribedAt: 'asc' }
        });

        // Group by day to get DailyConsumption
        const consumptionMap = new Map<string, number>();
        for (const p of prescriptions) {
          const dateStr = p.prescribedAt.toISOString().split('T')[0];
          // We assume quantity prescribed is numeric from dosage, but realistically if dosage is string we just count the occurrences or parse. 
          // For simplicity and resilience, assuming each prescription counts as 1 treatment course or we parse. 
          // Since dosage is string, we count each prescription event as 1 unit consumed for this prediction, or ideally we'd have a quantity.
          // In absence of quantity on Prescription model, counting the prescription instances:
          const current = consumptionMap.get(dateStr) || 0;
          consumptionMap.set(dateStr, current + 1); 
        }

        const consumptionHistory: DailyConsumption[] = Array.from(consumptionMap.entries()).map(([date, quantity]) => ({
          date,
          quantity
        }));

        const workerData: TrainingWorkerData = {
          itemId: item.id,
          itemName: item.name,
          currentStock: item.quantity,
          criticalThreshold: item.criticalThreshold,
          consumptionHistory
        };

        // Run prediction in worker thread
        await this.processItemInWorker(workerData);
      }
      
      this.logger.log('Nightly inventory prediction job completed.');
    } catch (error) {
      this.logger.error('Failed to run nightly predictions', error);
    }
  }

  private async processItemInWorker(data: TrainingWorkerData): Promise<void> {
    return new Promise((resolve, reject) => {
      // Find worker file dynamically based on dist vs src environment
      const isTsNode = process.argv[1]?.includes('ts-node') || __filename.endsWith('.ts');
      
      let workerFile = path.resolve(__dirname, 'inventory-predictor.worker.js');
      if (isTsNode) {
          workerFile = path.resolve(__dirname, 'inventory-predictor.worker.ts');
      }

      const execArgv = isTsNode ? ['-r', 'ts-node/register'] : [];
      
      const worker = new Worker(workerFile, {
        workerData: data,
        execArgv: execArgv,
      });

      let resolved = false;

      worker.on('message', (result: PredictionResult) => {
        if (!resolved) {
          resolved = true;
          this.handlePredictionResult(data, result);
          resolve();
        }
      });

      worker.on('error', (err: Error) => {
        if (!resolved) {
          resolved = true;
          this.logger.error(`Worker error for item ${data.itemName}:`, err);
          // Fallback on worker error
          this.fallbackPrediction(data);
          resolve();
        }
      });

      worker.on('exit', (code: number) => {
        if (!resolved) {
          resolved = true;
          if (code !== 0) {
            this.logger.error(`Worker stopped with exit code ${code} for item ${data.itemName}`);
            this.fallbackPrediction(data);
          }
          resolve();
        }
      });
    });
  }

  private handlePredictionResult(data: TrainingWorkerData, result: PredictionResult) {
    if (!result.success || result.mse > this.CRITICAL_MSE_THRESHOLD) {
      this.logger.warn(`Model did not converge (MSE: ${result.mse}) or failed. Using fallback for ${data.itemName}.`);
      this.fallbackPrediction(data);
      return;
    }

    this.logger.log(`Prediction for ${data.itemName}: ${result.predictedConsumption30Days} units in 30 days. MSE: ${result.mse}`);
    this.evaluateAlert(data, result.predictedConsumption30Days, 1 - result.mse); // Confidence is roughly 1 - MSE
  }

  private fallbackPrediction(data: TrainingWorkerData) {
    // Math fallback: average daily consumption over the history
    const totalConsumption = data.consumptionHistory.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalDays = 90; // Fixed 90 day window
    const dailyAverage = totalConsumption / totalDays;
    
    const projected30Days = dailyAverage * 30;
    
    this.logger.log(`Fallback prediction for ${data.itemName}: ${projected30Days} units in 30 days.`);
    this.evaluateAlert(data, projected30Days, 0.5); // Fixed confidence for fallback
  }

  private evaluateAlert(data: TrainingWorkerData, projectedConsumption: number, confidence: number) {
    if (projectedConsumption <= 0) return;

    const projectedStock = data.currentStock - projectedConsumption;

    if (projectedStock < data.criticalThreshold) {
      // Estimate depletion date
      const daysUntilDepletion = data.currentStock / (projectedConsumption / 30);
      const estimatedDepletionDate = new Date();
      estimatedDepletionDate.setDate(estimatedDepletionDate.getDate() + daysUntilDepletion);

      const alertEvent: InventoryAlertEvent = {
        itemId: data.itemId,
        itemName: data.itemName,
        estimatedDepletionDate,
        confidenceScore: confidence,
      };

      this.eventEmitter.emit('inventory.alert', alertEvent);
      this.logger.warn(`Alert emitted for ${data.itemName}. Estimated depletion: ${estimatedDepletionDate.toISOString()}`);
    }
  }
}
