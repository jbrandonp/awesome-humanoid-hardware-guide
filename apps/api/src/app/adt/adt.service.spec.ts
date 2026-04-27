import { Test, TestingModule } from '@nestjs/testing';
import { AdtService } from './adt.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AdtService', () => {
  let service: AdtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdtService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdtService>(AdtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
