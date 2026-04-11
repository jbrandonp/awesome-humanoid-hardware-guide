import { Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { ActionType, AuditLog, Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  /**
   * Obfuscates PHI data for HIPAA Safe Harbor compliance.
   */
  obfuscatePhiData(
    data: unknown,
    depth = 0,
    seen = new WeakSet(),
  ): unknown {
    if (depth > 10 || data === null || typeof data !== 'object') return data;
    if (seen.has(data)) return '[Circular]';
    seen.add(data);

    if (Array.isArray(data)) {
      return data.map(item => this.obfuscatePhiData(item, depth + 1, seen));
    }

     const obfuscated: Record<string, unknown> = {};

    for (const key of Object.keys(data as Record<string, unknown>)) {
       const val = (data as Record<string, unknown>)[key];
      const lowerKey = key.toLowerCase();

      if (typeof val === 'string') {
        if (lowerKey.includes('email')) {
          const parts = val.split('@');
          obfuscated[key] = parts.length === 2
            ? `${parts[0].charAt(0)}***@${parts[1]}`
            : '***@***';
        } else if (lowerKey.includes('phone') || lowerKey.includes('contact')) {
          obfuscated[key] = val.replace(/\d/g, (match, offset) =>
            offset < (val.length - 5) ? '*' : match,
          );
        } else if (
          lowerKey === 'name' ||
          lowerKey === 'firstname' ||
          lowerKey === 'lastname' ||
          lowerKey.includes('address') ||
          lowerKey.includes('aadhar') ||
          lowerKey.includes('nationalid')
        ) {
          obfuscated[key] =
            val.length > 2
              ? `${val.charAt(0)}***${val.charAt(val.length - 1)}`
              : '***';
        } else if (
          (lowerKey.includes('date') || lowerKey.includes('dob') || lowerKey.includes('birth')) &&
          !lowerKey.includes('createdat') && !lowerKey.includes('updatedat') && !lowerKey.includes('timestamp')
        ) {
          obfuscated[key] = '****-**-**';
        } else {
          obfuscated[key] = val;
        }
      } else if (typeof val === 'object' && val !== null) {
        obfuscated[key] = this.obfuscatePhiData(val, depth + 1, seen);
      } else {
        obfuscated[key] = val;
      }
    }

    return obfuscated;
  }

  async logAudit(params: {
    userId?: string | null;
    patientId?: string | null;
    actionType: ActionType;
    resourceId: string;
     phiDataAccessed: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<AuditLog> {
    const {
      userId,
      patientId,
      actionType,
      resourceId,
      phiDataAccessed,
      ipAddress,
    } = params;

    const obfuscatedPhiData = this.obfuscatePhiData(phiDataAccessed);

    const data = {
      userId: userId ?? null,
      patientId: patientId ?? null,
      actionType,
      resourceId,
      phiDataAccessed: obfuscatedPhiData as Prisma.InputJsonValue,
      ipAddress,
      } as Prisma.AuditLogUncheckedCreateInput;
    return this.auditRepository.create(data);
  }
}
