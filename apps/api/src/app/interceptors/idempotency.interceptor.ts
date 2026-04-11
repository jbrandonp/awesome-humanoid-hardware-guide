import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import Redis from 'ioredis';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    
    // Only apply to mutations (POST, PUT, PATCH, DELETE)
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const idempotencyKey = request.headers['x-idempotency-key'];
    
    // If no key provided, just continue normally
    if (!idempotencyKey) {
      return next.handle();
    }

    // 1. Atomically try to acquire a 'processing' lock or get existing result
    const cacheKey = `idempotency:${idempotencyKey}`;
    
    // SET with NX=true and EX=30 seconds (lock timeout)
    const acquired = await this.redis.set(cacheKey, 'PROCESSING', 'EX', 30, 'NX');

    if (!acquired) {
      // If we couldn't set it, it means either it's already PROCESSING or already DONE.
      const existingValue = await this.redis.get(cacheKey);
      
      if (existingValue === 'PROCESSING') {
        // Option A: Throw error to client
        throw new Error('Request already being processed with this idempotency key.');
        // Option B: Wait and retry (more complex)
      } else if (existingValue) {
        return of(JSON.parse(existingValue));
      }
    }

    // 2. Not cached and lock acquired: Process request and cache the response
    return next.handle().pipe(
      tap({
        next: (response) => {
          // Success: cache the response and overwrite 'PROCESSING'
          const valueToCache = response === undefined ? 'null' : JSON.stringify(response);
          this.redis.set(cacheKey, valueToCache, 'EX', 86400).catch(err => {
            console.error('Failed to cache idempotency key:', err);
          });
        },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          error: (err) => {
           // Failure: remove the lock so the client can retry
          this.redis.del(cacheKey).catch(() => {});
        }
      })
    );
  }
}
