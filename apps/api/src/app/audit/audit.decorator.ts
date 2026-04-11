import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';
export const AuditLog = (action: string): MethodDecorator & ClassDecorator => SetMetadata(AUDIT_LOG_KEY, action);
