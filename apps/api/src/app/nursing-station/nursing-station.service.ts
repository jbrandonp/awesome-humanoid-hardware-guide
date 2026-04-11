import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MedicationAdministration, MedicationAdministrationStatus } from '@prisma/client';
import { z } from 'zod';
import { medicationAdministrationSchema } from './dto/create-administration.dto';
import { HighAlertMedicationService } from '../high-alert-medication/high-alert-medication.service';
import { UnauthorizedException } from '@nestjs/common';

type CreateAdministrationInput = z.infer<typeof medicationAdministrationSchema>;

@Injectable()
export class NursingStationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly highAlertService: HighAlertMedicationService
  ) {}

  async createAdministration(data: CreateAdministrationInput): Promise<MedicationAdministration> {
    // 1. Fetch Prescription to identify the medication
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: data.prescriptionId },
      include: { patient: true }
    });

    if (!prescription) {
      throw new UnauthorizedException('Prescription non trouvée.');
    }

    // 2. High-Alert Medication Protocol Enforcement
    if (this.highAlertService.isHighAlert(prescription.medicationName)) {
      if (!data.secondaryNursePin && !data.secondaryNurseBadgeId) {
        throw new UnauthorizedException(
          `ALERTE SÉCURITÉ : La médication ${prescription.medicationName} est à HAUT RISQUE. Une double signature (Dual Sign-Off) est strictement obligatoire.`
        );
      }

      // Validate secondary sign-off
      await this.highAlertService.processDualSignOff({
        primaryUserId: data.nurseId,
        patientId: prescription.patientId,
        medicationName: prescription.medicationName,
        dosage: data.dosageGiven,
        secondaryPin: data.secondaryNursePin,
        secondaryBadgeId: data.secondaryNurseBadgeId,
        timestamp: new Date(data.administeredAt).toISOString()
      });
    }

    // 3. Persist Administration
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
