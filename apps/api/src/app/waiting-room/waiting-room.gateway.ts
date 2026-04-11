import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { NextPatientDto } from './dto/next-patient.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/waiting-room',
})
export class WaitingRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WaitingRoomGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      // 1. JWT Authentication on Handshake
      const token = client.handshake.auth?.token || client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) {
        this.logger.warn(`Client connect rejected: missing token`);
        client.disconnect(true);
        return;
      }

      // 2. Validate JWT and extract payload
      if (!process.env.JWT_SECRET) {
        throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET is not defined in environment variables.');
      }
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET, // Should match AuthService
      });

      // 3. Security Constraint: Must have DISPLAY_KIOSK role
      if (payload.role !== 'DISPLAY_KIOSK') {
        this.logger.warn(`Client connect rejected: invalid role ${payload.role}`);
        client.disconnect(true);
        return;
      }

      // 4. Multi-Zone Management: Require departmentId
      const departmentId = client.handshake.query?.departmentId as string;
      if (!departmentId) {
        this.logger.warn(`Client connect rejected: missing departmentId`);
        client.disconnect(true);
        return;
      }

      client.data.user = payload;
      client.data.departmentId = departmentId;

      // Join the specific room for this department
      await client.join(departmentId);
      this.logger.log(`Client ${client.id} connected and joined room ${departmentId}`);
     } catch (error: unknown) {
       this.logger.error(`Client connect error: ${error instanceof Error ? error.message : String(error)}`);
       client.disconnect(true);
     }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  // Method to be called by other NestJS services (e.g., REST controllers or CQRS Handlers)
  // Ensures DPDPA compliance: Broadcasts strict DTO, NOT the full patient object
  broadcastNextPatient(data: NextPatientDto): void {
    this.logger.log(`Broadcasting NEXT_PATIENT to room ${data.departmentId}`);
    
    // Broadcast only strictly necessary fields (ticket number/pseudonym, target room)
    this.server.to(data.departmentId).emit('NEXT_PATIENT', {
      ticketNumber: data.ticketNumber,
      targetRoom: data.targetRoom,
    });
  }
}
