import { Injectable, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit.interceptor';
import { DpdpaConsentService } from './dpdpa-consent.service';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AuditModule {}

@Module({
  imports: [PrismaModule],
  providers: [DpdpaConsentService],
  exports: [DpdpaConsentService],
})
export class DpdpaModule {}
