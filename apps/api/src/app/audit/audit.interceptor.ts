import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_LOG_KEY } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {


  private readonly logger = new Logger(AuditInterceptor.name);


  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const action = this.reflector.get<string>(AUDIT_LOG_KEY, context.getHandler());

    if (!action) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const patientId = req.params.patientId || req.body.patientId || req.query.patientId || "SYSTEM"; // Fallback to SYSTEM if missing for now

    return next.handle().pipe(
      tap(async () => {
        if (user && user.userId) {
          try {
            await this.prisma.auditLog.create({
              data: {
                userId: user.userId,
                patientId: patientId,
                action: action,
                ipAddress: req.ip || req.connection.remoteAddress,
                metadata: {
                  method: req.method,
                  url: req.url,
                  userAgent: req.headers['user-agent']
                }
              }
            });
          } catch (e) {
            this.logger.error(`[AuditLog] Erreur Prisma lors du log`, e);
          }
        }
      })
    );
  }
}
