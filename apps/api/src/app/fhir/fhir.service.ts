import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FhirService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export the complete patient file to HL7 FHIR (JSON) standard (R4)
   * Facilitates the Right to Portability (RGPD/DPDPA).
   */
  async exportPatientToFhir(patientId: string): Promise<any> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        visits: {
          include: { prescriptions: true }
        },
        vitals: true
      }
    });

    if (!patient) {
      throw new NotFoundException('Patient non trouvé');
    }

    const fhirBundle: any = {
      resourceType: 'Bundle',
      type: 'document',
      entry: []
    };

    // Patient Resource
    fhirBundle.entry.push({
      fullUrl: `urn:uuid:${patient.id}`,
      resource: {
        resourceType: 'Patient',
        id: patient.id,
        name: [
          {
            use: 'official',
            family: patient.lastName,
            given: [patient.firstName]
          }
        ],
        birthDate: patient.dateOfBirth.toISOString().split('T')[0]
      }
    });

    // Observation Resources (Vitals)
    for (const vital of patient.vitals) {
      fhirBundle.entry.push({
        fullUrl: `urn:uuid:${vital.id}`,
        resource: {
          resourceType: 'Observation',
          id: vital.id,
          status: 'final',
          subject: { reference: `urn:uuid:${patient.id}` },
          effectiveDateTime: vital.recordedAt.toISOString(),
          component: [
             // simplified for brevity
             {
                code: { text: "Blood Pressure" },
                valueString: vital.bloodPressure
             },
             {
               code: { text: "Heart Rate" },
               valueQuantity: { value: vital.heartRate, unit: "bpm" }
             }
          ]
        }
      });
    }

    // MedicationRequest Resources (Prescriptions)
    for (const visit of patient.visits) {
      for (const prescription of visit.prescriptions) {
        fhirBundle.entry.push({
          fullUrl: `urn:uuid:${prescription.id}`,
          resource: {
            resourceType: 'MedicationRequest',
            id: prescription.id,
            status: 'active',
            intent: 'order',
            medicationCodeableConcept: { text: prescription.medicationName },
            subject: { reference: `urn:uuid:${patient.id}` },
            authoredOn: prescription.prescribedAt.toISOString(),
            dosageInstruction: [
              { text: prescription.dosage },
              { text: prescription.instructions || '' }
            ]
          }
        });
      }
    }

    return fhirBundle;
  }

  /**
   * For the Partner Portal (Pharmacies):
   * Return ONLY active prescriptions using FHIR format
   */
  async getActivePrescriptionsForPharmacy(patientId: string): Promise<any> {
    const activePrescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId: patientId,
        status: 'synced', // simplified for "active"
        deletedAt: null
      }
    });

    const fhirBundle: any = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: []
    };

    for (const rx of activePrescriptions) {
       fhirBundle.entry.push({
          fullUrl: `urn:uuid:${rx.id}`,
          resource: {
            resourceType: 'MedicationRequest',
            id: rx.id,
            status: 'active',
            intent: 'order',
            medicationCodeableConcept: { text: rx.medicationName },
            subject: { reference: `Patient/${rx.patientId}` },
            authoredOn: rx.prescribedAt.toISOString(),
            dosageInstruction: [
              { text: rx.dosage },
              { text: rx.instructions || '' }
            ]
          }
       });
    }

    return fhirBundle;
  }
}
