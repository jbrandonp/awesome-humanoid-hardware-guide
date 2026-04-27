import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit-dpdpa.module';
import { EpidemiologyReportController } from './epidemiology-report.controller';
import { EpidemiologyReportService } from './epidemiology-report.service';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    CacheModule.register({
      ttl: 12 * 60 * 60 * 1000, // 12 hours
    }),
  ],
  controllers: [EpidemiologyReportController],
  providers: [EpidemiologyReportService],
})
export class EpidemiologyReportModule {}
