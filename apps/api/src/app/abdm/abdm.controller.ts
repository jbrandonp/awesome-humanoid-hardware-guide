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
    @Body('aadhar') aadhar: string,
    @Body('otp') otp: string
  ) {
    return this.abdmService.createAbha(aadhar, otp);
  }

  @Post('hip/share')
  @AuditLog('ABDM_HIP_SHARE_RECORDS')
  async shareRecords(
    @Body('consentId') consentId: string,
    @Body('encryptedData') encryptedData: string
  ) {
    return this.abdmService.shareHealthRecords(consentId, encryptedData);
  }

  @Post('hiu/request')
  @AuditLog('ABDM_HIU_REQUEST_RECORDS')
  async requestRecords(
    @Body('patientAbha') patientAbha: string,
    @Body('purpose') purpose: string
  ) {
    return this.abdmService.requestHealthRecords(patientAbha, purpose);
  }
}
