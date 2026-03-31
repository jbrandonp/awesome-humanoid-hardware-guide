import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceService } from './intelligence.service';
import { PrismaService } from '../prisma/prisma.service';
import { DpdpaConsentService } from '../audit/dpdpa-consent.service';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';

describe('IntelligenceService', () => {
  let service: IntelligenceService;
  let prismaService: PrismaService;
  let dpdpaConsentService: DpdpaConsentService;

  const mockPrismaService = {
    prescription: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockDpdpaConsentService = {
    checkConsent: jest.fn(),
  };

  beforeEach(async () => {
    // Silence NestJS Logger during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligenceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DpdpaConsentService,
          useValue: mockDpdpaConsentService,
        },
      ],
    }).compile();

    service = module.get<IntelligenceService>(IntelligenceService);
    prismaService = module.get<PrismaService>(PrismaService);
    dpdpaConsentService = module.get<DpdpaConsentService>(DpdpaConsentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDrugInteractions', () => {
    const mockRequest = {
      patientId: 'patient-123',
      practitionerId: 'practitioner-456',
      newMedications: [
        { medicationName: 'Amoxicilline' },
      ],
      existingMedications: [],
    };

    it('should throw an HttpException if DpdpaConsentService.checkConsent fails (Database Error)', async () => {
      // Setup the mock to reject, simulating a DB timeout or crash
      mockDpdpaConsentService.checkConsent.mockRejectedValueOnce(
        new Error('Database Timeout'),
      );

      // Verify the HttpException is thrown with correct status and message
      await expect(service.checkDrugInteractions(mockRequest)).rejects.toThrow(
        new HttpException(
          "Le système de vérification des droits (DPDPA) est inaccessible (Base de données hors-ligne). L'intelligence artificielle a été désactivée par sécurité.",
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );

      expect(dpdpaConsentService.checkConsent).toHaveBeenCalledWith(
        mockRequest.practitionerId,
        mockRequest.patientId,
      );
    });

    it('should throw an HttpException if consent is denied', async () => {
      // Simulate patient denied consent
      mockDpdpaConsentService.checkConsent.mockResolvedValueOnce(false);
      mockPrismaService.auditLog.create.mockResolvedValueOnce({});

      await expect(service.checkDrugInteractions(mockRequest)).rejects.toThrow(
        new HttpException(
          "Accès illégal : Le patient a révoqué son consentement. L'IA ne peut pas analyser son historique pour les interactions.",
          HttpStatus.FORBIDDEN,
        ),
      );

      expect(dpdpaConsentService.checkConsent).toHaveBeenCalledWith(
        mockRequest.practitionerId,
        mockRequest.patientId,
      );
      // Audit log should be created for security violation
      expect(prismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should return SAFE status when consent is granted and no interactions found', async () => {
      // Simulate granted consent
      mockDpdpaConsentService.checkConsent.mockResolvedValueOnce(true);
      // Simulate no active prescriptions that interact
      mockPrismaService.prescription.findMany.mockResolvedValueOnce([]);
      // Simulate successful audit log creation
      mockPrismaService.auditLog.create.mockResolvedValueOnce({});

      const result = await service.checkDrugInteractions(mockRequest);

      expect(result.status).toBe('SAFE');
      expect(result.risksFound).toHaveLength(0);
      expect(result.message).toContain('Aucune interaction majeure détectée');
      expect(prismaService.prescription.findMany).toHaveBeenCalledWith({
        where: {
          patientId: mockRequest.patientId,
          status: 'synced',
          deletedAt: null,
        },
      });
      expect(prismaService.auditLog.create).toHaveBeenCalled();
    });
  });
});
