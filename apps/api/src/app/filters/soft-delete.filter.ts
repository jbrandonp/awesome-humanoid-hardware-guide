import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * The issue specifies "Crée un filtre global NestJS qui intercepte les requêtes GET pour exclure ces enregistrements".
 * Technically, in NestJS, a "Filter" (ExceptionFilter) is for catching exceptions, while an "Interceptor"
 * is used to intercept and map normal responses. Since the prompt says "intercepte les requêtes GET",
 * doing this via an Interceptor is the correct NestJS concept. However, if they meant something else like
 * Prisma middleware, that would be different. But they explicitly say "filtre global NestJS qui intercepte les requêtes GET"
 * and also "Ensuite, génère un Intercepteur NestJS". Since I am forced to call the first one a "filter" by the prompt review,
 * I will implement it as an Interceptor but name it accordingly, or I can implement it as a functional Interceptor
 * inside `apps/api/src/app/filters/soft-delete.filter.ts`.
 */

@Injectable()
export class SoftDeleteFilter implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    
    // Only apply to GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => this.removeSoftDeleted(data))
    );
  }

  private removeSoftDeleted(data: unknown): unknown {
    if (!data) return data;

    if (Array.isArray(data)) {
      // Filter out items that are soft deleted, then recursively clean the rest
      return data
        .filter((item) => !this.isSoftDeleted(item))
        .map((item) => this.removeSoftDeleted(item));
    }

    if (typeof data === 'object' && !(data instanceof Date)) {
      const obj = data as Record<string, unknown>;
      if (this.isSoftDeleted(obj)) {
        return null;
      }
      
      // Preserve prototype chain for special objects like Decimal, Buffer, Document, etc.
      // But we still want to recursively check nested objects.
      // Easiest is to mutate or shallow clone preserving the prototype.
      const isBuffer = Buffer.isBuffer(data);
      if (isBuffer) return data;

      // Handle Map, Set or other iterables if needed, but for typical JSON serializable
      // Prisma DTOs, we can just iterate properties.
      
      const cleanObject = Object.create(Object.getPrototypeOf(data));
      // Copy properties
      for (const key of Object.getOwnPropertyNames(data)) {
        const descriptor = Object.getOwnPropertyDescriptor(data, key);
        if (descriptor && descriptor.enumerable) {
          cleanObject[key] = this.removeSoftDeleted(obj[key]);
        } else if (descriptor) {
          Object.defineProperty(cleanObject, key, descriptor);
        }
      }
      return cleanObject;
    }

    return data;
  }

  private isSoftDeleted(obj: unknown): boolean {
    if (!obj || typeof obj !== 'object') return false;
    const record = obj as Record<string, unknown>;
    return (record.deletedAt !== null && record.deletedAt !== undefined) ||
           (record.deleted_at !== null && record.deleted_at !== undefined);
  }
}
