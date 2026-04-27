import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MedicationAdministration, MedicationAdministrationStatus, Bed, BedStatus, Patient } from '@prisma/client';
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

  // Mock data for development
  private mockBeds: Bed[] = [
    {
      id: 'bed-1',
      roomNumber: '101A',
      bedType: 'STANDARD',
      status: 'OCCUPIED',
      currentPatientId: 'patient-1',
      features: ['OXYGEN', 'MONITOR'],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bed-2',
      roomNumber: '101B',
      bedType: 'GENERAL',
      status: 'AVAILABLE',
      currentPatientId: null,
      features: ['OXYGEN'],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bed-3',
      roomNumber: '102A',
      bedType: 'ICU',
      status: 'OCCUPIED',
      currentPatientId: 'patient-2',
      features: ['VENTILATOR', 'MONITOR', 'DEFIBRILLATOR'],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private mockPatients: Patient[] = [
    {
      id: 'patient-1',
      firstName: 'Jean',
      lastName: 'Dupont',
      dateOfBirth: new Date('1950-05-15'),
      phone: '+33123456789',
      otp: null,
      otpExpiresAt: null,
      zipCode: '75001',
      status: 'created',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'patient-2',
      firstName: 'Marie',
      lastName: 'Leroy',
      dateOfBirth: new Date('1965-08-22'),
      phone: '+33198765432',
      otp: null,
      otpExpiresAt: null,
      zipCode: '75002',
      status: 'created',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  async getBeds(): Promise<Bed[]> {
    // In real implementation, use this.prisma.bed.findMany()
    return this.mockBeds;
  }

  async getBed(id: string): Promise<Bed | null> {
    const bed = this.mockBeds.find(b => b.id === id);
    return bed || null;
  }

  async updateBedStatus(id: string, status: BedStatus): Promise<Bed> {
    const bedIndex = this.mockBeds.findIndex(b => b.id === id);
    if (bedIndex === -1) {
      throw new Error('Bed not found');
    }
    this.mockBeds[bedIndex] = {
      ...this.mockBeds[bedIndex],
      status,
      updatedAt: new Date(),
    };
    return this.mockBeds[bedIndex];
  }

  async getPatients(): Promise<Patient[]> {
    return this.mockPatients;
  }

  async getMedicationsDue(): Promise<any[]> {
    // Mock medications due for administration
    return [
      {
        id: 'med-1',
        patientName: 'Jean Dupont',
        medicationName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        route: 'ORAL',
        dueTime: new Date(Date.now() + 3600000), // 1 hour from now
        status: 'PENDING',
      },
      {
        id: 'med-2',
        patientName: 'Marie Leroy',
        medicationName: 'Insulin Glargine',
        dosage: '10 units',
        route: 'SUBCUTANEOUS',
        dueTime: new Date(Date.now() + 7200000), // 2 hours from now
        status: 'PENDING',
      },
    ];
  }
}
