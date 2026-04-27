import { Module } from '@nestjs/common';
import { WaitingRoomGateway } from './waiting-room.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [WaitingRoomGateway],
  exports: [WaitingRoomGateway],
})
export class WaitingRoomModule {}
