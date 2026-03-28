import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { KioskService } from './kiosk.service';

@WebSocketGateway({
  cors: {
    origin: '*', // For this demo, allow all origins since Kiosk might run on a distinct port/IP
  },
  transports: ['websocket'], // Use native WebSockets for performance/resilience
})
export class KioskGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(KioskGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly kioskService: KioskService) {}

  afterInit(server: Server) {
    this.logger.log('Kiosk WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Kiosk Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Kiosk Client disconnected: ${client.id}`);
  }

  /**
   * Listens for the Kiosk client requesting the current state (on boot or reconnect)
   */
  @SubscribeMessage('REQUEST_CURRENT_STATE')
  async handleRequestCurrentState(@ConnectedSocket() client: Socket) {
    this.logger.log(`Received REQUEST_CURRENT_STATE from Kiosk Client: ${client.id}`);
    const state = await this.kioskService.getCurrentState();
    // Send the state back to the specific client that requested it
    client.emit('CURRENT_STATE', state);
  }

  /**
   * Heartbeat / Ping-Pong mechanism to detect ghost disconnects
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() timestamp: number) {
    // Respond with a pong and the original timestamp so the client can calculate latency
    client.emit('pong', timestamp);
  }

  /**
   * Helper method for other services to broadcast a "Patient Called" event
   * Whenever this is called, Kiosk clients will receive the ping and
   * automatically send a new REQUEST_CURRENT_STATE
   */
  public broadcastPatientCalled() {
    this.logger.log('Broadcasting PATIENT_CALLED to all connected Kiosk clients');
    this.server.emit('PATIENT_CALLED');
  }
}
