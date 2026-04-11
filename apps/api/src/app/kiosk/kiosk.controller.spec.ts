import { Test, TestingModule } from '@nestjs/testing';
import { KioskController } from './kiosk.controller';
import { KioskService } from './kiosk.service';
import { AuthGuard } from '@nestjs/passport';

describe('KioskController', () => {
  let controller: KioskController;
  let mockKioskService: Partial<KioskService>;

  beforeEach(async () => {
    mockKioskService = {
      getCurrentState: jest.fn().mockResolvedValue({
        currentPatient: null,
        queueLength: 0,
        estimatedWaitTime: 0,
      }),
      callNextPatient: jest.fn().mockResolvedValue({
        success: true,
        patient: { id: 'patient-123', firstName: 'John', lastName: 'Doe' },
      }),
      resetQueue: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KioskController],
      providers: [
        {
          provide: KioskService,
          useValue: mockKioskService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<KioskController>(KioskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /kiosk/state', () => {
    it('should call kioskService.getCurrentState', async () => {
      const result = await controller.getKioskState();
      expect(mockKioskService.getCurrentState).toHaveBeenCalled();
      expect(result).toEqual({
        currentPatient: null,
        queueLength: 0,
        estimatedWaitTime: 0,
      });
    });
  });

  describe('POST /kiosk/call-next', () => {
    it('should call kioskService.callNextPatient', async () => {
      const result = await controller.callNextPatient();
      expect(mockKioskService.callNextPatient).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        patient: { id: 'patient-123', firstName: 'John', lastName: 'Doe' },
      });
    });
  });

  describe('POST /kiosk/reset', () => {
    it('should call kioskService.resetQueue', async () => {
      const result = await controller.resetKiosk();
      expect(mockKioskService.resetQueue).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});