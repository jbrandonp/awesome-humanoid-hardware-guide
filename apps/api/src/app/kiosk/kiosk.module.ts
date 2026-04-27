import { Module } from '@nestjs/common';
import { KioskGateway } from './kiosk.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { KioskService } from './kiosk.service';
import { KioskController } from './kiosk.controller';

@Module({
  imports: [PrismaModule],
  controllers: [KioskController],
  providers: [KioskGateway, KioskService],
  exports: [KioskService], // Expose the service so other modules can call "callPatient"
})
export class KioskModule {}
