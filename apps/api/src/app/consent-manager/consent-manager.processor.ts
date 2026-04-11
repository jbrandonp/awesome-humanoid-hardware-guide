import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalRecordService } from '../clinical-record/clinical-record.service';
import { RevokeConsentJobPayload } from './consent-manager.service';
import { randomUUID } from 'crypto';

@Processor('consent-queue')
export class ConsentManagerProcessor extends WorkerHost {
  private readonly logger = new Logger(ConsentManagerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clinicalRecordService: ClinicalRecordService
  ) {
    super();
  }

  async process(job: Job<RevokeConsentJobPayload, unknown, string>): Promise<{ success: boolean; recordsUpdatedCount: number } | unknown> {
    const { patientId, userId, ipAddress } = job.data;
    
    this.logger.log(`[ConsentManager Worker] Démarrage de la révocation asynchrone pour le patient: ${patientId}`);

    try {
      // ============================================================================
      // 1. SOFT DELETE RÉCURSIF DANS POSTGRESQL (Transactions)
      // ============================================================================
      let recordsUpdatedCount = 0;
      const deletedAt = new Date();

      await this.prisma.$transaction(async (tx) => {
        // Soft delete Prescriptions
        const pres = await tx.prescription.updateMany({
          where: { patientId, status: { not: 'deleted' } },
          data: { status: 'deleted', deletedAt }
        });
        recordsUpdatedCount += pres.count;

        // Soft delete Vitals
        const vitals = await tx.vital.updateMany({
          where: { patientId, status: { not: 'deleted' } },
          data: { status: 'deleted', deletedAt }
        });
        recordsUpdatedCount += vitals.count;

        // Soft delete Visits
        const visits = await tx.visit.updateMany({
          where: { patientId, status: { not: 'deleted' } },
          data: { status: 'deleted', deletedAt }
        });
        recordsUpdatedCount += visits.count;

        // Pseudonymize Patient (Anonymize identity, shift DoB, keep ID for Invoices)
        // Shifting DOB by 10 days for example
        const patient = await tx.patient.findUnique({ where: { id: patientId }});
        if (patient) {
          const shiftedDob = new Date(patient.dateOfBirth);
          shiftedDob.setDate(shiftedDob.getDate() + 10);
          
          await tx.patient.update({
             where: { id: patientId },
             data: {
               firstName: `ANON-${randomUUID().slice(0, 8)}`,
               lastName: `ANON-${randomUUID().slice(0, 8)}`,
               dateOfBirth: shiftedDob,
               status: 'deleted',
               deletedAt,
             }
          });
          recordsUpdatedCount += 1;
        }

        // Révocation du Droit d'Accès si un userId spécifique est fourni (ou pour tous)
        const consentWhere = userId ? { userId, patientId } : { patientId };
        await tx.dpdpaConsent.deleteMany({
          where: consentWhere
        });

        // TRACE INALTÉRABLE
        await tx.auditLog.create({
          data: {
             userId: userId || 'SYSTEM',
             patientId: patientId,
             actionType: 'DELETE',
             resourceId: patientId,
             phiDataAccessed: {},
             ipAddress: ipAddress,
             // Add metadata via phiDataAccessed or if schema is updated
          }
        });
      }, { timeout: 15000 });

      this.logger.log(`[ConsentManager Worker] Soft delete Postgres validé. Entrées affectées: ${recordsUpdatedCount}`);

      // ============================================================================
      // 2. JOB ASYNCHRONE D'ANONYMISATION DES DOSSIERS CLINIQUES (MONGODB)
      // ============================================================================
      try {
        const mongoUpdatedCount = await this.clinicalRecordService.anonymizePatientRecords(patientId);
        this.logger.log(`[ConsentManager Worker] Anonymisation MongoDB terminée. Documents anonymisés: ${mongoUpdatedCount}`);
      } catch (mongoError) {
        this.logger.error(`[ConsentManager Worker] Échec de l'anonymisation MongoDB pour le patient: ${patientId}`, mongoError);
        // MongoDB failed, but Postgres succeeded. Depending on requirements, we could retry this step.
      }

      this.logger.log(`[ConsentManager Worker] Révocation asynchrone terminée avec succès pour: ${patientId}`);
      return { success: true, recordsUpdatedCount };
    } catch (error) {
      this.logger.error(`[ConsentManager Worker] Échec critique lors du traitement du job de révocation pour: ${patientId}`, error);
      throw error;
    }
  }
}
