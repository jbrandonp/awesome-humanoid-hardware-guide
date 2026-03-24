import { Injectable, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit.interceptor';
import { DpdpaConsentService } from './dpdpa-consent.service';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    AuditService,
    AuditRepository,
  ],
  exports: [AuditService, AuditRepository],
})
export class AuditModule {}

<<<<<<< HEAD
@Module({
  imports: [PrismaModule],
=======
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
>>>>>>> origin/main
  providers: [DpdpaConsentService],
  exports: [DpdpaConsentService],
})
export class DpdpaModule {}
