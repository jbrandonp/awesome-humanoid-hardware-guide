import { Module } from '@nestjs/common';
import { NursingStationController } from './nursing-station.controller';
import { NursingStationService } from './nursing-station.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NursingStationController],
  providers: [NursingStationService],
  exports: [NursingStationService],
})
export class NursingStationModule {}