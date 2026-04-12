import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { HighAlertMedicationService } from './high-alert-medication.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DualSignOff } from '@systeme-sante/models';

describe('HighAlertMedicationService', () => {
  let service: HighAlertMedicationService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HighAlertMedicationService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
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

    service = module.get<HighAlertMedicationService>(HighAlertMedicationService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processDualSignOff', () => {
    const mockPayload: DualSignOff = {
      primaryUserId: 'user-1',
      secondaryPin: '1234',
      patientId: 'patient-1',
      medicationName: 'insulin',
      dosage: '10 units',
      timestamp: new Date().toISOString(),
    };

    it('should throw UnauthorizedException if primary user and secondary user are the same', async () => {
      // Mock Prisma to return the SAME user ID as primaryUserId
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'NURSE',
      });

         await expect(service.processDualSignOff(mockPayload)).rejects.toThrow(
        new UnauthorizedException('Secondary sign-off must be performed by a different user.')
      );
    });

    it('should throw UnauthorizedException if secondary user credentials are invalid', async () => {
        (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(service.processDualSignOff(mockPayload)).rejects.toThrow(
            new UnauthorizedException('Invalid secondary credentials for dual sign-off.')
        );
    });

    it('should successfully process dual sign-off if users are different', async () => {
      // Mock Prisma to return a DIFFERENT user ID
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-2',
        role: 'NURSE',
      });

      // Mock AuditService to resolve
      (auditService.logAudit as jest.Mock).mockResolvedValue(undefined);

       const result = await service.processDualSignOff(mockPayload);

      expect(result).toBe(true);
      expect(auditService.logAudit).toHaveBeenCalled();
    });

    it('should successfully process dual sign-off with badgeId', async () => {
        const badgePayload: DualSignOff = {
            primaryUserId: 'user-1',
            secondaryBadgeId: 'badge-123',
            patientId: 'patient-1',
            medicationName: 'insulin',
            dosage: '10 units',
            timestamp: new Date().toISOString(),
          };

        (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
            id: 'user-2',
            role: 'DOCTOR',
        });

        (auditService.logAudit as jest.Mock).mockResolvedValue(undefined);

         const result = await service.processDualSignOff(badgePayload);

        expect(result).toBe(true);
        expect(auditService.logAudit).toHaveBeenCalled();
      });

      it('should throw UnauthorizedException if offlineHash is invalid', async () => {
         const payloadWithHash: DualSignOff = {
            ...mockPayload,
            offlineHash: 'invalid-hash'
        };

        (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
            id: 'user-2',
            role: 'NURSE',
        });

         await expect(service.processDualSignOff(payloadWithHash)).rejects.toThrow(
            new UnauthorizedException('Invalid offline signature hash.')
        );
      });
  });

  describe('isHighAlert', () => {
    it('should return true for high alert medications', () => {
      expect(service.isHighAlert('insulin')).toBe(true);
      expect(service.isHighAlert('Heparin')).toBe(true);
      expect(service.isHighAlert('Potassium Chloride')).toBe(true);
    });

    it('should return false for regular medications', () => {
      expect(service.isHighAlert('paracetamol')).toBe(false);
      expect(service.isHighAlert('ibuprofen')).toBe(false);
      expect(service.isHighAlert('amoxicillin')).toBe(false);
    });
  });
});
