import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AbdmService } from './abdm.service';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';
import type { AbhaRegistrationResult, AbdmApiResponse } from './abdm.service';
import type { PredictiveAlert } from './inventory.service';

@Controller('abdm')
@UseGuards(AuthGuard('jwt'))
export class AbdmController {
  constructor(
    private readonly abdmService: AbdmService,
    private readonly inventoryService: InventoryService
  ) {}

  @Post('auth/abha')
  @AuditLog('ABDM_CREATE_ABHA')
  async createAbhaAccount(
    @Body() request: unknown
  ): Promise<AbhaRegistrationResult> {
    return this.abdmService.createAbha(request);
  }

  @Post('hip/share')
  @AuditLog('ABDM_HIP_SHARE_RECORDS')
  async shareRecords(
    @Body() request: unknown
  ): Promise<AbdmApiResponse> {
    return this.abdmService.shareHealthRecords(request);
  }

  @Post('hiu/request')
  @AuditLog('ABDM_HIU_REQUEST_RECORDS')
  async requestRecords(
    @Body() request: unknown
  ): Promise<AbdmApiResponse> {
    return this.abdmService.requestHealthRecords(request);
  }

  @Post('inventory/analyze')
  @AuditLog('INVENTORY_PREDICTIVE_ANALYSIS')
  async runInventoryAnalysis(): Promise<PredictiveAlert[]> {
    return this.inventoryService.runPredictiveAnalysis();
  }
}
