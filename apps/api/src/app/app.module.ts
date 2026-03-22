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

@Module({
  imports: [SyncModule, AuthModule, PrismaModule, AuditModule, DpdpaModule, WhisperModule, AbdmModule, OcrModule, FhirModule],
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
