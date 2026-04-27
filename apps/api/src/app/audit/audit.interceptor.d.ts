import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuditInterceptor implements NestInterceptor {
    private reflector;
    private prisma;
    private readonly logger;
    constructor(reflector: Reflector, prisma: PrismaService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
//# sourceMappingURL=audit.interceptor.d.ts.map