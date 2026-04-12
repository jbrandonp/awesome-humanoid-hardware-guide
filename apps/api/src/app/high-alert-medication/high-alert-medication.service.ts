import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DualSignOffSchema, DualSignOff } from '@systeme-sante/models';
import { ActionType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class HighAlertMedicationService {
  private readonly logger = new Logger(HighAlertMedicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Validate a secondary nurse sign-off using either a PIN or a badge ID.
   * If valid, records the dual sign-off event in the inalterable AuditLog.
   * 
   * @param payload DualSignOff
   * @returns true if successful, throws UnauthorizedException otherwise
   */
  async processDualSignOff(payload: DualSignOff): Promise<boolean> {
    let secondaryUser = null;

    if (payload.secondaryPin) {
        // Hash the input pin to check against db (assuming PINs are hashed with sha256 before storage in reality, or directly stored if it's a demo. We'll simulate a hash check)
        const hashedPin = crypto.createHash('sha256').update(payload.secondaryPin).digest('hex');
        secondaryUser = await this.prisma.user.findFirst({
            where: {
                pin: hashedPin,
                role: {
                  in: ['NURSE', 'DOCTOR'] // Ensure only qualified roles can sign off
                }
            }
        });
    } else if (payload.secondaryBadgeId) {
        secondaryUser = await this.prisma.user.findFirst({
            where: {
                badgeId: payload.secondaryBadgeId,
                role: {
                  in: ['NURSE', 'DOCTOR']
                }
            }
        });
    }

    if (!secondaryUser) {
        this.logger.warn(`Failed dual sign-off attempt for patient ${payload.patientId} - Invalid PIN/Badge`);
        throw new UnauthorizedException('Invalid secondary credentials for dual sign-off.');
    }

    // Ensure secondary user is different from primary user
    if (secondaryUser.id === payload.primaryUserId) {
      throw new UnauthorizedException('Secondary sign-off must be performed by a different user.');
    }

    // Validate offline hash if provided, else generate one for safety
    const computedHash = crypto.createHash('sha256').update(`${payload.primaryUserId}-${payload.secondaryPin || payload.secondaryBadgeId}-${payload.medicationName}-${payload.timestamp}`).digest('hex');
    
    if (payload.offlineHash && payload.offlineHash !== computedHash) {
        this.logger.warn(`Hash mismatch for offline dual sign-off. Given: ${payload.offlineHash}, Computed: ${computedHash}`);
        throw new UnauthorizedException('Invalid offline signature hash.');
    }

    // 2. Traçabilité Inaltérable dans l'AuditLog
    // Create an unalterable audit log entry containing both signatures (primary user ID + secondary user ID)
    const auditData = {
        primaryUserId: payload.primaryUserId,
        secondaryUserId: secondaryUser.id,
        medicationName: payload.medicationName,
        dosage: payload.dosage,
        timestamp: payload.timestamp,
        offlineHash: computedHash
    };

    await this.auditService.logAudit({
        userId: payload.primaryUserId,
        patientId: payload.patientId,
        actionType: ActionType.CREATE,
        resourceId: `DUAL_SIGNOFF_${payload.timestamp}`, // Or create a specific DualSignOff table and use its ID
        phiDataAccessed: auditData, // It will be obfuscated by audit service if needed
    });

    this.logger.log(`Successful dual sign-off for medication ${payload.medicationName} by ${payload.primaryUserId} and ${secondaryUser.id}`);

    return true;
  }

  /**
   * Identifies if a medication is considered high-alert (e.g., Insulin, Heparin).
   */
  isHighAlert(medicationName: string): boolean {
    const HIGH_ALERT_MEDS = [
      'insulin', 'heparin', 'warfarin', 'potassium chloride', 
      'morphine', 'fentanyl', 'digoxin', 'epinephrine'
    ];
    const normalized = medicationName.toLowerCase();
    return HIGH_ALERT_MEDS.some(m => normalized.includes(m));
  }
}
