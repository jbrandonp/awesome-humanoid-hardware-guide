import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadGatewayException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // Check incoming payload compression for specific methods
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentEncoding = request.headers['content-encoding'] || '';
      // Only allow gzip as Express body-parser natively supports it. br (brotli) requires additional middleware not configured.
      if (!contentEncoding.includes('gzip')) {
        throw new UnsupportedMediaTypeException('Incoming payload must be compressed with gzip');
      }
    }

    const acceptEncoding = request.headers['accept-encoding'] || '';

    return next.handle().pipe(
      switchMap((data) => {
        if (!data) return from([data]);

         return from((async (): Promise<Buffer | unknown> => {
          const jsonString = JSON.stringify(data);
          const buffer = Buffer.from(jsonString, 'utf-8');

          try {
            if (acceptEncoding.includes('br')) {
              const compressed = await brotliCompress(buffer);
              response.header('Content-Encoding', 'br');
              response.header('Content-Type', 'application/json');
              return compressed;
            } else if (acceptEncoding.includes('gzip')) {
              const compressed = await gzip(buffer);
              response.header('Content-Encoding', 'gzip');
              response.header('Content-Type', 'application/json');
              return compressed;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_error) {
            throw new BadGatewayException('Compression failed');
          }

          return data; // Return uncompressed if no supported encoding
        })());
      }),
    );
  }
}
