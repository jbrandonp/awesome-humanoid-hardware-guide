import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

class PrismaServiceMock {}

describe('SyncController', () => {
  let controller: SyncController;
  let service: SyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: {
            pullChanges: vi.fn().mockResolvedValue({}),
            pushChanges: vi.fn().mockResolvedValue({}),
          },
        },
        {
          provide: 'PrismaService',
          useValue: new PrismaServiceMock(),
        },
        {
          provide: 'AuditService',
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
    service = module.get<SyncService>(SyncService);
    // Force inject the mocked service directly since NestJS testing might have issues in vitest without proper setup
    (controller as any).syncService = service;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('pullChanges', () => {
    it('should pull changes successfully', async () => {
      const result = await controller.pullChanges('0', '500');
      expect(result).toBeDefined();
      expect(service.pullChanges).toHaveBeenCalledWith(0, 500);
    });

    it('should throw an error for invalid lastPulledAt', async () => {
      await expect(controller.pullChanges('invalid', '500')).rejects.toThrow();
    });

    it('should throw an error for future lastPulledAt', async () => {
      const futureTimestamp = Date.now() + 100000;
      await expect(controller.pullChanges(futureTimestamp.toString(), '500')).rejects.toThrow();
    });
  });

  describe('pushChanges', () => {
    it('should push changes successfully', async () => {
      const changes = { patients: { created: [], updated: [], deleted: [] } };
      const result = await controller.pushChanges(changes);
      expect(result).toEqual({ success: true });
      expect(service.pushChanges).toHaveBeenCalledWith(changes);
    });

    it('should throw an error for missing changes', async () => {
      await expect(controller.pushChanges(null)).rejects.toThrow();
    });
  });
});
