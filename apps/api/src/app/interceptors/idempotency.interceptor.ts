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

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
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

    // 1. Check Redis for existing cached response
    const cacheKey = `idempotency:${idempotencyKey}`;
    const cachedDataString = await this.redis.get(cacheKey);

    if (cachedDataString) {
      const cachedData = JSON.parse(cachedDataString);
      
      // Fastify specific: set the cached status code if needed, but since it's an interceptor
      // returning `of(cachedData)` will just serialize the data back as HTTP 200/201 etc.
      // A more robust implementation might cache headers and status codes too.
      // But returning the exact cached body avoids re-executing Prisma and satisfies the requirement.
      return of(cachedData);
    }

    // 2. Not cached: Process request and cache the response
    return next.handle().pipe(
      tap({
        next: (response) => {
          // Fire and forget caching for success.
          // Handle undefined/empty responses gracefully (e.g. DELETE returning 204 No Content)
          const valueToCache = response === undefined ? 'null' : JSON.stringify(response);
          this.redis.set(cacheKey, valueToCache, 'EX', 86400).catch(err => {
            console.error('Failed to cache idempotency key:', err);
          });
        },
        error: (err) => {
          // Do not cache errors
        }
      })
    );
  }
}
