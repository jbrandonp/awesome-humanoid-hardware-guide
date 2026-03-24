import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MedicationAdministrationStatus } from '@prisma/client';
import { z } from 'zod';
import { medicationAdministrationSchema } from './dto/create-administration.dto';

type CreateAdministrationInput = z.infer<typeof medicationAdministrationSchema>;

@Injectable()
export class NursingStationService {
  constructor(private readonly prisma: PrismaService) {}

  async createAdministration(data: CreateAdministrationInput) {
    return this.prisma.medicationAdministration.create({
      data: {
        prescriptionId: data.prescriptionId,
        nurseId: data.nurseId,
        status: data.status as MedicationAdministrationStatus,
        dosageGiven: data.dosageGiven,
        route: data.route,
        administeredAt: new Date(data.administeredAt),
        isPrn: data.isPrn,
        clinicalJustification: data.clinicalJustification,
      },
    });
  }
}
