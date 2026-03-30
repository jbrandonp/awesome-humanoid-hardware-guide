import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as net from 'net';
import { Hl7ParserService } from './hl7-parser.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class Hl7MllpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Hl7MllpService.name);
  private server!: net.Server;
  private readonly MLLP_VT = Buffer.from([0x0b]);
  private readonly MLLP_FS_CR = Buffer.from([0x1c, 0x0d]);

  constructor(
    private readonly hl7ParserService: Hl7ParserService,
    prismaService: PrismaService,
    eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    const MAX_MESSAGE_SIZE = 10 * 1024 * 1024; // 10MB (HL7 messages can be large if they contain base64 imagery)

    this.server = net.createServer((socket) => {
      let buffer = Buffer.alloc(0);

      socket.on('data', async (data) => {
        // SECURITY: Check for buffer overflow to prevent Heap OOM
        if (buffer.length + data.length > MAX_MESSAGE_SIZE) {
          this.logger.error(`[HL7-MLLP] Message size exceeded limit (10MB). Closing socket to prevent OOM.`);
          socket.destroy();
          return;
        }

        buffer = Buffer.concat([buffer, data]);
        
        // SECURITY: Discard leading noise before VT (0x0b) to prevent unbounded garbage accumulation
        const firstVtIndex = buffer.indexOf(this.MLLP_VT);
        if (firstVtIndex > 0) {
          buffer = buffer.subarray(firstVtIndex);
        } else if (firstVtIndex === -1 && buffer.length > 0) {
          // Discard everything if no VT found yet (all noise)
          buffer = Buffer.alloc(0);
        }

        // Find MLLP boundaries
        let vtIndex = buffer.indexOf(this.MLLP_VT);
        let fsCrIndex = buffer.indexOf(this.MLLP_FS_CR);

        while (vtIndex !== -1 && fsCrIndex !== -1 && vtIndex < fsCrIndex) {
          const payloadBuffer = buffer.subarray(vtIndex + 1, fsCrIndex);
          const rawMessage = payloadBuffer.toString('utf-8');
          
          // Process message
          const ack = await this.processHl7Message(rawMessage);
          
          // Send ACK
          const ackMessage = Buffer.concat([
            this.MLLP_VT,
            Buffer.from(ack, 'utf-8'),
            this.MLLP_FS_CR
          ]);
          socket.write(ackMessage);

          // Update buffer
          buffer = buffer.subarray(fsCrIndex + 2);
          vtIndex = buffer.indexOf(this.MLLP_VT);
          fsCrIndex = buffer.indexOf(this.MLLP_FS_CR);
        }
      });

      socket.on('error', (err) => {
        this.logger.error(`Socket error: ${err.message}`);
      });
    });

    const port = parseInt(process.env.HL7_PORT || '2575', 10);
    this.server.listen(port, () => {
      this.logger.log(`MLLP Server listening on port ${port}`);
    });
  }

  onModuleDestroy() {
    if (this.server) {
      this.server.close();
    }
  }

  public async processHl7Message(rawMessage: string): Promise<string> {
    try {
      const parsed = await this.hl7ParserService.parseOruR01(rawMessage);
      
      return this.generateAck(parsed.messageControlId, 'AA', 'Message processed successfully');
    } catch (error: unknown) {
      // Intentionally not logging full stack trace in tests to keep output clean,
      // but in production, we still want to log the error message.
      if (process.env.NODE_ENV !== 'test') {
        this.logger.error(`Error processing HL7 message`, error);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let messageId = 'UNKNOWN';
      let ackCode = 'AE';

      // Attempt to extract MSH-10 for the ACK if parser failed halfway
      try {
        const segments = rawMessage.split(/\r?\n/);
        const msh = segments.find(s => s.startsWith('MSH|'));
        if (msh) {
          const mshFields = msh.split('|');
          if (mshFields.length >= 10 && mshFields[9]) {
             messageId = mshFields[9];
          }
        }
      } catch (e) {
        // Ignored, we just want to fall back to UNKNOWN
      }
      
      if (errorMessage.includes('Server error') || errorMessage.includes('Database error')) {
        ackCode = 'AR';
      } else {
        ackCode = 'AE';
      }

      return this.generateAck(messageId, ackCode, errorMessage);
    }
  }

  public generateAck(messageControlId: string, ackCode: string, textMessage: string): string {
    const date = new Date();
    const formattedDate = date.getFullYear().toString() + 
      (date.getMonth() + 1).toString().padStart(2, '0') + 
      date.getDate().toString().padStart(2, '0') + 
      date.getHours().toString().padStart(2, '0') + 
      date.getMinutes().toString().padStart(2, '0') + 
      date.getSeconds().toString().padStart(2, '0');

    const msh = `MSH|^~\\&|LAB_ACK|LAB|HIS|HOSPITAL|${formattedDate}||ACK^R01|${messageControlId}|P|2.3`;
    const msa = `MSA|${ackCode}|${messageControlId}|${textMessage}`;
    
    return `${msh}\r${msa}\r`;
  }
}
