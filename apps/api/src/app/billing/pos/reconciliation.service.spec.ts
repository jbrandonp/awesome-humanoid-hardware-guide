import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationService } from './reconciliation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterStatus, TransactionType, PaymentMethod } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockPrismaService = {
  cashRegisterSession: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  invoice: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  financialTransaction: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let prisma: any;

  beforeEach(async () => {
    // Reset mocks before each test to avoid interference
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReconciliationService>(ReconciliationService);

    // We explicitly set prisma to the mocked object to ensure we can access the mocked methods
    prisma = mockPrismaService;
    // We also need to hack the service to use our mock directly because TS compilation might make module.get return something else depending on TS config
    (service as any).prisma = mockPrismaService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('openSession', () => {
    it('should open a new session successfully', async () => {
      (prisma.cashRegisterSession.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.cashRegisterSession.create as jest.Mock).mockResolvedValue({
        id: 'session-1',
        terminalId: 'term-1',
        cashierId: 'user-1',
        openingFloatCents: 10000,
        status: RegisterStatus.OPEN,
      });

      const result = await service.openSession({
        terminalId: 'term-1',
        cashierId: 'user-1',
        openingFloatCents: 10000, // 100.00
      });

      expect(result.id).toBe('session-1');
      expect(result.openingFloatCents).toBe(10000);
      expect(prisma.cashRegisterSession.create).toHaveBeenCalled();
    });

    it('should throw an error if a session is already open', async () => {
      (prisma.cashRegisterSession.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-session' });

      await expect(
        service.openSession({ terminalId: 'term-1', cashierId: 'user-1', openingFloatCents: 10000 })
      ).rejects.toThrow(HttpException);
    });
  });

  describe('processTransaction (Fractionated Payments)', () => {
    it('should process a fractionated payment correctly (CASH + CARD)', async () => {
      (prisma.cashRegisterSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        status: RegisterStatus.OPEN,
      });

      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        id: 'inv-1',
        totalCents: 5000, // 50.00
        status: 'UNPAID',
      });

      (prisma.financialTransaction.findFirst as jest.Mock).mockResolvedValue(null); // No idempotency hit

      // Mock $transaction logic
      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        // We simulate the transaction execution
        // We pass the mockPrismaService as the `tx` parameter because it has the required mocked methods
        return cb(prisma);
      });

      (prisma.financialTransaction.findUnique as jest.Mock).mockResolvedValue(null); // Derived key check
      (prisma.financialTransaction.create as jest.Mock).mockResolvedValue({}); // Create tx

      const payload = {
        sessionId: 'session-1',
        invoiceId: 'inv-1',
        idempotencyKey: 'idem-1',
        payments: [
          { amountCents: 2000, paymentMethod: PaymentMethod.CASH },
          { amountCents: 3000, paymentMethod: PaymentMethod.CARD },
        ],
      };

      const result = await service.processTransaction(payload);

      expect(result.status).toBe('SUCCESS');
      expect(prisma.$transaction).toHaveBeenCalled();
      // Should create 2 transactions and update 1 invoice
      expect(prisma.financialTransaction.create).toHaveBeenCalledTimes(2);
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'PAID' },
      });
    });

    it('should reject payment if totals do not match invoice total', async () => {
      (prisma.cashRegisterSession.findUnique as jest.Mock).mockResolvedValue({ id: 'session-1', status: RegisterStatus.OPEN });
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ id: 'inv-1', totalCents: 5000, status: 'UNPAID' });

      const payload = {
        sessionId: 'session-1',
        invoiceId: 'inv-1',
        idempotencyKey: 'idem-2',
        payments: [
          { amountCents: 2000, paymentMethod: PaymentMethod.CASH }, // Missing 3000
        ],
      };

      await expect(service.processTransaction(payload)).rejects.toThrow(HttpException);
    });
  });

  describe('processRefund', () => {
    it('should process a refund without supervisor if under threshold', async () => {
      (prisma.cashRegisterSession.findUnique as jest.Mock).mockResolvedValue({ id: 'session-1', status: RegisterStatus.OPEN });
      (prisma.financialTransaction.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'tx-1',
        amountCents: 2000,
        paymentMethod: PaymentMethod.CASH,
      }); // Original TX
      (prisma.financialTransaction.findUnique as jest.Mock).mockResolvedValueOnce(null); // Idempotency check for refund

      (prisma.financialTransaction.create as jest.Mock).mockResolvedValue({
        id: 'refund-tx',
        amountCents: -1500,
      });

      const result = await service.processRefund({
        sessionId: 'session-1',
        invoiceId: 'inv-1',
        originalTransactionId: 'tx-1',
        refundAmountCents: 1500, // < 500000 (threshold)
        reason: 'Patient unhappy',
        idempotencyKey: 'idem-refund-1',
      });

      expect(result.status).toBe('SUCCESS');
      expect(prisma.financialTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: TransactionType.REFUND,
            amountCents: -1500,
          }),
        })
      );
    });

    it('should require supervisor for large refunds', async () => {
      (prisma.cashRegisterSession.findUnique as jest.Mock).mockResolvedValue({ id: 'session-1', status: RegisterStatus.OPEN });
      (prisma.financialTransaction.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'tx-1',
        amountCents: 600000,
        paymentMethod: PaymentMethod.CASH,
      });

      // No supervisor provided
      await expect(
        service.processRefund({
          sessionId: 'session-1',
          invoiceId: 'inv-1',
          originalTransactionId: 'tx-1',
          refundAmountCents: 600000, // > 500000
          reason: 'Big refund',
          idempotencyKey: 'idem-refund-2',
        })
      ).rejects.toThrow(HttpException);

      // Invalid supervisor (not ADMIN)
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-doc', role: 'DOCTOR' });
      await expect(
        service.processRefund({
          sessionId: 'session-1',
          invoiceId: 'inv-1',
          originalTransactionId: 'tx-1',
          refundAmountCents: 600000,
          reason: 'Big refund',
          supervisorId: 'user-doc',
          idempotencyKey: 'idem-refund-3',
        })
      ).rejects.toThrow(HttpException);
    });
  });

  describe('closeSession (Blind Close)', () => {
    it('should close perfectly matching session (Status: CLOSED)', async () => {
      (prisma.cashRegisterSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        cashierId: 'user-1',
        status: RegisterStatus.OPEN,
        openingFloatCents: 5000, // 50.00
        financialTransactions: [
          { amountCents: 10000, paymentMethod: PaymentMethod.CASH }, // + 100.00 (Total Cash: 150.00)
          { amountCents: 5000, paymentMethod: PaymentMethod.CARD },  // + 50.00
          { amountCents: 2000, paymentMethod: PaymentMethod.UPI },   // + 20.00
        ],
      });

      // Expected Cash = 5000 + 10000 = 15000
      // Expected Total = 15000 + 5000 + 2000 = 22000
      (prisma.cashRegisterSession.update as jest.Mock).mockImplementation((args: any) => args.data);

      const payload = {
        sessionId: 'session-1',
        cashierId: 'user-1',
        denominations: [
          { valueCents: 10000, count: 1 }, // 1 * 100.00
          { valueCents: 5000, count: 1 },  // 1 * 50.00  => Total Cash = 15000
        ],
        cardTotalCents: 5000,
        upiTotalCents: 2000,
      };

      const result = await service.closeSession(payload);

      expect(result.discrepancyCents).toBe(0);
      expect(result.status).toBe(RegisterStatus.CLOSED);
      expect(result.expectedCloseAmountCents).toBe(22000);
      expect(result.actualCloseAmountCents).toBe(22000);
    });

    it('should calculate expected totals correctly with REFUND and PAY_OUT', async () => {
      (prisma.cashRegisterSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        cashierId: 'user-1',
        status: RegisterStatus.OPEN,
        openingFloatCents: 10000, // 100.00 Base
        financialTransactions: [
          { amountCents: 5000, paymentMethod: PaymentMethod.CASH, type: TransactionType.PAYMENT }, // +50
          { amountCents: -2000, paymentMethod: PaymentMethod.CASH, type: TransactionType.REFUND }, // -20
          { amountCents: -1000, paymentMethod: PaymentMethod.CASH, type: TransactionType.PAY_OUT },// -10
          { amountCents: 3000, paymentMethod: PaymentMethod.CARD, type: TransactionType.PAYMENT }  // +30 (card)
        ],
      });

      // Expected Cash = 10000 + 5000 - 2000 - 1000 = 12000
      // Expected Total = 12000 + 3000 = 15000
      (prisma.cashRegisterSession.update as jest.Mock).mockImplementation((args: any) => args.data);

      const payload = {
        sessionId: 'session-1',
        cashierId: 'user-1',
        denominations: [
          { valueCents: 10000, count: 1 },
          { valueCents: 2000, count: 1 }, // Total cash reported: 12000
        ],
        cardTotalCents: 3000,
        upiTotalCents: 0,
      };

      const result = await service.closeSession(payload);

      expect(result.discrepancyCents).toBe(0);
      expect(result.status).toBe(RegisterStatus.CLOSED);
      expect(result.expectedCloseAmountCents).toBe(15000);
      expect(result.actualCloseAmountCents).toBe(15000);
    });

    it('should flag session as PENDING_APPROVAL if discrepancy > 2%', async () => {
      (prisma.cashRegisterSession.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-1',
        cashierId: 'user-1',
        status: RegisterStatus.OPEN,
        openingFloatCents: 10000, // Expected Total: 10000 (No transactions)
        financialTransactions: [],
      });

      (prisma.cashRegisterSession.update as jest.Mock).mockImplementation((args: any) => args.data);

      // Cashier only reports 5000 cash (Missing 5000)
      const payload = {
        sessionId: 'session-1',
        cashierId: 'user-1',
        denominations: [{ valueCents: 5000, count: 1 }],
        cardTotalCents: 0,
        upiTotalCents: 0,
      };

      const result = await service.closeSession(payload);

      expect(result.discrepancyCents).toBe(-5000); // 5000 actual - 10000 expected
      expect(result.status).toBe(RegisterStatus.PENDING_APPROVAL); // 5000 is > 2% of 10000 (200)
    });
  });
});
