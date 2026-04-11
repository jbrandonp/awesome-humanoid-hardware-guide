import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';
import { ActionType } from '@prisma/client';

describe('AuditService', () => {
  let service: AuditService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockResolvedValue({ id: '123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AuditRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    // Directly attach the mock to avoid NestJS context resolution issues in unit tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).auditRepository = mockRepository;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('obfuscatePhiData', () => {
    it('should obfuscate phone numbers by hiding the first 5 digits', () => {
      const data = { phoneNumber: '1234567890' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = service.obfuscatePhiData(data) as any;
      expect(result.phoneNumber).toBe('*****67890');
    });

    it('should obfuscate emails by truncating the username', () => {
      const data = { email: 'john.doe@example.com' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = service.obfuscatePhiData(data) as any;
      expect(result.email).toBe('j***@example.com');
    });

    it('should handle nested objects', () => {
      const data = {
        patient: {
          phone: '9876543210',
          contactEmail: 'jane.smith@hospital.org'
        }
       };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = service.obfuscatePhiData(data) as any;
      expect(result.patient.phone).toBe('*****43210');
      expect(result.patient.contactEmail).toBe('j***@hospital.org');
    });

    it('should leave non-PHI fields intact', () => {
      const data = { diagnosis: 'Hypertension', phone: '1112223333' };
      const result = service.obfuscatePhiData(data) as any;
      expect(result.diagnosis).toBe('Hypertension');
      expect(result.phone).toBe('*****23333');
    });
  });

  describe('logAudit', () => {
    it('should call repository create with obfuscated data', async () => {
      // Re-assign service specifically to have the mocked repository if needed,
      // but wait, `service` already has it injected via TestingModule.
      // Let's verify if `mockRepository.create` is indeed being injected.
      const params = {
        userId: 'user-1',
        patientId: 'patient-1',
        actionType: ActionType.READ,
        resourceId: 'res-1',
        phiDataAccessed: { phone: '1234567890' },
        ipAddress: '192.168.1.1',
      };

      await service.logAudit(params);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        patientId: 'patient-1',
        actionType: ActionType.READ,
        resourceId: 'res-1',
        phiDataAccessed: { phone: '*****67890' },
        ipAddress: '192.168.1.1',
      });
    });
  });
});
