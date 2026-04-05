import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditService } from '../audit/audit.service';

import { TriageInput, TriageInputSchema } from './triage.schema';
import { calculateTriageScore } from './triage.algorithm';

export interface QueueEntry {
  patientId: string;
  esiScore: number;
  arrivalTime: Date;
  input: TriageInput;
  isOverridden?: boolean;
}

@Injectable()
export class QueueService {
  private queue: QueueEntry[] = [];
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly auditService: AuditService,
  ) {}

  async addPatientToQueue(patientId: string, input: TriageInput): Promise<QueueEntry> {
    // 1. Validate Input (Zod)
    const parseResult = TriageInputSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.issues);
    }

    const validatedInput = parseResult.data;

    // 2. Calculate initial ESI score
    const initialEsiScore = calculateTriageScore(validatedInput);

    // 3. Emit Critical Patient alert if score is 1 or 2
    if (initialEsiScore === 1 || initialEsiScore === 2) {
      try {
        await this.eventEmitter.emitAsync('CRITICAL_PATIENT_ARRIVED', {
          patientId,
          esiScore: initialEsiScore,
          vitals: validatedInput,
        });
      } catch (err) {
        this.logger.error(`Error emitting CRITICAL_PATIENT_ARRIVED event for patient ${patientId}`, err);
      }
    }

    // 4. Create and push entry
    const entry: QueueEntry = {
      patientId,
      esiScore: initialEsiScore,
      arrivalTime: new Date(),
      input: validatedInput,
    };

    this.queue.push(entry);

    // 5. Re-sort the queue (Highest severity first [Lowest ESI number], then by arrival time)
    this.sortQueue();

    return entry;
  }

  async overrideTriageScore(
    patientId: string,
    newScore: number,
    nurseId: string,
    overrideReason: string,
  ): Promise<QueueEntry> {
    if (!overrideReason || overrideReason.trim().length === 0) {
      throw new BadRequestException('An override reason is strictly required.');
    }

    if (newScore < 1 || newScore > 5) {
      throw new BadRequestException('ESI Score must be between 1 and 5.');
    }

    const entryIndex = this.queue.findIndex(q => q.patientId === patientId);
    if (entryIndex === -1) {
      throw new BadRequestException(`Patient with ID ${patientId} is not in the queue.`);
    }

    const entry = this.queue[entryIndex];
    const oldScore = entry.esiScore;

    // Apply override
    entry.esiScore = newScore;
    entry.isOverridden = true;

    // Audit the manual override (HIPAA/DPDPA)
    await this.auditService.logAudit({
      userId: nurseId,
      patientId: patientId,
      actionType: 'UPDATE' as any, // Memory constraint: the ActionType enum is not exported by Prisma client in some versions, string literal 'UPDATE' is required
      resourceId: 'QueueTriage',
      phiDataAccessed: { overrideReason, oldScore, newScore } as Record<string, any>,
    });

    // Re-evaluate criticality triggers based on manual override
    if (newScore === 1 || newScore === 2) {
      try {
        await this.eventEmitter.emitAsync('CRITICAL_PATIENT_ARRIVED', {
          patientId,
          esiScore: newScore,
          vitals: entry.input,
          isOverride: true,
        });
      } catch (err) {
        this.logger.error(`Error emitting CRITICAL_PATIENT_ARRIVED override event for patient ${patientId}`, err);
      }
    }

    // Sort queue again
    this.sortQueue();

    return entry;
  }

  getQueue(): QueueEntry[] {
    return [...this.queue];
  }

  private sortQueue() {
    this.queue.sort((a, b) => {
      if (a.esiScore !== b.esiScore) {
        return a.esiScore - b.esiScore; // Ascending: ESI 1 comes before ESI 5
      }
      return a.arrivalTime.getTime() - b.arrivalTime.getTime(); // FIFO for identical ESI
    });
  }
}
