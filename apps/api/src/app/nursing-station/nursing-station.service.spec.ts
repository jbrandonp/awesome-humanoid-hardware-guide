import { Test, TestingModule } from '@nestjs/testing';
import { NursingStationService } from './nursing-station.service';
import { PrismaService } from '../prisma/prisma.service';
import { HighAlertMedicationService } from '../high-alert-medication/high-alert-medication.service';
import { UnauthorizedException } from '@nestjs/common';
import { MedicationAdministrationStatus } from '@prisma/client';

describe('NursingStationService', () => {
  let service: NursingStationService;
  // @ts-expect-error unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prismaService: PrismaService;
  // @ts-expect-error unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let highAlertService: HighAlertMedicationService;

  const mockPrismaService = {
    prescription: {
      findUnique: jest.fn(),
    },
    medicationAdministration: {
      create: jest.fn(),
    },
  };

  const mockHighAlertService = {
    isHighAlert: jest.fn(),
    processDualSignOff: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NursingStationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HighAlertMedicationService,
          useValue: mockHighAlertService,
        },
      ],
    }).compile();

    service = module.get<NursingStationService>(NursingStationService);
    prismaService = module.get<PrismaService>(PrismaService);
    highAlertService = module.get<HighAlertMedicationService>(
      HighAlertMedicationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAdministration', () => {
    const defaultData = {
      prescriptionId: '123e4567-e89b-12d3-a456-426614174000',
      nurseId: '987e6543-e21b-34d5-c678-426614174001',
      status: 'ADMINISTERED' as MedicationAdministrationStatus,
      dosageGiven: '500mg',
      route: 'ORAL',
      administeredAt: new Date().toISOString(),
      isPrn: false,
    };

    it('should throw UnauthorizedException if prescription is not found', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue(null);

      await expect(service.createAdministration(defaultData)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.createAdministration(defaultData)).rejects.toThrow(
        'Prescription non trouvée.',
      );
    });

    it('should throw UnauthorizedException for high-alert medication without secondary pin or badge', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue({
        id: defaultData.prescriptionId,
        medicationName: 'Insulin',
        patientId: 'patient-123',
        patient: { id: 'patient-123' },
      });
      mockHighAlertService.isHighAlert.mockReturnValue(true);

      await expect(service.createAdministration(defaultData)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.createAdministration(defaultData)).rejects.toThrow(
        `ALERTE SÉCURITÉ : La médication Insulin est à HAUT RISQUE. Une double signature (Dual Sign-Off) est strictement obligatoire.`,
      );
    });

    it('should call processDualSignOff for high-alert medication with secondary credentials', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue({
        id: defaultData.prescriptionId,
        medicationName: 'Insulin',
        patientId: 'patient-123',
        patient: { id: 'patient-123' },
      });
      mockHighAlertService.isHighAlert.mockReturnValue(true);
      mockHighAlertService.processDualSignOff.mockResolvedValue(true);

      mockPrismaService.medicationAdministration.create.mockResolvedValue({
        id: 'admin-123',
        ...defaultData,
      });

      const highAlertData = {
        ...defaultData,
        secondaryNursePin: '1234',
      };

      await service.createAdministration(highAlertData);

      expect(mockHighAlertService.processDualSignOff).toHaveBeenCalledWith({
        primaryUserId: highAlertData.nurseId,
        patientId: 'patient-123',
        medicationName: 'Insulin',
        dosage: highAlertData.dosageGiven,
        secondaryPin: '1234',
        secondaryBadgeId: undefined,
        timestamp: new Date(highAlertData.administeredAt).toISOString(),
      });
    });

    it('should successfully create medication administration for standard medication', async () => {
      mockPrismaService.prescription.findUnique.mockResolvedValue({
        id: defaultData.prescriptionId,
        medicationName: 'Paracetamol',
        patientId: 'patient-123',
        patient: { id: 'patient-123' },
      });
      mockHighAlertService.isHighAlert.mockReturnValue(false);

      const expectedAdmin = {
        id: 'admin-123',
        ...defaultData,
        administeredAt: new Date(defaultData.administeredAt),
      };

      mockPrismaService.medicationAdministration.create.mockResolvedValue(expectedAdmin);

      const result = await service.createAdministration(defaultData);

      expect(result).toEqual(expectedAdmin);
      expect(mockPrismaService.medicationAdministration.create).toHaveBeenCalledWith({
        data: {
          prescriptionId: defaultData.prescriptionId,
          nurseId: defaultData.nurseId,
          status: defaultData.status,
          dosageGiven: defaultData.dosageGiven,
          route: defaultData.route,
          administeredAt: new Date(defaultData.administeredAt),
          isPrn: defaultData.isPrn,
          clinicalJustification: undefined,
        },
      });
    });
  });
});
