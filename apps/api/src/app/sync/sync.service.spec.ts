import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { SyncService } from './sync.service';

class PrismaServiceMock {}

describe('SyncService', () => {
  let service: SyncService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: 'PrismaService',
          useValue: {
            patient: {
              findMany: vi.fn().mockResolvedValue([]),
              create: vi.fn(),
              update: vi.fn(),
            },
            visit: {
              findMany: vi.fn().mockResolvedValue([]),
              create: vi.fn(),
              update: vi.fn(),
              findUnique: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    prisma = module.get('PrismaService');
    // Force inject the mocked prisma directly since NestJS testing might have issues in vitest without proper setup
    (service as any).prisma = prisma;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('pullChanges', () => {
    it('should query with cursor-based parameters and respect total limit', async () => {
      await service.pullChanges(0, 100);
      expect(prisma.patient.findMany).toHaveBeenCalledWith({
        where: { updatedAt: { gt: new Date(0) } },
        take: 100,
        orderBy: { updatedAt: 'asc' },
      });
      expect(prisma.visit.findMany).toHaveBeenCalledWith({
        where: { updatedAt: { gt: new Date(0) } },
        take: 100, // Because findMany for patient is mocked to return [] (length 0), visits gets the full remaining limit (100)
        orderBy: { updatedAt: 'asc' },
      });
    });
  });
});
