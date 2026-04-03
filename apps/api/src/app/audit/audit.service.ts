import { Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { ActionType, Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  /**
   * Obfuscates PHI data for HIPAA Safe Harbor compliance.
   * - Hides the first 5 digits of phone numbers.
   * - Truncates emails (e.g., john.doe@example.com -> j***@example.com).
   */
  /**
   * Obfuscates PHI data for HIPAA Safe Harbor compliance.
   */
  obfuscatePhiData(
    data: Record<string, any> | any[],
    depth = 0,
    seen = new WeakSet(),
  ): Record<string, any> | any[] {
    if (depth > 10) return Array.isArray(data) ? [] : {}; // Prevent stack overflow
    if (typeof data === 'object' && data !== null) {
      if (seen.has(data)) return Array.isArray(data) ? [] : {}; // Prevent circular references
      seen.add(data);
    }

    const obfuscated = Array.isArray(data) ? [...data] : { ...data };

    for (const key of Object.keys(obfuscated)) {
      const val = (obfuscated as any)[key];
      const lowerKey = key.toLowerCase();

      if (typeof val === 'string') {
        if (lowerKey.includes('phone')) {
          (obfuscated as any)[key] = val.replace(/\d/g, (match, offset) =>
            offset < 5 ? '*' : match,
          );
        } else if (lowerKey.includes('email')) {
          const [user, domain] = val.split('@');
          (obfuscated as any)[key] = domain
            ? `${user.charAt(0)}***@${domain}`
            : '***';
        } else if (
          lowerKey.includes('name') ||
          lowerKey.includes('firstname') ||
          lowerKey.includes('lastname') ||
          lowerKey.includes('address') ||
          lowerKey.includes('aadhar') ||
          lowerKey.includes('nationalid')
        ) {
          (obfuscated as any)[key] =
            val.length > 2
              ? `${val.charAt(0)}***${val.charAt(val.length - 1)}`
              : '***';
        } else if (
          lowerKey.includes('date') ||
          lowerKey.includes('dob') ||
          lowerKey.includes('birth')
        ) {
          (obfuscated as any)[key] = '****-**-**';
        }
      } else if (typeof val === 'object' && val !== null) {
        (obfuscated as any)[key] = this.obfuscatePhiData(val, depth + 1, seen);
      }
    }

    return obfuscated;
  }

  async logAudit(params: {
    userId: string;
    patientId?: string | null;
    actionType: ActionType;
    resourceId: string;
    phiDataAccessed: Record<string, any>;
    ipAddress?: string;
  }) {
    const {
      userId,
      patientId,
      actionType,
      resourceId,
      phiDataAccessed,
      ipAddress,
    } = params;

    const obfuscatedPhiData = this.obfuscatePhiData(phiDataAccessed);

    return this.auditRepository.create({
      userId,
      patientId,
      actionType,
      resourceId,
      phiDataAccessed: obfuscatedPhiData as Prisma.InputJsonValue,
      ipAddress,
    });
  }
}
