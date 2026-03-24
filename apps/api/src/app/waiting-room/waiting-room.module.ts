import { Module } from '@nestjs/common';
import { WaitingRoomGateway } from './waiting-room.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [WaitingRoomGateway],
  exports: [WaitingRoomGateway],
})
export class WaitingRoomModule {}
