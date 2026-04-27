import { Test, TestingModule } from '@nestjs/testing';
import { InventoryPredictorService } from './inventory-predictor.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('InventoryPredictorService Performance', () => {
  let service: InventoryPredictorService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryPredictorService,
        {
          provide: PrismaService,
          useValue: {
            inventoryItem: { findMany: jest.fn() },
            prescription: { findMany: jest.fn() },
          },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<InventoryPredictorService>(InventoryPredictorService);
    prisma = module.get<PrismaService>(PrismaService);
    // Mock the worker call so it resolves immediately
    (service as any).processItemInWorker = jest.fn().mockResolvedValue(undefined);
  });

  it('should run fast and query only once for prescriptions', async () => {
    const items = Array.from({ length: 1000 }).map((_, i) => ({
      id: `item-${i}`,
      name: `Med-${i}`,
      quantity: 100,
      criticalThreshold: 20,
    }));

    (prisma.inventoryItem.findMany as jest.Mock).mockResolvedValue(items);

    // Simulate returned prescriptions (only 1 for the whole batch)
    (prisma.prescription.findMany as jest.Mock).mockResolvedValue([
      { medicationName: 'Med-1', prescribedAt: new Date() }
    ]);

    const start = performance.now();
    await service.runNightlyPredictions();
    const end = performance.now();

    console.log(`Execution time optimized: ${end - start} ms`);
    expect(prisma.inventoryItem.findMany).toHaveBeenCalled();
    // Verify optimization - should only be called once now instead of 1000 times!
    expect(prisma.prescription.findMany).toHaveBeenCalledTimes(1);

    // Verify arguments to findMany
    const findManyCall = (prisma.prescription.findMany as jest.Mock).mock.calls[0][0];
    expect(findManyCall.where.medicationName.in).toHaveLength(1000);
  });
});
