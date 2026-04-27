import { Test, TestingModule } from '@nestjs/testing';
import { IotController } from './iot.controller';
import { IotMedicalService } from './iot.service';
import { AuthGuard } from '@nestjs/passport';

describe('IotController', () => {
  let controller: IotController;
  let mockIotService: Partial<IotMedicalService>;

  beforeEach(async () => {
    mockIotService = {
      processBleGattData: jest.fn(),
      processSmartPenInk: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IotController],
      providers: [
        {
          provide: IotMedicalService,
          useValue: mockIotService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<IotController>(IotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /iot/ble/blood-pressure', () => {
    it('should call iotService.processBleGattData with correct parameters', async () => {
      const mockData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        practitionerId: '123e4567-e89b-12d3-a456-426614174001',
        deviceMetadata: {
          hardwareMacAddress: '00:11:22:33:44:55',
          manufacturerName: 'OMRON',
          batteryLevelPercentage: 80,
        },
        systolicMmHg: 120,
        diastolicMmHg: 80,
        meanArterialPressureMmHg: 93,
        pulseRateBpm: 72,
        acquisitionTimestampIso: '2023-01-01T12:00:00Z',
      };
      await controller.receiveBleBloodPressure(mockData);
      expect(mockIotService.processBleGattData).toHaveBeenCalledWith(mockData);
    });

    it('should throw validation error for invalid blood pressure data', async () => {
      const invalidData = {
        patientId: 'not-a-uuid',
        systolicMmHg: -5, // negative value invalid
      };
      await expect(controller.receiveBleBloodPressure(invalidData)).rejects.toThrow();
    });
  });

  describe('POST /iot/smart-pen/ink', () => {
    it('should call iotService.processSmartPenInk with correct parameters', async () => {
      const mockData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        practitionerId: '123e4567-e89b-12d3-a456-426614174001',
        deviceMetadata: {
          hardwareMacAddress: 'AA:BB:CC:DD:EE:FF',
          manufacturerName: 'WONDRx',
          batteryLevelPercentage: 75,
        },
        rawSvgPathData: 'M10 10 L20 20',
        acquisitionTimestampIso: '2023-01-01T12:00:00Z',
      };
      await controller.receiveSmartPenInk(mockData);
      expect(mockIotService.processSmartPenInk).toHaveBeenCalledWith(mockData);
    });

    it('should throw validation error for invalid smart pen data', async () => {
      const invalidData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        practitionerId: '123e4567-e89b-12d3-a456-426614174001',
        deviceMetadata: {
          hardwareMacAddress: 'invalid-mac',
          manufacturerName: '',
          batteryLevelPercentage: 150, // out of range
        },
        rawSvgPathData: '', // too short
        acquisitionTimestampIso: 'not-a-date',
      };
      await expect(controller.receiveSmartPenInk(invalidData)).rejects.toThrow();
    });
  });

  describe('POST /iot/device/heartbeat', () => {
    it('should return status OK with configuration', async () => {
      const mockData = { deviceId: 'device-123', batteryLevel: 85 };
      const result = await controller.deviceHeartbeat(mockData);
      expect(result.status).toBe('OK');
      expect(result.timestamp).toBeDefined();
      expect(result.configuration).toBeDefined();
    });
  });
});