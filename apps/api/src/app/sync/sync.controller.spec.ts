import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { JwtService } from '@nestjs/jwt';

describe('SyncController', () => {
  let controller: SyncController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: {}
        },
        {
          provide: JwtService,
          useValue: {}
        }
      ]
    }).compile();

    controller = module.get<SyncController>(SyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
