import { Injectable } from '@nestjs/common';
import { z } from 'zod';

// ============================================================================
// TYPAGES STRICTS - STANDARD HL7 FHIR (R4) - ZÉRO 'ANY' POLICY
// ============================================================================

export const FhirPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string().uuid(),
  name: z.array(z.object({
    use: z.string(),
    family: z.string().min(1, 'Le nom de famille est obligatoire en FHIR'),
    given: z.array(z.string())
  })).min(1, 'Au moins un nom complet est requis'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance non conforme (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional()
});

export const FhirObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string().uuid(),
  status: z.enum(['registered', 'preliminary', 'final', 'amended']),
  subject: z.object({ reference: z.string() }),
  effectiveDateTime: z.string().datetime(),
  code: z.object({
    coding: z.array(z.object({
      system: z.string(), // ex: http://loinc.org
      code: z.string(),
      display: z.string()
    }))
  }),
  valueQuantity: z.object({
    value: z.number(),
    unit: z.string(),
    system: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  valueString: z.string().optional(),
  component: z.array(z.object({
    code: z.object({
      coding: z.array(z.object({
        system: z.string(),
        code: z.string(),
        display: z.string()
      }))
    }),
    valueQuantity: z.object({
      value: z.number(),
      unit: z.string(),
      system: z.string().optional(),
      code: z.string().optional()
    })
  })).optional()
});

export const FhirMedicationRequestSchema = z.object({
  resourceType: z.literal('MedicationRequest'),
  id: z.string().uuid(),
  status: z.enum(['active', 'on-hold', 'cancelled', 'completed']),
  intent: z.literal('order'),
  medicationCodeableConcept: z.object({ text: z.string() }),
  subject: z.object({ reference: z.string() }),
  authoredOn: z.string().datetime(),
  dosageInstruction: z.array(z.object({ text: z.string() }))
});

export const FhirEncounterSchema = z.object({
  resourceType: z.literal('Encounter'),
  id: z.string().uuid(),
  status: z.enum(['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled']),
  class: z.object({
    system: z.string(),
    code: z.string(),
    display: z.string()
  }),
  subject: z.object({ reference: z.string() }),
  period: z.object({ start: z.string().datetime(), end: z.string().datetime().optional() })
});

export const FhirOperationOutcomeSchema = z.object({
  resourceType: z.literal('OperationOutcome'),
  issue: z.array(z.object({
    severity: z.enum(['fatal', 'error', 'warning', 'information']),
    code: z.enum(['invalid', 'structure', 'required', 'value', 'exception']),
    details: z.object({ text: z.string() }).optional(),
    diagnostics: z.string().optional(),
    expression: z.array(z.string()).optional()
  }))
});

export const FhirBundleSchema = z.object({
  resourceType: z.literal('Bundle'),
  type: z.enum(['document', 'searchset', 'collection']),
  entry: z.array(z.object({
    fullUrl: z.string(),
    resource: z.union([
      FhirPatientSchema,
      FhirObservationSchema,
      FhirMedicationRequestSchema,
      FhirEncounterSchema,
      FhirOperationOutcomeSchema
    ])
  }))
});

export type FhirPatient = z.infer<typeof FhirPatientSchema>;
export type FhirObservation = z.infer<typeof FhirObservationSchema>;
export type FhirMedicationRequest = z.infer<typeof FhirMedicationRequestSchema>;
export type FhirEncounter = z.infer<typeof FhirEncounterSchema>;
export type FhirOperationOutcome = z.infer<typeof FhirOperationOutcomeSchema>;
export type FhirBundle = z.infer<typeof FhirBundleSchema>;

@Injectable()
export class FhirMapper {
  // --- EGRESS (Internal -> FHIR) ---

  toFhirPatient(patient: any): FhirPatient {
    return {
      resourceType: 'Patient',
      id: patient.id,
      name: [{
        use: 'official',
        family: patient.lastName,
        given: [patient.firstName]
      }],
      birthDate: patient.dateOfBirth instanceof Date
        ? patient.dateOfBirth.toISOString().split('T')[0]
        : patient.dateOfBirth.split('T')[0],
      gender: 'unknown' as const
    };
  }

  toFhirObservation(vital: any, type: 'temperature' | 'heartRate' | 'bloodPressure'): FhirObservation {
    const base: any = {
      resourceType: 'Observation',
      status: 'final',
      subject: { reference: `Patient/${vital.patientId}` },
      effectiveDateTime: vital.recordedAt ? vital.recordedAt.toISOString() : new Date().toISOString()
    };

    if (type === 'temperature') {
      base.id = `${vital.id}-temp` || "temp-id";
      base.code = { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }] };
      base.valueQuantity = { value: vital.temperature, unit: 'Cel', system: 'http://unitsofmeasure.org', code: 'Cel' };
    } else if (type === 'heartRate') {
      base.id = `${vital.id}-hr`;
      base.code = { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] };
      base.valueQuantity = { value: vital.heartRate, unit: 'beats/minute', system: 'http://unitsofmeasure.org', code: '/min' };
    } else if (type === 'bloodPressure') {
      base.id = `${vital.id}-bp`;
      base.code = { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] };

      // Parse "120/80"
      if (vital.bloodPressure && vital.bloodPressure.includes('/')) {
        const [sys, dia] = vital.bloodPressure.split('/');
        base.component = [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
            valueQuantity: { value: parseFloat(sys), unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
            valueQuantity: { value: parseFloat(dia), unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
          }
        ];
      } else {
        base.valueString = vital.bloodPressure;
      }
    }

    return base as FhirObservation;
  }

  toFhirClinicalRecord(record: any): FhirObservation | null {
    // 1. Example 1: PEDIATRICS mapping to LOINC
    if (record.specialty === 'PEDIATRICS' && record.data?.headCircumference) {
      return {
        resourceType: 'Observation',
        id: record._id ? record._id.toString() : 'temp-id',
        status: 'final',
        subject: { reference: `Patient/${record.patientId}` },
        effectiveDateTime: record.createdAt ? record.createdAt.toISOString() : new Date().toISOString(),
        code: {
          coding: [{ system: 'http://loinc.org', code: '9843-4', display: 'Head Occipital-frontal circumference' }]
        },
        valueQuantity: { value: record.data.headCircumference, unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' }
      };
    }

    // 2. Example 2: DERMATOLOGY mapping to SNOMED CT and ICD-10 for a skin lesion/macule
    if (record.specialty === 'DERMATOLOGY' && record.data?.lesionType === 'macule') {
      return {
        resourceType: 'Observation',
        id: record._id ? record._id.toString() : 'temp-id',
        status: 'final',
        subject: { reference: `Patient/${record.patientId}` },
        effectiveDateTime: record.createdAt ? record.createdAt.toISOString() : new Date().toISOString(),
        code: {
          coding: [
            { system: 'http://snomed.info/sct', code: '400041002', display: 'Macule (finding)' },
            { system: 'http://hl7.org/fhir/sid/icd-10', code: 'L09.9', display: 'Infection of skin and subcutaneous tissue, unspecified' }
          ]
        },
        valueString: `Location: ${record.data?.location || 'Unknown'}`
      };
    }

    // Generic fallback for other specialties (e.g. GYNECOLOGY) mapping a generic clinical finding
    if (record.data?.diagnosisCode) {
       return {
         resourceType: 'Observation',
         id: record._id ? record._id.toString() : 'temp-id',
         status: 'final',
         subject: { reference: `Patient/${record.patientId}` },
         effectiveDateTime: record.createdAt ? record.createdAt.toISOString() : new Date().toISOString(),
         code: {
           coding: [
             { system: 'http://hl7.org/fhir/sid/icd-10', code: record.data.diagnosisCode, display: record.data.diagnosisDisplay || 'Diagnosis' }
           ]
         },
         valueString: record.data.notes || 'No notes provided'
       };
    }

    return null;
  }

  toFhirMedicationRequest(prescription: any): FhirMedicationRequest {
    return {
      resourceType: 'MedicationRequest',
      id: prescription.id,
      status: prescription.status === 'deleted' ? 'cancelled' : 'active',
      intent: 'order',
      medicationCodeableConcept: { text: prescription.medicationName },
      subject: { reference: `Patient/${prescription.patientId}` },
      authoredOn: prescription.prescribedAt ? prescription.prescribedAt.toISOString() : new Date().toISOString(),
      dosageInstruction: [
        { text: prescription.dosage },
        { text: prescription.instructions || 'Aucune instruction spécifique.' }
      ]
    };
  }

  toFhirEncounter(visit: any): FhirEncounter {
    return {
      resourceType: 'Encounter',
      id: visit.id,
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory'
      },
      subject: { reference: `Patient/${visit.patientId}` },
      period: { start: visit.date ? visit.date.toISOString() : visit.createdAt.toISOString() }
    };
  }

  // --- INGRESS (FHIR -> Internal) ---

  fromFhirPatient(fhirPatient: FhirPatient): any {
    const lastName = fhirPatient.name?.[0]?.family || 'Unknown';
    const firstName = fhirPatient.name?.[0]?.given?.[0] || 'Unknown';
    const dateOfBirth = fhirPatient.birthDate ? new Date(fhirPatient.birthDate) : new Date();

    return {
      firstName,
      lastName,
      dateOfBirth,
      status: 'created'
    };
  }

  fromFhirObservation(fhirObservation: FhirObservation): any {
    const patientIdParts = fhirObservation.subject.reference.split('/');
    const patientId = patientIdParts[patientIdParts.length - 1];

    // Simplistic mapping for vital signs
    const code = fhirObservation.code?.coding?.[0]?.code;
    const value = fhirObservation.valueQuantity?.value;

    let updateData: any = { patientId };

    if (code === '8310-5') {
      updateData.temperature = value;
    } else if (code === '8867-4') {
      updateData.heartRate = value;
    } else if (code === '85354-9' && fhirObservation.component) {
      const sysComp = fhirObservation.component.find(c => c.code.coding[0].code === '8480-6');
      const diaComp = fhirObservation.component.find(c => c.code.coding[0].code === '8462-4');
      if (sysComp && diaComp) {
        updateData.bloodPressure = `${sysComp.valueQuantity.value}/${diaComp.valueQuantity.value}`;
      }
    }

    return updateData;
  }
}
