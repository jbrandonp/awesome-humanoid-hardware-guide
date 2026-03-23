import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Y from 'yjs';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async pushChanges(changes: any) {
    if (changes.patients) {
      for (const patient of changes.patients.created) {
        await this.prisma.patient.create({
          data: {
            id: patient.id,
            firstName: patient.first_name,
            lastName: patient.last_name,
            dateOfBirth: new Date(patient.date_of_birth),
            status: 'synced',
          }
        });
      }
      for (const patient of changes.patients.updated) {
        await this.prisma.patient.update({
          where: { id: patient.id },
          data: {
            firstName: patient.first_name,
            lastName: patient.last_name,
            dateOfBirth: new Date(patient.date_of_birth),
            status: 'synced',
          }
        });
      }
      for (const id of changes.patients.deleted) {
        await this.prisma.patient.update({
          where: { id },
          data: { deletedAt: new Date(), status: 'deleted' }
        });
      }
    }

    if (changes.visits) {
      for (const visit of changes.visits.created) {
        // Base64 to Uint8Array for new note initialization
        const initialNoteBuffer = visit.notes ? Buffer.from(visit.notes, 'base64') : null;
        await this.prisma.visit.create({
          data: {
            id: visit.id,
            patientId: visit.patient_id,
            date: new Date(visit.date),
            notes: initialNoteBuffer,
            status: 'synced'
          }
        });
      }

      for (const visit of changes.visits.updated) {
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

        await this.prisma.visit.update({
          where: { id: visit.id },
          data: {
            date: new Date(visit.date),
            notes: mergedNotesBuffer,
            status: 'synced'
          }
        });
      }

      for (const id of changes.visits.deleted) {
        await this.prisma.visit.update({
          where: { id },
          data: { deletedAt: new Date(), status: 'deleted' }
        });
      }
    }
  }

  async pullChanges(lastPulledAt: number, limit: number = 500) {
    const lastPulledDate = new Date(lastPulledAt);

    // 1. Fetch up to `limit` records from each table individually
    const rawPatients = await this.prisma.patient.findMany({
      where: { updatedAt: { gt: lastPulledDate } },
      take: limit,
      orderBy: { updatedAt: 'asc' }
    });

    const rawVisits = await this.prisma.visit.findMany({
       where: { updatedAt: { gt: lastPulledDate } },
       take: limit,
       orderBy: { updatedAt: 'asc' }
    });

    // 2. Combine and sort globally by updatedAt ascending
    const combined = [
      ...rawPatients.map(p => ({ type: 'patient' as const, data: p, updatedAt: p.updatedAt.getTime() })),
      ...rawVisits.map(v => ({ type: 'visit' as const, data: v, updatedAt: v.updatedAt.getTime() }))
    ];

    combined.sort((a, b) => a.updatedAt - b.updatedAt);

    // 3. Slice to exactly `limit` records
    const sliced = combined.slice(0, limit);

    const createdPatients = [];
    const updatedPatients = [];
    const deletedPatients = [];

    const createdVisits = [];
    const updatedVisits = [];
    const deletedVisits = [];

    let highestTimestamp = lastPulledAt;

    for (const item of sliced) {
      if (item.updatedAt > highestTimestamp) {
        highestTimestamp = item.updatedAt;
      }

      if (item.type === 'patient') {
        const p = item.data;
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
      } else if (item.type === 'visit') {
        const v = item.data;
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
    }

    return {
      changes: {
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
      },
      timestamp: highestTimestamp
    };
  }
}
