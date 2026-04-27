import { Controller, Get } from '@nestjs/common';
import { KioskService, KioskState } from './kiosk.service';

@Controller('kiosk')
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  @Get('state')
  async getKioskState(): Promise<KioskState> {
    return this.kioskService.getCurrentState();
  }

  @Get('call-next')
  async callNextPatient(): Promise<{ success: boolean; patient: { id: string; firstName: string; lastName: string } | null }> {
    return this.kioskService.callNextPatient();
  }

  @Get('reset')
  async resetKiosk(): Promise<{ success: boolean }> {
    return this.kioskService.resetQueue();
  }
}