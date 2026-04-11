import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Hl7ReconciliationService } from './hl7-reconciliation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface Hl7ParsedData {
  messageControlId: string;
  patientId: string | null;
  patientName: string | null;
  patientDob: string | null;
  observations: {
    code: string;
    value: string;
    unit: string;
    refRange: string;
    flag: string;
  }[];
}

@Injectable()
export class Hl7ParserService {
  private readonly logger = new Logger(Hl7ParserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reconciliationService: Hl7ReconciliationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public async parseOruR01(rawMessage: string): Promise<Hl7ParsedData> {
    const segments = rawMessage.split(/[\r\n]+/).filter(s => s.trim() !== '');
    
    let mshSegment = '';
    let pidSegment = '';
    const obxSegments: string[] = [];
    
    for (const segment of segments) {
      if (segment.startsWith('MSH|')) mshSegment = segment;
      else if (segment.startsWith('PID|')) pidSegment = segment;
      else if (segment.startsWith('OBX|')) obxSegments.push(segment);
    }

    if (!mshSegment) {
      // Extremely corrupt message without MSH, generate a random ID to store in DLQ
      const randomId = `CORRUPT-${Date.now()}`;
      await this.prisma.hl7DeadLetterQueue.create({
        data: {
          idempotencyKey: randomId,
          rawMessage,
          status: 'UNPROCESSED',
          rejectionReason: 'Missing MSH segment',
        }
      });
      throw new Error('Missing MSH segment');
    }

    const mshFields = mshSegment.split('|');
    const messageControlId = mshFields[9];

    if (!messageControlId || messageControlId.trim() === '') {
      const randomId = `MISSING-ID-${Date.now()}`;
      await this.prisma.hl7DeadLetterQueue.create({
        data: {
          idempotencyKey: randomId,
          rawMessage,
          status: 'UNPROCESSED',
          rejectionReason: 'Missing MSH-10 Message Control ID',
        }
      });
      throw new Error('Missing MSH-10 Message Control ID');
    }

    // Check Idempotency
    const existingMessage = await this.prisma.hl7DeadLetterQueue.findUnique({
      where: { idempotencyKey: messageControlId }
    });

    if (existingMessage && existingMessage.status === 'PROCESSED') {
      throw new Error(`Message ${messageControlId} already processed.`);
    }

    const pidFields = pidSegment ? pidSegment.split('|') : [];
    const patientLabId = pidFields[3] || null;
    
    // Maintain raw HL7 format as expected by tests and downstream consumers
    const patientName = pidFields[5] || null;
    
    const patientDob = pidFields[7] || null;

    const parsedObservations = obxSegments.map(obx => {
      const obxFields = obx.split('|');
      const code = obxFields[3] || '';
      return {
        code,
        value: obxFields[5] || '',
        unit: obxFields[6] || '',
        refRange: obxFields[7] || '',
        flag: obxFields[8] || '',
      };
    });

    const parsedData: Hl7ParsedData = {
      messageControlId,
      patientId: patientLabId,
      patientName,
      patientDob,
      observations: parsedObservations,
    };

    let matchedPatientId: string | null = null;
    let reconciliationError: string | null = null;

    try {
      matchedPatientId = await this.reconciliationService.findPatient(patientLabId, patientName, patientDob);
      if (!matchedPatientId) {
        reconciliationError = 'Patient not found during reconciliation';
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
       reconciliationError = 'Patient not found during reconciliation';
    }

    if (!matchedPatientId) {
      // Send to Dead Letter Queue and return an error so the service sends AE/AR
      const dbParsedData = JSON.parse(JSON.stringify(parsedData));
      await this.prisma.hl7DeadLetterQueue.upsert({
        where: { idempotencyKey: messageControlId },
        update: {
          rawMessage,
          status: 'UNPROCESSED',
          rejectionReason: reconciliationError,
          parsedData: dbParsedData,
        },
        create: {
          idempotencyKey: messageControlId,
          rawMessage,
          status: 'UNPROCESSED',
          rejectionReason: reconciliationError,
          parsedData: dbParsedData,
        }
      });
      throw new Error(reconciliationError || 'Patient not found');
    }

    // Verify OBX flags for Critical alerts
    for (const obs of parsedObservations) {
      const flag = obs.flag.toUpperCase().trim();
      if (flag === 'C' || flag === 'PANIC' || flag === 'LL' || flag === 'HH') {
        this.eventEmitter.emit('lab.result.critical', {
          patientId: matchedPatientId,
          messageControlId,
          observation: obs
        });
        this.logger.warn(`CRITICAL LAB RESULT for patient ${matchedPatientId}: ${obs.code} = ${obs.value} ${obs.unit} (Flag: ${flag})`);
      }
    }

    // Save as processed
    const dbParsedData = JSON.parse(JSON.stringify(parsedData));
    await this.prisma.hl7DeadLetterQueue.upsert({
        where: { idempotencyKey: messageControlId },
        update: {
          rawMessage,
          status: 'PROCESSED',
          rejectionReason: null,
          patientId: matchedPatientId,
          parsedData: dbParsedData,
        },
        create: {
          idempotencyKey: messageControlId,
          rawMessage,
          status: 'PROCESSED',
          patientId: matchedPatientId,
          parsedData: dbParsedData,
        }
    });

    return parsedData;
  }
}
