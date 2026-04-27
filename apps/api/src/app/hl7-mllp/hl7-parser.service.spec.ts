import { Test, TestingModule } from '@nestjs/testing';
import { Hl7ParserService } from './hl7-parser.service';
import { PrismaService } from '../prisma/prisma.service';
import { Hl7ReconciliationService } from './hl7-reconciliation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Hl7ParserService', () => {
  let service: Hl7ParserService;
  let prismaService: jest.Mocked<PrismaService>;
  let reconciliationService: jest.Mocked<Hl7ReconciliationService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    // Mock the entire PrismaService instance, specifically the hl7DeadLetterQueue property
    const mockPrismaService = {
      hl7DeadLetterQueue: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      }
    };

    const mockReconciliationService = {
      findPatient: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Hl7ParserService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Hl7ReconciliationService, useValue: mockReconciliationService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<Hl7ParserService>(Hl7ParserService);
    prismaService = module.get(PrismaService);
    reconciliationService = module.get(Hl7ReconciliationService);
    eventEmitter = module.get(EventEmitter2);
  });

  const validHl7 = `MSH|^~\\&|LAB1|DEST1|||||ORU^R01|MSG-1001|P|2.3
PID|1||PAT-123||DOE^JOHN||19800101|M
OBR|1|||GLUCOSE^GLUCOSE|||202301010800
OBX|1|NM|GLU^GLUCOSE||5.5|mmol/L|4.0-6.0|N|||F
OBX|2|NM|K^POTASSIUM||6.5|mmol/L|3.5-5.0|H|||F
OBX|3|NM|TRO^TROPONIN||1.2|ng/mL|<0.04|PANIC|||F`;

  it('should parse ORU_R01 message correctly', async () => {
    (prismaService.hl7DeadLetterQueue.findUnique as jest.Mock).mockResolvedValue(null);
    reconciliationService.findPatient.mockResolvedValue('uuid-patient-123');

    const result = await service.parseOruR01(validHl7);

    expect(result.messageControlId).toBe('MSG-1001');
    expect(result.patientId).toBe('PAT-123');
    expect(result.patientName).toBe('DOE^JOHN');
    expect(result.patientDob).toBe('19800101');
    expect(result.observations).toHaveLength(3);
    expect(result.observations[0].value).toBe('5.5');
    expect(result.observations[1].flag).toBe('H');
  });

  it('should reject already processed messages (idempotency)', async () => {
    (prismaService.hl7DeadLetterQueue.findUnique as jest.Mock).mockResolvedValue({
      id: 'uuid-1',
      idempotencyKey: 'MSG-1001',
      status: 'PROCESSED',
      rawMessage: '',
      patientId: null,
      parsedData: null,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.parseOruR01(validHl7)).rejects.toThrow('Message MSG-1001 already processed.');
  });

  it('should send to Dead Letter Queue if patient not found', async () => {
    (prismaService.hl7DeadLetterQueue.findUnique as jest.Mock).mockResolvedValue(null);
    reconciliationService.findPatient.mockResolvedValue(null); // Not found

    await expect(service.parseOruR01(validHl7)).rejects.toThrow('Patient not found');
    expect(prismaService.hl7DeadLetterQueue.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: 'UNPROCESSED',
          rejectionReason: 'Patient not found during reconciliation',
        })
      })
    );
  });

  it('should trigger event on CRITICAL flags', async () => {
    (prismaService.hl7DeadLetterQueue.findUnique as jest.Mock).mockResolvedValue(null);
    reconciliationService.findPatient.mockResolvedValue('uuid-patient-123');

    await service.parseOruR01(validHl7);

    // Troponin was PANIC
    expect(eventEmitter.emit).toHaveBeenCalledWith('lab.result.critical', expect.objectContaining({
      patientId: 'uuid-patient-123',
      observation: expect.objectContaining({
        code: 'TRO^TROPONIN',
        flag: 'PANIC'
      })
    }));
  });
});
