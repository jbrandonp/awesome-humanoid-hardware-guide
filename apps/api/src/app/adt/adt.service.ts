import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { z } from 'zod';
import { Bed, BedEncounter, BedStatus, BedType } from '@prisma/client';

export const AdmissionSchema = z.object({
  patientId: z.string().uuid(),
  bedId: z.string().uuid(),
  patientAge: z.number().int().min(0),
  version: z.number().int().positive(),
});

export type AdmissionInput = z.infer<typeof AdmissionSchema>;

@Injectable()
export class AdtService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async admitPatient(input: AdmissionInput): Promise<{ bed: Bed; encounter: BedEncounter }> {
    const validatedData = AdmissionSchema.parse(input);

    const { patientId, bedId, patientAge, version } = validatedData;

    return await this.prisma.$transaction(async (tx) => {
      const bed = await tx.bed.findUnique({
        where: { id: bedId },
      });

      if (!bed) {
        throw new BadRequestException('Lit introuvable');
      }

      if (bed.status !== BedStatus.AVAILABLE) {
        throw new ConflictException('Le lit n\'est pas disponible');
      }

      if (bed.version !== version) {
        throw new ConflictException('Conflit de version de lit (Optimistic Locking)');
      }

      if (patientAge < 18 && bed.bedType !== BedType.PEDIATRIC) {
         // Verifier s'il y a des lits pediatrics disponibles
         const availablePediatricBeds = await tx.bed.count({
           where: { status: BedStatus.AVAILABLE, bedType: BedType.PEDIATRIC }
         });

         if (availablePediatricBeds > 0) {
            throw new BadRequestException('Un patient mineur doit prioritairement être affecté à un lit de type PEDIATRIC');
         }
      }

      const updatedBed = await tx.bed.update({
        where: { id: bedId, version: version },
        data: {
          status: BedStatus.OCCUPIED,
          currentPatientId: patientId,
          version: { increment: 1 },
        },
      });

      const encounter = await tx.bedEncounter.create({
        data: {
          patientId: patientId,
          bedId: bedId,
          admittedAt: new Date(),
        },
      });

      return { bed: updatedBed, encounter };
    });
  }

  async dischargePatient(patientId: string, bedId: string, dischargeReason: string): Promise<Bed> {
      return await this.prisma.$transaction(async (tx) => {
        const bed = await tx.bed.findUnique({ where: { id: bedId } });
        if (!bed || bed.currentPatientId !== patientId) {
            throw new BadRequestException('Patient ou lit introuvable');
        }

        const updatedBed = await tx.bed.update({
            where: { id: bedId },
            data: {
                status: BedStatus.CLEANING,
                currentPatientId: null,
                version: { increment: 1 }
            }
        });

        const encounter = await tx.bedEncounter.findFirst({
            where: { patientId, bedId, dischargedAt: null },
            orderBy: { admittedAt: 'desc' }
        });

        if (encounter) {
             await tx.bedEncounter.update({
                 where: { id: encounter.id },
                 data: { dischargedAt: new Date(), dischargeReason }
             });
        }

        this.eventEmitter.emit('bed.requires_cleaning', { bedId: updatedBed.id, roomNumber: updatedBed.roomNumber });

        return updatedBed;
      });
  }

  async markBedAsAvailable(bedId: string, version: number): Promise<Bed> {
       return await this.prisma.$transaction(async (tx) => {
           const bed = await tx.bed.findUnique({ where: { id: bedId }});

           if (!bed) {
               throw new BadRequestException('Lit introuvable');
           }

           if (bed.status !== BedStatus.CLEANING) {
               throw new BadRequestException('Un lit ne peut recevoir le statut DISPONIBLE que s\'il vient de passer par le statut NETTOYAGE');
           }

           if (bed.version !== version) {
               throw new ConflictException('Conflit de version');
           }

           return await tx.bed.update({
               where: { id: bedId, version: version },
               data: {
                   status: BedStatus.AVAILABLE,
                   version: { increment: 1 }
               }
           });
       });
  }

  async transferPatient(patientId: string, fromBedId: string, toBedId: string, fromBedVersion: number, toBedVersion: number): Promise<{ fromBed: Bed; toBed: Bed; encounter: BedEncounter }> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Verifications
      const fromBed = await tx.bed.findUnique({ where: { id: fromBedId } });
      const toBed = await tx.bed.findUnique({ where: { id: toBedId } });

      if (!fromBed || !toBed) {
        throw new BadRequestException('Lit introuvable');
      }

      if (fromBed.currentPatientId !== patientId) {
        throw new BadRequestException('Le patient n\'est pas dans le lit source');
      }

      if (toBed.status !== BedStatus.AVAILABLE) {
        throw new ConflictException('Le lit de destination n\'est pas disponible');
      }

      if (fromBed.version !== fromBedVersion || toBed.version !== toBedVersion) {
         throw new ConflictException('Conflit de version de lit');
      }

      // 2. Mettre à jour fromBed
      const updatedFromBed = await tx.bed.update({
        where: { id: fromBedId, version: fromBedVersion },
        data: {
          status: BedStatus.CLEANING,
          currentPatientId: null,
          version: { increment: 1 },
        },
      });

      // 3. Mettre à jour toBed
      const updatedToBed = await tx.bed.update({
        where: { id: toBedId, version: toBedVersion },
        data: {
          status: BedStatus.OCCUPIED,
          currentPatientId: patientId,
          version: { increment: 1 },
        },
      });

      // 4. Clore l'ancien encounter
      const currentEncounter = await tx.bedEncounter.findFirst({
        where: { patientId, bedId: fromBedId, dischargedAt: null },
        orderBy: { admittedAt: 'desc' }
      });

      if (currentEncounter) {
        await tx.bedEncounter.update({
          where: { id: currentEncounter.id },
          data: {
            dischargedAt: new Date(),
            dischargeReason: 'Transfert vers le lit ' + toBed.roomNumber,
          },
        });
      }

      // 5. Créer le nouvel encounter
      const newEncounter = await tx.bedEncounter.create({
        data: {
          patientId: patientId,
          bedId: toBedId,
          admittedAt: new Date(),
        },
      });

      // 6. Emettre l'evenement pour le nettoyage du fromBed
      this.eventEmitter.emit('bed.requires_cleaning', {
         bedId: updatedFromBed.id,
         roomNumber: updatedFromBed.roomNumber
      });

      return { fromBed: updatedFromBed, toBed: updatedToBed, encounter: newEncounter };
    });
  }
}
