import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

// TYPAGES STRICTS - ZERO 'ANY' POLICY
export interface EmarEventPayload {
  idempotencyKey: string;
  medicationName: string;
  status: 'ADMINISTERED' | 'REFUSED' | 'PENDING';
  patientId: string;
}

@Injectable()
export class EmarsyncListener implements NestInterceptor {
  private readonly logger = new Logger(EmarsyncListener.name);
  private readonly redisClient: Redis;

  constructor(private readonly prisma: PrismaService) {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const payload = request.body as EmarEventPayload;

    if (!payload || !payload.idempotencyKey || !payload.medicationName || !payload.status) {
      return next.handle();
    }

    // Process only ADMINISTERED events, explicitly ignore REFUSED or others
    if (payload.status !== 'ADMINISTERED') {
      this.logger.log(`[EmarsyncListener] Status is ${payload.status}. Skipping inventory deduction for ${payload.medicationName}.`);
      return next.handle();
    }

    const idempotencyKey = `emarsync:${payload.idempotencyKey}`;

    try {
      // 1. Strict Idempotency Check using Redis (to prevent double deductions on network retry)
      const isAlreadyProcessed = await this.redisClient.get(idempotencyKey);
      if (isAlreadyProcessed) {
        this.logger.warn(`[EmarsyncListener] Idempotency key ${payload.idempotencyKey} already processed. Skipping inventory deduction.`);
        return next.handle();
      }

      this.logger.log(`[EmarsyncListener] Intercepting ADMINISTERED event for ${payload.medicationName}. Decrementing stock...`);

      // 2. Atomic Database Transaction
      await this.prisma.$transaction(async (tx) => {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { name: payload.medicationName },
        });

        if (!inventoryItem) {
          throw new HttpException(`[EmarsyncListener] Medication ${payload.medicationName} not found in Floor Stock.`, HttpStatus.BAD_REQUEST);
        }

        if (inventoryItem.quantity <= 0) {
          throw new HttpException(`[EmarsyncListener] Out of stock for ${payload.medicationName}. Cannot decrement.`, HttpStatus.CONFLICT);
        }

        await tx.inventoryItem.update({
          where: { name: payload.medicationName },
          data: { quantity: { decrement: 1 } },
        });
      });

      // 3. Lock Idempotency Key in Redis (24 hours TTL as per guidelines for API caching)
      await this.redisClient.set(idempotencyKey, 'PROCESSED', 'EX', 86400);

      this.logger.log(`[EmarsyncListener] Successfully decremented stock for ${payload.medicationName}.`);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`[EmarsyncListener] Failed to process inventory deduction: ${error instanceof Error ? error.message : String(error)}`);
      throw new HttpException('Erreur critique lors de la mise à jour de l\'inventaire.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return next.handle();
  }
}
