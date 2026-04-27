import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class IdempotencyInterceptor implements NestInterceptor {
    private redis;
    constructor();
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>>;
}
//# sourceMappingURL=idempotency.interceptor.d.ts.map