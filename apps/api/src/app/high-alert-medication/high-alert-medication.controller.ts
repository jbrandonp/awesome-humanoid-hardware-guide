import { Controller, Post, Body, UnauthorizedException, Logger, UseGuards } from '@nestjs/common';
import { HighAlertMedicationService } from './high-alert-medication.service';
import { DualSignOffSchema, DualSignOff } from '@systeme-sante/models';
import { AuditLog } from '../audit/audit.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('high-alert-medications')
export class HighAlertMedicationController {
  private readonly logger = new Logger(HighAlertMedicationController.name);

  constructor(private readonly service: HighAlertMedicationService) {}

  @UseGuards(AuthGuard('jwt'))
  @AuditLog('HIGH_ALERT_DUAL_SIGNOFF')
  @Post('dual-sign-off')
  async createDualSignOff(@Body() payload: unknown): Promise<{ message: string; status: string }> {
    const result = DualSignOffSchema.safeParse(payload);
    if (!result.success) {
      this.logger.error(`Validation failed for dual sign-off: ${result.error.message}`);
      throw new UnauthorizedException('Invalid secondary sign-off payload format.');
    }

    const typedPayload: DualSignOff = result.data;
    
    // Attempt to validate the second nurse
    const success = await this.service.processDualSignOff(typedPayload);
    
    if (success) {
        return { message: 'Dual sign-off validated successfully.', status: 'SUCCESS' };
    }
    throw new UnauthorizedException('Secondary sign-off failed.');
  }
}
