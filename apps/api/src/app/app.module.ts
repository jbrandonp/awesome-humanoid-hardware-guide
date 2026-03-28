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
import { IotModule } from './iot/iot.module';
import { PeerConsultModule } from './peer-consult/peer-consult.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TickerModule } from './ticker/ticker.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { EngagementModule } from './engagement/engagement.module';
import { EpidemiologyReportModule } from './epidemiology-report/epidemiology-report.module';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
// Previously missing modules
import { AdtModule } from './adt/adt.module';
import { NursingStationModule } from './nursing-station/nursing-station.module';
import { DrugInteractionModule } from './drug-interaction/drug-interaction.module';
import { HighAlertMedicationModule } from './high-alert-medication/high-alert-medication.module';
import { RemotePatientMonitoringModule } from './remote-patient-monitoring/remote-patient-monitoring.module';
import { ConsentManagerModule } from './consent-manager/consent-manager.module';
// Additional missing modules
import { Hl7MllpModule } from './hl7-mllp/hl7-mllp.module';
import { InventoryPredictorModule } from './inventory-predictor/inventory-predictor.module';
import { KioskModule } from './kiosk/kiosk.module';
import { PacsIndexerModule } from './pacs-indexer/pacs-indexer.module';
import { ProcurementModule } from './procurement/procurement.module';
import { QueueModule } from './queue/queue.module';
import { WaitingRoomModule } from './waiting-room/waiting-room.module';
import { CryptoModule } from './crypto/crypto.module';
import { EmarModule } from './emar/emar.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL || 'mongodb://mongo_admin:mongo_password@localhost:27017/medical_db?authSource=admin'),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
       connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10)
       }
    }),
    // Core
    PrismaModule, AuthModule, AuditModule, DpdpaModule,
    // Features
    SyncModule, WhisperModule, AbdmModule, OcrModule, FhirModule,
    ClinicalRecordModule, BillingModule, IotModule, PeerConsultModule,
    TickerModule, IntelligenceModule, EngagementModule, EpidemiologyReportModule,
    // Previously missing modules
    AdtModule, NursingStationModule, DrugInteractionModule,
    HighAlertMedicationModule, RemotePatientMonitoringModule, ConsentManagerModule,
    // Additional missing modules
    Hl7MllpModule, InventoryPredictorModule, KioskModule, PacsIndexerModule,
    ProcurementModule, QueueModule, WaitingRoomModule, CryptoModule,
    EmarModule
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
