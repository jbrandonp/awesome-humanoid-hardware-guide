import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async pushChanges(changes: any) {
    const transactionOps: any[] = [];

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
          }),
        );
      }
      if (changes.patients.updated.length > 0) {
        await this.prisma.$transaction(
          changes.patients.updated.map((patient: any) =>
            this.prisma.patient.update({
              where: { id: patient.id },
              data: {
                firstName: patient.first_name,
                lastName: patient.last_name,
                dateOfBirth: new Date(patient.date_of_birth),
                status: 'synced',
              },
            }),
          ),
        );
      }
      if (changes.patients.deleted.length > 0) {
        promises.push(
          this.prisma.patient.updateMany({
            where: { id: { in: changes.patients.deleted } },
            data: { deletedAt: new Date(), status: 'deleted' },
          }),
        );
      }
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
              status: 'synced',
            })),
            skipDuplicates: true,
          }),
        );
      }
      if (changes.visits.updated.length > 0) {
        const updates = changes.visits.updated.map((visit: any) => {
          const mergedNotesBuffer = visit.notes
            ? Buffer.from(visit.notes, 'base64')
            : null;
          return this.prisma.visit.update({
            where: { id: visit.id },
            data: {
              date: new Date(visit.date),
              notes: mergedNotesBuffer,
              status: 'synced',
            },
          });
        });
        await this.prisma.$transaction(updates);
      }
      if (changes.visits.deleted.length > 0) {
        promises.push(
          this.prisma.visit.updateMany({
            where: { id: { in: changes.visits.deleted } },
            data: { deletedAt: new Date(), status: 'deleted' },
          }),
        );
      }
      await Promise.all(promises);
    }

    if (changes.prescriptions) {
      const promises: Promise<any>[] = [];
      if (changes.prescriptions.created.length > 0) {
        promises.push(
          this.prisma.prescription.createMany({
            data: changes.prescriptions.created.map((prescription: any) => ({
              id: prescription.id,
              patientId: prescription.patient_id,
              visitId: prescription.visit_id,
              medicationName: prescription.medication,
              dosage: prescription.dosage,
              instructions: prescription.instructions,
              prescribedAt: new Date(prescription.created_at),
              status: 'synced',
            })),
            skipDuplicates: true,
          }),
        );
      }
      if (changes.prescriptions.updated.length > 0) {
        await this.prisma.$transaction(
          changes.prescriptions.updated.map((prescription: any) =>
            this.prisma.prescription.update({
              where: { id: prescription.id },
              data: {
                medicationName: prescription.medication,
                dosage: prescription.dosage,
                instructions: prescription.instructions,
                status: 'synced',
              },
            }),
          ),
        );
      }
      if (changes.prescriptions.deleted.length > 0) {
        promises.push(
          this.prisma.prescription.updateMany({
            where: { id: { in: changes.prescriptions.deleted } },
            data: { deletedAt: new Date(), status: 'deleted' },
          }),
        );
      }
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
          }),
        );
      }
      if (changes.vitals.updated.length > 0) {
        await this.prisma.$transaction(
          changes.vitals.updated.map((vital: any) =>
            this.prisma.vital.update({
              where: { id: vital.id },
              data: {
                bloodPressure: vital.blood_pressure,
                heartRate: vital.heart_rate,
                recordedAt: new Date(vital.recorded_at),
                status: 'synced',
              },
            }),
          ),
        );
      }
      if (changes.vitals.deleted.length > 0) {
        promises.push(
          this.prisma.vital.updateMany({
            where: { id: { in: changes.vitals.deleted } },
            data: { deletedAt: new Date(), status: 'deleted' },
          }),
        );
      }
      await Promise.all(promises);
    }

    if (transactionOps.length > 0) {
      await this.prisma.$transaction(transactionOps);
    }
  }

  async pullChanges(lastPulledAt: number) {
    const lastPulledDate = new Date(lastPulledAt);

    // PATIENTS
    const rawPatients = await this.prisma.patient.findMany({
      where: { updatedAt: { gt: lastPulledDate } },
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
          deleted_at: null,
        });
      } else {
        updatedPatients.push({
          id: p.id,
          first_name: p.firstName,
          last_name: p.lastName,
          date_of_birth: p.dateOfBirth.getTime(),
          _status: p.status,
          deleted_at: null,
        });
      }
    }

    // VISITS (With Yjs Sync payload)
    const rawVisits = await this.prisma.visit.findMany({
      where: { updatedAt: { gt: lastPulledDate } },
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
          deleted_at: null,
        });
      } else {
        updatedVisits.push({
          id: v.id,
          patient_id: v.patientId,
          date: v.date.getTime(),
          notes: notesBase64,
          _status: v.status,
          deleted_at: null,
        });
      }
    }

    // PRESCRIPTIONS (eMAR CRDT Sync payload)
    const rawPrescriptions = await this.prisma.prescription.findMany({
      where: { updatedAt: { gt: lastPulledDate } },
    });

    const createdPrescriptions = [];
    const updatedPrescriptions = [];
    const deletedPrescriptions = [];

    for (const p of rawPrescriptions) {
      const administrationsBase64 = p.crdtAdministrations
        ? p.crdtAdministrations.toString('base64')
        : '';

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
          deleted_at: null,
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
          deleted_at: null,
        });
      }
    }

    // VITALS
    const rawVitals = await this.prisma.vital.findMany({
      where: { updatedAt: { gt: lastPulledDate } },
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
          deleted_at: null,
        });
      } else {
        updatedVitals.push({
          id: v.id,
          patient_id: v.patientId,
          blood_pressure: v.bloodPressure,
          heart_rate: v.heartRate,
          recorded_at: v.recordedAt.getTime(),
          _status: v.status,
          deleted_at: null,
        });
      }
    }

    return {
      patients: {
        created: createdPatients,
        updated: updatedPatients,
        deleted: deletedPatients,
      },
      visits: {
        created: createdVisits,
        updated: updatedVisits,
        deleted: deletedVisits,
      },
      vitals: {
        created: createdVitals,
        updated: updatedVitals,
        deleted: deletedVitals,
      },
      prescriptions: {
        created: createdPrescriptions,
        updated: updatedPrescriptions,
        deleted: deletedPrescriptions,
      },
    };
  }
}
