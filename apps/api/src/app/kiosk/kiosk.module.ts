import { Module } from '@nestjs/common';
import { KioskGateway } from './kiosk.gateway';
import { KioskService } from './kiosk.service';

@Module({
  providers: [KioskGateway, KioskService],
  exports: [KioskService], // Expose the service so other modules can call "callPatient"
})
export class KioskModule {}
