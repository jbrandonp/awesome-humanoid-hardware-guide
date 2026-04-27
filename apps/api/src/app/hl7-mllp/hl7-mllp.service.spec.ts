import { Test, TestingModule } from '@nestjs/testing';
import { Hl7MllpService } from './hl7-mllp.service';
import { Hl7ParserService } from './hl7-parser.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Hl7MllpService', () => {
  let service: Hl7MllpService;
  let parseMock: jest.Mock;

  beforeEach(async () => {
    parseMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Hl7MllpService,
        { 
          provide: Hl7ParserService, 
          useValue: { parseOruR01: parseMock }
        },
        { provide: PrismaService, useValue: { hl7DeadLetterQueue: {} } },
        { provide: EventEmitter2, useValue: {} },
      ],
    }).compile();

    service = module.get<Hl7MllpService>(Hl7MllpService);
    // Overwrite the injected mock for direct spy access just in case
    (service as any).hl7ParserService = { parseOruR01: parseMock };
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should generate AA ACK on success', async () => {
    parseMock.mockResolvedValue({
      messageControlId: 'MSG001',
      patientId: 'PAT123',
      patientName: 'DOE^JOHN',
      patientDob: '19800101',
      observations: [],
    });

    const result = await service.processHl7Message('MSH|^~\\&|LAB||||20230101000000||ORU^R01|MSG001|P|2.3\rPID|1||PAT123||DOE^JOHN||19800101|M\r');
    
    expect(result).toContain('MSA|AA|MSG001');
  });

  it('should generate AE ACK on parsing error', async () => {
    parseMock.mockRejectedValueOnce(new Error('Invalid segment'));

    const result = await service.processHl7Message('MSH|^~\\&|LAB||||20230101000000||ORU^R01|MSG002|P|2.3\rPID|1||PAT123||DOE^JOHN||19800101|M\r');
    
    expect(result).toContain('MSA|AE|MSG002');
  });

  it('should generate AR ACK on server error', async () => {
    parseMock.mockRejectedValueOnce(new Error('Database error'));

    const result = await service.processHl7Message('MSH|^~\\&|LAB||||20230101000000||ORU^R01|MSG003|P|2.3\rPID|1||PAT123||DOE^JOHN||19800101|M\r');
    
    expect(result).toContain('MSA|AR|MSG003');
  });

  it('should format ACK with MLLP frames', () => {
     const ack = service.generateAck('MSG004', 'AA', 'OK');
     expect(ack).toMatch(/^MSH\|\^~\\&\|LAB_ACK\|LAB\|HIS\|HOSPITAL\|\d+\|\|ACK\^R01\|MSG004\|P\|2.3\rMSA\|AA\|MSG004\|OK\r$/);
  });
});
