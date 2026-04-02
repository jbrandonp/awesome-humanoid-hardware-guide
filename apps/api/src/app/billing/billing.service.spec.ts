import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: {
            invoice: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback({
              inventoryItem: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                updateMany: jest.fn(),
              },
              invoice: {
                create: jest.fn(),
              },
              auditLog: {
                create: jest.fn(),
              }
            })),
          },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate an invoice and update stock', async () => {
    const payload = {
        idempotencyKey: 'test-key',
        patientId: 'patient-1',
        practitionerId: 'prac-1',
        items: [
            { inventoryItemName: 'item1', quantity: 2 },
            { inventoryItemName: 'item2', quantity: 1 }
        ]
    };

    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return cb({
            inventoryItem: {
                findUnique: jest.fn().mockImplementation(({ where }) => {
                    if (where.name === 'item1') return Promise.resolve({ name: 'item1', quantity: 10, unitPriceCents: 100 });
                    if (where.name === 'item2') return Promise.resolve({ name: 'item2', quantity: 5, unitPriceCents: 200 });
                    return Promise.resolve(null);
                }),
                findMany: jest.fn().mockImplementation(({ where }) => {
                    const names = where.name.in;
                    const items = [
                        { name: 'item1', quantity: 10, unitPriceCents: 100 },
                        { name: 'item2', quantity: 5, unitPriceCents: 200 }
                    ];
                    return Promise.resolve(items.filter(i => names.includes(i.name)));
                }),
                updateMany: jest.fn().mockResolvedValue({ count: 1 })
            },
            invoice: {
                create: jest.fn().mockResolvedValue({ id: 'inv-1', totalCents: 420, currency: 'INR' })
            },
            auditLog: {
                create: jest.fn().mockResolvedValue({})
            }
        });
    });

    const result = await service.generateInvoice(payload);

    expect(result.status).toBe('SUCCESS');
    expect(result.invoiceId).toBe('inv-1');
  });
});
