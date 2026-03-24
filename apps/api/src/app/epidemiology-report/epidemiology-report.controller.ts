import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role, ActionType } from '@prisma/client';
import { EpidemiologyReportService } from './epidemiology-report.service';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

@Controller('reports/epidemiology')
export class EpidemiologyReportController {
  constructor(
    private readonly reportService: EpidemiologyReportService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.MINISTRY_LIAISON)
  @UseGuards(RolesGuard)

  async getEpidemiologyReport(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // default last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    // Log the action to AuditLog
    if (req.user && req.user.id) {
      await this.auditService.logAudit({
        userId: req.user.id,
        patientId: 'SYSTEM', // No specific patient for aggregate report
        actionType: ActionType.READ,
        resourceId: 'EpidemiologyReport',
        phiDataAccessed: {
          reportType: 'EPIDEMIOLOGY',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        ipAddress: req.ip || '0.0.0.0'
      });
    }

    return this.reportService.getReport(start, end);
  }
}
