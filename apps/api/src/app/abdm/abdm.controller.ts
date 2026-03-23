import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AbdmService } from './abdm.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';

@Controller('abdm')
@UseGuards(AuthGuard('jwt'))
export class AbdmController {
  constructor(private readonly abdmService: AbdmService) {}

  @Post('auth/abha')
  @AuditLog('ABDM_CREATE_ABHA')
  async createAbhaAccount(
    @Body() request: import('./abdm.service').AbhaRegistrationRequest,
  ) {
    return this.abdmService.createAbha(request);
  }

  @Post('hip/share')
  @AuditLog('ABDM_HIP_SHARE_RECORDS')
  async shareRecords(
    @Body() request: import('./abdm.service').HipShareRequest,
  ) {
    return this.abdmService.shareHealthRecords(request);
  }

  @Post('hiu/request')
  @AuditLog('ABDM_HIU_REQUEST_RECORDS')
  async requestRecords(@Body() request: import('./abdm.service').HiuRequest) {
    return this.abdmService.requestHealthRecords(request);
  }
}
