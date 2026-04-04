import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';
import { TriageInput } from './triage.schema';

describe('QueueService', () => {
  let service: QueueService;
  let eventEmitter: EventEmitter2;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: EventEmitter2,
          useValue: {
            emitAsync: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAudit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPatientToQueue', () => {
    it('should add a patient to the queue successfully', async () => {
      const input: TriageInput = {
        age: 30,
        spO2: 98,
        heartRate: 80,
        temperature: 37,
        systolicBP: 120,
        diastolicBP: 80,
        painScale: 2,
        chiefComplaint: 'Headache',
        estimatedResources: 1,
      };

      const result = await service.addPatientToQueue('patient-1', input);

      expect(result.patientId).toBe('patient-1');
      expect(result.esiScore).toBeDefined();
      expect(service.getQueue().length).toBe(1);
    });

    it('should throw BadRequestException when adding a duplicate patient', async () => {
      const input: TriageInput = {
        age: 30,
        spO2: 98,
        heartRate: 80,
        temperature: 37,
        systolicBP: 120,
        diastolicBP: 80,
        painScale: 2,
        chiefComplaint: 'Headache',
        estimatedResources: 1,
      };

      await service.addPatientToQueue('patient-1', input);

      await expect(service.addPatientToQueue('patient-1', input)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addPatientToQueue('patient-1', input)).rejects.toThrow(
        'Patient with ID patient-1 is already in the triage queue.',
      );

      expect(service.getQueue().length).toBe(1);
    });

    it('should throw BadRequestException if input validation fails', async () => {
      const invalidInput = {
        age: 30,
        gender: 'male',
        // Missing symptoms and vitals
      } as any;

      await expect(service.addPatientToQueue('patient-2', invalidInput)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('overrideTriageScore', () => {
    beforeEach(async () => {
      const input: TriageInput = {
        age: 30,
        spO2: 98,
        heartRate: 80,
        temperature: 37,
        systolicBP: 120,
        diastolicBP: 80,
        painScale: 2,
        chiefComplaint: 'Headache',
        estimatedResources: 1,
      };
      await service.addPatientToQueue('patient-override', input);
    });

    it('should override the triage score successfully', async () => {
      const result = await service.overrideTriageScore('patient-override', 2, 'nurse-1', 'Patient condition worsened');

      expect(result.esiScore).toBe(2);
      expect(result.isOverridden).toBe(true);
      expect(auditService.logAudit).toHaveBeenCalled();
    });

    it('should throw BadRequestException if reason is missing', async () => {
      await expect(
        service.overrideTriageScore('patient-override', 2, 'nurse-1', '')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if patient is not in queue', async () => {
      await expect(
        service.overrideTriageScore('patient-not-found', 2, 'nurse-1', 'reason')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if score is invalid', async () => {
      await expect(
        service.overrideTriageScore('patient-override', 6, 'nurse-1', 'reason')
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.overrideTriageScore('patient-override', 0, 'nurse-1', 'reason')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
