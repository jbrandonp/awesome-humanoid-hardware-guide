import { Test, TestingModule } from '@nestjs/testing';
import { TickerController } from './ticker.controller';
import { EpiTickerService } from './epi-ticker.service';
import { AuditService } from '../audit/audit.service';
import { InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { ActionType } from '@prisma/client';

describe('TickerController', () => {
  let controller: TickerController;
  let mockAuditService: any;
  let mockEpiTickerService: any;

  beforeEach(async () => {
    mockAuditService = {
      logAudit: jest.fn().mockResolvedValue({ id: 'audit-123' }),
    };

    mockEpiTickerService = {
      getTickerStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TickerController],
      providers: [
        { provide: EpiTickerService, useValue: mockEpiTickerService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    controller = module.get<TickerController>(TickerController);
  });

  describe('exportEpidemiologyReport', () => {
    it('should call AuditService.logAudit with correct parameters and return success', async () => {
      const mockReq = {
        user: { userId: 'admin-456' },
        ip: '127.0.0.1'
      };

      const result = await controller.exportEpidemiologyReport(mockReq as any);

      expect(mockAuditService.logAudit).toHaveBeenCalledWith({
        userId: 'admin-456',
        patientId: 'SYSTEM',
        actionType: ActionType.EXPORT_REPORT,
        resourceId: 'Epidemiology_Monthly',
        phiDataAccessed: {},
        ipAddress: '127.0.0.1',
      });
      expect(result).toEqual({ success: true, message: 'Export autorisé et tracé' });
    });

    it('should throw InternalServerErrorException (and block PDF export) if AuditService.logAudit fails', async () => {
      mockAuditService.logAudit.mockRejectedValueOnce(new Error('DB Error'));

      const mockReq = {
        user: { userId: 'admin-456' },
        ip: '127.0.0.1'
      };

      await expect(controller.exportEpidemiologyReport(mockReq as any))
        .rejects
        .toThrow(InternalServerErrorException);
    });

    it('should throw ForbiddenException if user is not authenticated', async () => {
      const mockReq = {
        user: undefined,
        ip: '127.0.0.1'
      };

      await expect(controller.exportEpidemiologyReport(mockReq as any))
        .rejects
        .toThrow(ForbiddenException);
    });
  });
});
