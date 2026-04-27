import { Test, TestingModule } from '@nestjs/testing';
import { DrugInteractionService } from './drug-interaction.service';
import { getModelToken } from '@nestjs/mongoose';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalRecord } from '../clinical-record/clinical-record.schema';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('DrugInteractionService', () => {
  let service: DrugInteractionService;

  const mockRecordModel = {
    find: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrugInteractionService,
        {
          provide: getModelToken(ClinicalRecord.name),
          useValue: mockRecordModel,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DrugInteractionService>(DrugInteractionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should detect FATAL interaction and throw HttpException', async () => {
    mockRecordModel.exec.mockResolvedValue([
      { data: { medications: ['Amoxicilline'] } },
    ]);

    const dto = {
      patientId: 'patient-1',
      practitionerId: 'doctor-1',
      newMedications: ['Artemether'],
    };

    await expect(service.checkInteraction(dto)).rejects.toThrow(HttpException);
    await expect(service.checkInteraction(dto)).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
  });

  it('should allow override for HIGH interaction and store justification', async () => {
    mockRecordModel.exec.mockResolvedValue([
      { data: { medications: ['Aspirine'] } },
    ]);

    const justification = 'Patient needs this specific medication';

    const dto = {
      patientId: 'patient-1',
      practitionerId: 'doctor-1',
      newMedications: ['Ibuprofène'],
      justification,
    };

    const result = await service.overridePrescription(dto);

    expect(result.success).toBe(true);
    expect(result.report.level).toBe('HIGH');
    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'PRESCRIPTION_OVERRIDE',
          metadata: expect.objectContaining({
            justification: justification,
          }),
        }),
      })
    );
  });

  it('should detect LOW interaction and NOT throw', async () => {
    mockRecordModel.exec.mockResolvedValue([
      { data: { medications: ['Fer'] } },
    ]);

    const dto = {
      patientId: 'patient-1',
      practitionerId: 'doctor-1',
      newMedications: ['Vitamine C'],
    };

    const result = await service.checkInteraction(dto);
    expect(result.level).toBe('LOW');
  });

  it('should return NONE when no interaction', async () => {
    mockRecordModel.exec.mockResolvedValue([
      { data: { medications: ['Doliprane'] } },
    ]);

    const dto = {
      patientId: 'patient-1',
      practitionerId: 'doctor-1',
      newMedications: ['Vitamine C'],
    };

    const result = await service.checkInteraction(dto);
    expect(result.level).toBe('NONE');
  });
});
