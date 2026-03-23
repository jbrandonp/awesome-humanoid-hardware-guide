import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Y from 'yjs';
import { z } from 'zod';

const PatientSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.union([z.number(), z.string()]).transform((val) => new Date(val)),
});

const VisitSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  date: z.union([z.number(), z.string()]).transform((val) => new Date(val)),
  notes: z.string().optional().nullable(),
});

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async pushChanges(changes: any, deviceId: string = 'unknown') {
    const failedIds: string[] = [];

    const recordError = async (recordId: string, model: string, payload: any, error: unknown) => {
      failedIds.push(recordId);
      await this.prisma.syncError.create({
        data: {
          deviceId,
          recordId,
          model,
          payload: payload,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        }
      });
    };

    if (changes.patients) {
      for (const patient of changes.patients.created || []) {
        try {
          const validPatient = PatientSchema.parse(patient);
          await this.prisma.patient.create({
            data: {
              id: validPatient.id,
              firstName: validPatient.first_name,
              lastName: validPatient.last_name,
              dateOfBirth: validPatient.date_of_birth,
              status: 'synced',
            }
          });
        } catch (error) {
          await recordError(patient.id, 'Patient.create', patient, error);
        }
      }
      for (const patient of changes.patients.updated || []) {
        try {
          const validPatient = PatientSchema.parse(patient);
          await this.prisma.patient.update({
            where: { id: validPatient.id },
            data: {
              firstName: validPatient.first_name,
              lastName: validPatient.last_name,
              dateOfBirth: validPatient.date_of_birth,
              status: 'synced',
            }
          });
        } catch (error) {
          await recordError(patient.id, 'Patient.update', patient, error);
        }
      }
      for (const id of changes.patients.deleted || []) {
        try {
          await this.prisma.patient.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'deleted' }
          });
        } catch (error) {
          await recordError(id, 'Patient.delete', { id }, error);
        }
      }
    }

    if (changes.visits) {
      for (const visit of changes.visits.created || []) {
        try {
          const validVisit = VisitSchema.parse(visit);
          // Base64 to Uint8Array for new note initialization
          const initialNoteBuffer = validVisit.notes ? Buffer.from(validVisit.notes, 'base64') : null;
          await this.prisma.visit.create({
            data: {
              id: validVisit.id,
              patientId: validVisit.patient_id,
              date: validVisit.date,
              notes: initialNoteBuffer,
              status: 'synced'
            }
          });
        } catch (error) {
          await recordError(visit.id, 'Visit.create', visit, error);
        }
      }

      for (const visit of changes.visits.updated || []) {
        try {
          const validVisit = VisitSchema.parse(visit);
          const existingVisit = await this.prisma.visit.findUnique({ where: { id: validVisit.id }});

          let mergedNotesBuffer = existingVisit?.notes;

          // CRDT Merge Logic for clinical notes using Yjs
          if (validVisit.notes) {
            const clientUpdate = Buffer.from(validVisit.notes, 'base64');
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
              console.error(`Conflict resolving Yjs document for visit ${validVisit.id}`, e);
            }
          }

          await this.prisma.visit.update({
            where: { id: validVisit.id },
            data: {
              date: validVisit.date,
              notes: mergedNotesBuffer,
              status: 'synced'
            }
          });
        } catch (error) {
          await recordError(visit.id, 'Visit.update', visit, error);
        }
      }

      for (const id of changes.visits.deleted || []) {
        try {
          await this.prisma.visit.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'deleted' }
          });
        } catch (error) {
          await recordError(id, 'Visit.delete', { id }, error);
        }
      }
    }

    return failedIds;
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
      vitals: { created: [], updated: [], deleted: [] },
      prescriptions: { created: [], updated: [], deleted: [] },
    };
  }
}
