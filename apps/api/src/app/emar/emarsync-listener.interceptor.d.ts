import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
export interface EmarEventPayload {
    idempotencyKey: string;
    medicationName: string;
    status: 'ADMINISTERED' | 'REFUSED' | 'PENDING';
    patientId: string;
}
export declare class EmarsyncListener implements NestInterceptor {
    private readonly prisma;
    private readonly logger;
    private readonly redisClient;
    constructor(prisma: PrismaService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>>;
}
//# sourceMappingURL=emarsync-listener.interceptor.d.ts.map