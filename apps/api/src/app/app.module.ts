import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SyncModule } from './sync/sync.module';
import { WhisperModule } from './whisper/whisper.module';
import { AuthModule } from './auth/auth.module';
import { SessionTimeoutMiddleware } from './auth/session-timeout.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule, DpdpaModule } from './audit/audit-dpdpa.module';
import { AbdmModule } from './abdm/abdm.module';
import { OcrModule } from './ocr/ocr.module';
import { FhirModule } from './fhir/fhir.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicalRecordModule } from './clinical-record/clinical-record.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL || 'mongodb://mongo_admin:mongo_password@localhost:27017/medical_db?authSource=admin'),
    SyncModule, AuthModule, PrismaModule, AuditModule, DpdpaModule, WhisperModule, AbdmModule, OcrModule, FhirModule, ClinicalRecordModule, BillingModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SessionTimeoutMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
