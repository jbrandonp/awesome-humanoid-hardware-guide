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
  obfuscatePhiData(data: Record<string, any> | any[]): Record<string, any> | any[] {
    const obfuscated = Array.isArray(data) ? [...data] : { ...data };

    // Obfuscate phone numbers (assume fields named 'phone' or 'phoneNumber')
    for (const key of Object.keys(obfuscated)) {
      if (typeof obfuscated[key as keyof typeof obfuscated] === 'string') {
        // Only obfuscate if the key implies it's a phone or email, unless it's in an array (then we just check if it resembles one, or apply general masking if needed)
        // Since we don't have key context in arrays, we'll check the parent key context or apply conservatively.
        if (key.toLowerCase().includes('phone')) {
          const phone = obfuscated[key as keyof typeof obfuscated] as string;
          // Hide first 5 digits replacing them with '*'
          const digitsMatch = phone.match(/\d/g);
          if (digitsMatch && digitsMatch.length >= 5) {
            let replacedCount = 0;
            (obfuscated as any)[key] = phone.replace(/\d/g, (match) => {
              if (replacedCount < 5) {
                replacedCount++;
                return '*';
              }
              return match;
            });
          }
        } else if (key.toLowerCase().includes('email')) {
          const email = obfuscated[key as keyof typeof obfuscated] as string;
          const parts = email.split('@');
          if (parts.length === 2) {
            const [username, domain] = parts;
            const obfuscatedUsername = username.length > 1 ? username.charAt(0) + '***' : '*';
            (obfuscated as any)[key] = `${obfuscatedUsername}@${domain}`;
          }
        }
      } else if (typeof obfuscated[key as keyof typeof obfuscated] === 'object' && obfuscated[key as keyof typeof obfuscated] !== null) {
        (obfuscated as any)[key] = this.obfuscatePhiData(obfuscated[key as keyof typeof obfuscated]);
      }
    }

    return obfuscated;
  }

  async logAudit(params: {
    userId: string;
    patientId: string;
    actionType: ActionType;
    resourceId: string;
    phiDataAccessed: Record<string, any>;
    ipAddress?: string;
  }) {
    const { userId, patientId, actionType, resourceId, phiDataAccessed, ipAddress } = params;

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
