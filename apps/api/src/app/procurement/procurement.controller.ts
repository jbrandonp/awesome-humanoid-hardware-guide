import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditLog } from '../audit/audit.decorator';
import { z } from 'zod';

const ApproveDraftSchema = z.object({
  quantity: z.number().int().positive().optional(),
  supplierId: z.string().uuid().optional(),
});

@Controller('procurement')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('drafts')
  @Roles('PHARMACIST', 'ADMIN')
  async getDrafts(): Promise<unknown> {
    return this.procurementService.getDrafts();
  }

  @Put(':id/approve')
  @Roles('PHARMACIST', 'ADMIN')
  @AuditLog('P2P_APPROVE_ORDER')
  async approveDraft(@Param('id') id: string, @Body() body: unknown): Promise<unknown> {
    const updates = ApproveDraftSchema.parse(body);
    return this.procurementService.approveDraft(id, updates);
  }
}
