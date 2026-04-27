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
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy: (times) => null
    });
    // Suppress connection errors
    this.redisClient.on('error', (err) => {
      this.logger.warn('Redis connection error in EmarsyncListener:', err.message);
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
      // 1. Atomic idempotency lock via Redis SET NX
      try {
        const lockResult = await this.redisClient.set(
          idempotencyKey, 'PROCESSING', 'EX', 30, 'NX'
        );
        if (lockResult !== 'OK') {
          this.logger.warn(`[EmarsyncListener] Idempotency key ${payload.idempotencyKey} already being processed.`);
          return next.handle();
        }
      } catch (redisError) {
        this.logger.error(`[EmarsyncListener] Redis is UNAVAILABLE. Cannot perform idempotency check.`, redisError);
        throw new HttpException('Le service cache Redis est indisponible. Veuillez réessayer plus tard.', HttpStatus.SERVICE_UNAVAILABLE);
      }

      this.logger.log(`[EmarsyncListener] Intercepting ADMINISTERED event for ${payload.medicationName}. Decrementing stock...`);

      // 2. Atomic Database Transaction
      try {
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
      } catch (dbError) {
        // Rollback the Redis lock so the request can be retried
        await this.redisClient.del(idempotencyKey).catch(() => {});
        throw dbError;
      }

      // 3. Mark as processed in Redis (non-critical — best effort)
      await this.redisClient.set(idempotencyKey, 'PROCESSED', 'EX', 86400).catch(() => {
        this.logger.warn(`[EmarsyncListener] Failed to update idempotency status in Redis, TTL will expire.`);
      });

      this.logger.log(`[EmarsyncListener] Successfully decremented stock for ${payload.medicationName}.`);
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`[EmarsyncListener] Failed to process inventory deduction: ${error instanceof Error ? error.message : String(error)}`);
      // Crucial: We don't want to block the nurse from RECORDING the administration just because inventory sync failed.
      // But we ALREADY sent next.handle() at the end? No, it's an interceptor of a POST.
      // If we throw here, the POST fails.
      // We should only throw if it's a BAD_REQUEST or CONFLICT. Otherwise, we might want to log and let the request proceed.
      // For now, I'll keep the internal server error throw for DB failures.
      throw new HttpException('Erreur critique lors de la mise à jour de l\'inventaire.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return next.handle();
  }
}
