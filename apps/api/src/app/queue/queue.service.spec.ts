import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QueueService, QueueEntry } from './queue.service';
import { AuditService } from '../audit/audit.service';
import { TriageInput } from './triage.schema';

describe('QueueService', () => {
  let service: QueueService;
  let eventEmitterMock: jest.Mocked<EventEmitter2>;
  let auditServiceMock: jest.Mocked<AuditService>;

  beforeEach(async () => {
    eventEmitterMock = {
      emitAsync: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    auditServiceMock = {
      logAudit: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: EventEmitter2, useValue: eventEmitterMock },
        { provide: AuditService, useValue: auditServiceMock },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  const mockTriageInput: TriageInput = {
    age: 30,
    spO2: 98,
    heartRate: 80,
    temperature: 37,
    systolicBP: 120,
    diastolicBP: 80,
    painScale: 2,
    chiefComplaint: 'headache',
    estimatedResources: 1,
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('immutability of returned entries', () => {
    it('getQueue() should return deep copies and not allow mutating internal state', async () => {
      await service.addPatientToQueue('patient1', mockTriageInput);

      const queue = service.getQueue();
      expect(queue.length).toBe(1);

      // Mutate the returned array and its object
      queue[0].esiScore = 999;
      queue.push({ patientId: 'patient2' } as QueueEntry);

      const internalQueue = service.getQueue();
      expect(internalQueue.length).toBe(1); // Internal array length should not change
      expect(internalQueue[0].esiScore).not.toBe(999); // Internal object property should not change
    });

    it('addPatientToQueue() should return a deep copy', async () => {
      const result = await service.addPatientToQueue('patient1', mockTriageInput);

      // Mutate the returned object
      result.esiScore = 999;

      const internalQueue = service.getQueue();
      expect(internalQueue[0].esiScore).not.toBe(999);
    });

    it('overrideTriageScore() should return a deep copy', async () => {
      await service.addPatientToQueue('patient1', mockTriageInput);

      const result = await service.overrideTriageScore('patient1', 1, 'nurse1', 'condition worsened');

      // Mutate the returned object
      result.esiScore = 999;

      const internalQueue = service.getQueue();
      expect(internalQueue[0].esiScore).toBe(1); // Should remain the overridden score, not 999
    });
  });
});
