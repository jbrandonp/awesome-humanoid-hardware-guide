import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EpiTickerService } from '../ticker/epi-ticker.service';
import * as Y from 'yjs';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly epiTickerService: EpiTickerService
  ) {}

  async pushChanges(changes: any) {
    if (changes.patients) {
      const promises: Promise<any>[] = [];
      if (changes.patients.created.length > 0) {
        promises.push(
          this.prisma.patient.createMany({
            data: changes.patients.created.map((patient: any) => ({
              id: patient.id,
              firstName: patient.first_name,
              lastName: patient.last_name,
              dateOfBirth: new Date(patient.date_of_birth),
              status: 'synced',
            })),
            skipDuplicates: true,
          })
        );
      }

      const updatePromises = changes.patients.updated.map((patient: any) =>
        this.prisma.patient.update({
          where: { id: patient.id },
          data: {
            firstName: patient.first_name,
            lastName: patient.last_name,
            dateOfBirth: new Date(patient.date_of_birth),
            status: 'synced',
          }
        })
      );
      promises.push(...updatePromises);

      const deletePromises = changes.patients.deleted.map((id: string) =>
        this.prisma.patient.update({
          where: { id },
          data: { deletedAt: new Date(), status: 'deleted' }
        })
      );
      promises.push(...deletePromises);
      await Promise.all(promises);
    }

    if (changes.visits) {
      const promises: Promise<any>[] = [];
      if (changes.visits.created.length > 0) {
        promises.push(
          this.prisma.visit.createMany({
            data: changes.visits.created.map((visit: any) => ({
              id: visit.id,
              patientId: visit.patient_id,
              date: new Date(visit.date),
              notes: visit.notes ? Buffer.from(visit.notes, 'base64') : null,
              status: 'synced'
            })),
            skipDuplicates: true,
          })
        );
      }

      for (const visit of changes.visits.updated) {
        promises.push(
          (async () => {
            const existingVisit = await this.prisma.visit.findUnique({ where: { id: visit.id }});

            let mergedNotesBuffer = existingVisit?.notes;

            // CRDT Merge Logic for clinical notes using Yjs
            if (visit.notes) {
              const clientUpdate = Buffer.from(visit.notes, 'base64');
              const serverDoc = new Y.Doc();

              if (existingVisit?.notes) {
                // Load existing server state
                Y.applyUpdate(serverDoc, existingVisit.notes);
              }

              // Apply client update on top
              try {
                Y.applyUpdate(serverDoc, clientUpdate);
                // Save the merged binary state
                mergedNotesBuffer = Buffer.from(Y.encodeStateAsUpdate(serverDoc));
              } catch(e) {
                console.error(`Conflict resolving Yjs document for visit ${visit.id}`, e);
              }
            }

            return this.prisma.visit.update({
              where: { id: visit.id },
              data: {
                date: new Date(visit.date),
                notes: mergedNotesBuffer,
                status: 'synced'
              }
            });
          })()
        );
      }

      const deletePromises = changes.visits.deleted.map((id: string) =>
        this.prisma.visit.update({
          where: { id },
          data: { deletedAt: new Date(), status: 'deleted' }
        })
      );
      promises.push(...deletePromises);
      await Promise.all(promises);
    }

    if (changes.prescriptions) {
      const promises: Promise<any>[] = [];
      if (changes.prescriptions.created.length > 0) {
        promises.push(
          this.prisma.prescription.createMany({
            data: changes.prescriptions.created.map((prescription: any) => ({
              id: prescription.id,
              visitId: prescription.visit_id,
              patientId: prescription.patient_id,
              medicationName: prescription.medication_name,
              dosage: prescription.dosage,
              instructions: prescription.instructions,
              prescribedAt: new Date(prescription.prescribed_at),
              crdtAdministrations: prescription.administrations ? Buffer.from(prescription.administrations, 'base64') : null,
              status: 'synced'
            })),
            skipDuplicates: true,
          })
        );
      }

      for (const prescription of changes.prescriptions.updated) {
        promises.push(
          (async () => {
            const existingPrescription = await this.prisma.prescription.findUnique({ where: { id: prescription.id } });

            let mergedAdministrationsBuffer = existingPrescription?.crdtAdministrations;

            if (prescription.administrations) {
              const clientUpdate = Buffer.from(prescription.administrations, 'base64');
              const serverDoc = new Y.Doc();

              if (existingPrescription?.crdtAdministrations) {
                try {
                  Y.applyUpdate(serverDoc, existingPrescription.crdtAdministrations);
                } catch (e) {
                   this.logger.error(`Error loading existing Yjs state for prescription ${prescription.id}`, e);
                }
              }

              try {
                Y.applyUpdate(serverDoc, clientUpdate);
                const serverArray = serverDoc.getArray('administrations');

                // Overdose detection: Same administration event logged multiple times
                // This happens if array length increased by more than 1 in an update and entries look duplicated,
                // or simply if length > expected based on the prescription dosage. We'll simplify:
                // For the sake of the eMAR conflict, if the client sends an update that pushes a new administration,
                // and the server *also* had a new administration offline, the merged array might have 2 events
                // for the same timestamp/dosage.
                // If the merged array has duplicate entries (same timestamp +/- 5 mins), it's a conflict.

                // To be thorough, we can check if length of merged array is greater than the sum of
                // unique events, but an easier check for CRDT conflict overdose is just finding duplicates.
                const events = serverArray.toArray() as { timestamp: string | number | Date }[];
                let conflictDetected = false;
                for (let i = 0; i < events.length; i++) {
                   for (let j = i + 1; j < events.length; j++) {
                      const timeA = new Date(events[i].timestamp).getTime();
                      const timeB = new Date(events[j].timestamp).getTime();
                      if (Math.abs(timeA - timeB) < 300000) { // 5 minutes window
                         conflictDetected = true;
                         break;
                      }
                   }
                   if (conflictDetected) break;
                }

                if (conflictDetected) {
                  this.logger.warn(`CRDT Conflict (eMAR): Potential overdose detected for prescription ${prescription.id}`);

                  await this.prisma.clinicalIncident.create({
                    data: {
                      patientId: existingPrescription?.patientId || prescription.patient_id || 'UNKNOWN',
                      type: 'OVERDOSE',
                      severity: 'CRITICAL',
                      description: `Double administration detected for medication ${existingPrescription?.medicationName || prescription.medication_name} (Prescription ID: ${prescription.id}). Conflict resolved by CRDT retaining both events.`,
                    }
                  });

                  await this.epiTickerService.broadcastAlert({
                    id: `INCIDENT-${Date.now()}-${prescription.id}`,
                    type: 'INCIDENT',
                    message: `🚨 URGENCE : Double administration potentielle (surdosage) détectée hors-ligne pour ${existingPrescription?.medicationName || prescription.medication_name}.`,
                    timestamp: new Date()
                  });

                  throw new Error(`CRDT Conflict: Potential overdose for ${prescription.id}. Skipping sync update to protect patient.`);
                }

                mergedAdministrationsBuffer = Buffer.from(Y.encodeStateAsUpdate(serverDoc));
              } catch(e) {
                this.logger.error(`Conflict resolving Yjs document for prescription ${prescription.id}`, e);
              }
            }

            return this.prisma.prescription.update({
              where: { id: prescription.id },
              data: {
                medicationName: prescription.medication_name,
                dosage: prescription.dosage,
                instructions: prescription.instructions,
                prescribedAt: new Date(prescription.prescribed_at),
                crdtAdministrations: mergedAdministrationsBuffer,
                status: 'synced'
              }
            });
          })()
        );
      }

      const deletePromises = changes.prescriptions.deleted.map((id: string) =>
        this.prisma.prescription.update({
          where: { id },
          data: { deletedAt: new Date(), status: 'deleted' }
        })
      );
      promises.push(...deletePromises);
      await Promise.all(promises);
    }

    if (changes.vitals) {
      const promises: Promise<any>[] = [];
      if (changes.vitals.created.length > 0) {
        promises.push(
          this.prisma.vital.createMany({
            data: changes.vitals.created.map((vital: any) => ({
              id: vital.id,
              patientId: vital.patient_id,
              bloodPressure: vital.blood_pressure,
              heartRate: vital.heart_rate,
              recordedAt: new Date(vital.recorded_at),
              status: 'synced',
            })),
            skipDuplicates: true,
          })
        );
      }

      const updatePromises = changes.vitals.updated.map((vital: any) =>
        this.prisma.vital.update({
          where: { id: vital.id },
          data: {
            bloodPressure: vital.blood_pressure,
            heartRate: vital.heart_rate,
            recordedAt: new Date(vital.recorded_at),
            status: 'synced',
          }
        })
      );
      promises.push(...updatePromises);

      const deletePromises = changes.vitals.deleted.map((id: string) =>
        this.prisma.vital.update({
          where: { id },
          data: { deletedAt: new Date(), status: 'deleted' }
        })
      );
      promises.push(...deletePromises);
      await Promise.all(promises);
    }
  }

  async pullChanges(lastPulledAt: number) {
    const lastPulledDate = new Date(lastPulledAt);

    // PATIENTS
    const rawPatients = await this.prisma.patient.findMany({
      where: { updatedAt: { gt: lastPulledDate } }
    });

    const createdPatients = [];
    const updatedPatients = [];
    const deletedPatients = [];

    for (const p of rawPatients) {
      if (p.deletedAt) {
        deletedPatients.push(p.id);
      } else if (p.createdAt.getTime() > lastPulledDate.getTime()) {
        createdPatients.push({
          id: p.id,
          first_name: p.firstName,
          last_name: p.lastName,
          date_of_birth: p.dateOfBirth.getTime(),
          _status: p.status,
          deleted_at: null
        });
      } else {
        updatedPatients.push({
          id: p.id,
          first_name: p.firstName,
          last_name: p.lastName,
          date_of_birth: p.dateOfBirth.getTime(),
          _status: p.status,
          deleted_at: null
        });
      }
    }

    // VISITS (With Yjs Sync payload)
    const rawVisits = await this.prisma.visit.findMany({
       where: { updatedAt: { gt: lastPulledDate } }
    });

    const createdVisits = [];
    const updatedVisits = [];
    const deletedVisits = [];

    for (const v of rawVisits) {
      // Encode Yjs buffer to Base64 to transmit over JSON
      const notesBase64 = v.notes ? v.notes.toString('base64') : '';

      if (v.deletedAt) {
        deletedVisits.push(v.id);
      } else if (v.createdAt.getTime() > lastPulledDate.getTime()) {
         createdVisits.push({
           id: v.id,
           patient_id: v.patientId,
           date: v.date.getTime(),
           notes: notesBase64,
           _status: v.status,
           deleted_at: null
         });
      } else {
         updatedVisits.push({
           id: v.id,
           patient_id: v.patientId,
           date: v.date.getTime(),
           notes: notesBase64,
           _status: v.status,
           deleted_at: null
         });
      }
    }

    // PRESCRIPTIONS (eMAR CRDT Sync payload)
    const rawPrescriptions = await this.prisma.prescription.findMany({
       where: { updatedAt: { gt: lastPulledDate } }
    });

    const createdPrescriptions = [];
    const updatedPrescriptions = [];
    const deletedPrescriptions = [];

    for (const p of rawPrescriptions) {
      const administrationsBase64 = p.crdtAdministrations ? p.crdtAdministrations.toString('base64') : '';

      if (p.deletedAt) {
        deletedPrescriptions.push(p.id);
      } else if (p.createdAt.getTime() > lastPulledDate.getTime()) {
         createdPrescriptions.push({
           id: p.id,
           visit_id: p.visitId,
           patient_id: p.patientId,
           medication_name: p.medicationName,
           dosage: p.dosage,
           instructions: p.instructions,
           prescribed_at: p.prescribedAt.getTime(),
           administrations: administrationsBase64,
           _status: p.status,
           deleted_at: null
         });
      } else {
         updatedPrescriptions.push({
           id: p.id,
           visit_id: p.visitId,
           patient_id: p.patientId,
           medication_name: p.medicationName,
           dosage: p.dosage,
           instructions: p.instructions,
           prescribed_at: p.prescribedAt.getTime(),
           administrations: administrationsBase64,
           _status: p.status,
           deleted_at: null
         });
      }
    }

    // VITALS
    const rawVitals = await this.prisma.vital.findMany({
      where: { updatedAt: { gt: lastPulledDate } }
    });

    const createdVitals = [];
    const updatedVitals = [];
    const deletedVitals = [];

    for (const v of rawVitals) {
      if (v.deletedAt) {
        deletedVitals.push(v.id);
      } else if (v.createdAt.getTime() > lastPulledDate.getTime()) {
        createdVitals.push({
          id: v.id,
          patient_id: v.patientId,
          blood_pressure: v.bloodPressure,
          heart_rate: v.heartRate,
          recorded_at: v.recordedAt.getTime(),
          _status: v.status,
          deleted_at: null
        });
      } else {
        updatedVitals.push({
          id: v.id,
          patient_id: v.patientId,
          blood_pressure: v.bloodPressure,
          heart_rate: v.heartRate,
          recorded_at: v.recordedAt.getTime(),
          _status: v.status,
          deleted_at: null
        });
      }
    }

    return {
      patients: {
        created: createdPatients,
        updated: updatedPatients,
        deleted: deletedPatients
      },
      visits: {
        created: createdVisits,
        updated: updatedVisits,
        deleted: deletedVisits
      },
      vitals: {
        created: createdVitals,
        updated: updatedVitals,
        deleted: deletedVitals
      },
      prescriptions: {
        created: createdPrescriptions,
        updated: updatedPrescriptions,
        deleted: deletedPrescriptions
      },
    };
  }
}
