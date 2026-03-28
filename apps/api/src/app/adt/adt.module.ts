import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module';
import { AdtService } from './adt.service';

@Module({
  imports: [PrismaModule, EventEmitterModule.forRoot()],
  providers: [AdtService],
  exports: [AdtService],
})
export class AdtModule {}
