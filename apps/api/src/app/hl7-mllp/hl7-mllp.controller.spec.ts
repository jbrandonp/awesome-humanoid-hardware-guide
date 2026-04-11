import { Test, TestingModule } from '@nestjs/testing';
import { Hl7MllpController } from './hl7-mllp.controller';
import { Hl7MllpService } from './hl7-mllp.service';
import { Hl7ParserService } from './hl7-parser.service';
import { AuthGuard } from '@nestjs/passport';

describe('Hl7MllpController', () => {
  let controller: Hl7MllpController;
  let mockHl7MllpService: Partial<Hl7MllpService>;
  let mockHl7ParserService: Partial<Hl7ParserService>;

  beforeEach(async () => {
    mockHl7MllpService = {
      processHl7Message: jest.fn().mockResolvedValue('MSH|...'),
    };
    mockHl7ParserService = {
      parseOruR01: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [Hl7MllpController],
      providers: [
        {
          provide: Hl7MllpService,
          useValue: mockHl7MllpService,
        },
        {
          provide: Hl7ParserService,
          useValue: mockHl7ParserService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<Hl7MllpController>(Hl7MllpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /hl7/send', () => {
    it('should process HL7 message and return acknowledgment', async () => {
      const mockMessage = 'MSH|^~\\&|LAB|...';
      const result = await controller.sendHl7Message({ message: mockMessage });
      // Note: The controller currently doesn't call hl7MllpService.processHl7Message
      // It parses with hl7ParserService and generates its own ack
      expect(result).toEqual({ 
        success: true,
        message: 'Message HL7 reçu et traité',
        ack: expect.any(String),
        parsed: undefined
      });
    });

    it('should throw error when message is missing', async () => {
      await expect(controller.sendHl7Message({})).rejects.toThrow('Message HL7 requis');
    });

    it('should throw error when message does not contain MSH segment', async () => {
      const invalidMessage = 'INVALID|segment|...';
      await expect(controller.sendHl7Message({ message: invalidMessage })).rejects.toThrow('segment MSH manquant');
    });
  });

  describe('POST /hl7/parse', () => {
    it('should call hl7ParserService.parseOruR01 with the raw message', async () => {
      const mockMessage = 'MSH|^~\\&|LAB|...';
      const mockParsed = { messageControlId: '123' };
      mockHl7ParserService.parseOruR01 = jest.fn().mockResolvedValue(mockParsed);
      const result = await controller.parseHl7Message({ message: mockMessage });
      expect(mockHl7ParserService.parseOruR01).toHaveBeenCalledWith(mockMessage);
      expect(result).toEqual(mockParsed);
    });

    it('should throw error when message is missing', async () => {
      await expect(controller.parseHl7Message({})).rejects.toThrow('Message HL7 requis');
    });

    it('should handle parsing errors gracefully', async () => {
      const invalidMessage = 'MSH|^~\\&|LAB|...'; // malformed but has MSH
      mockHl7ParserService.parseOruR01 = jest.fn().mockImplementation(() => {
        throw new Error('HL7 parsing error');
      });
      await expect(controller.parseHl7Message({ message: invalidMessage })).rejects.toThrow('Erreur lors du parsing');
    });
  });

  describe('GET /hl7/status', () => {
    it('should return HL7 status information', () => {
      const result = controller.getHl7Status();
      expect(result.mllpEnabled).toBe(true);
      expect(result.httpEndpoint).toBe(true);
      expect(result.supportedMessageTypes).toContain('ADT^A01');
    });
  });

  describe('POST /hl7/ack', () => {
    it('should acknowledge receipt of HL7 ACK', async () => {
      const ackData = {
        originalMessageId: '12345',
        ackMessage: 'MSH|...',
        status: 'AA'
      };
      const result = await controller.receiveHl7Ack(ackData);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Accusé');
    });
  });
});