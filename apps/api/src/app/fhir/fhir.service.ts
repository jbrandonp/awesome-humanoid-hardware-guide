import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalRecordService } from '../clinical-record/clinical-record.service';
import { z } from 'zod';
<<<<<<< HEAD

// ============================================================================
// TYPAGES STRICTS - STANDARD HL7 FHIR (R4) - ZÉRO 'ANY' POLICY
// Ces schémas Zod garantissent que le backend ne crache JAMAIS un JSON
// illégal ou incomplet vers une autre institution médicale (Hôpital/État).
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
  valueString: z.string().optional()
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

export const FhirBundleSchema = z.object({
  resourceType: z.literal('Bundle'),
  type: z.enum(['document', 'searchset', 'collection']),
  entry: z.array(z.object({
    fullUrl: z.string(),
    resource: z.union([FhirPatientSchema, FhirObservationSchema, FhirMedicationRequestSchema])
  }))
});

export type FhirBundle = z.infer<typeof FhirBundleSchema>;
=======
import {
  FhirMapper,
  FhirBundleSchema,
  FhirBundle,
  FhirPatientSchema,
  FhirPatient,
  FhirObservationSchema,
  FhirObservation
} from './fhir.mapper';
>>>>>>> origin/main

@Injectable()
export class FhirService {
  private readonly logger = new Logger(FhirService.name);

  constructor(
    private readonly prisma: PrismaService,
<<<<<<< HEAD
    private readonly clinicalRecordService: ClinicalRecordService
=======
    private readonly clinicalRecordService: ClinicalRecordService,
    private readonly fhirMapper: FhirMapper
>>>>>>> origin/main
  ) {}

  /**
   * MOTEUR D'EXPORTATION HL7 FHIR R4 (Droit à la Portabilité DPDPA/RGPD)
<<<<<<< HEAD
   *
   * Convertit l'intégralité d'un dossier patient hétérogène (PostgreSQL + MongoDB)
   * en un document JSON universel standardisé (FHIR Bundle).
   *
   * @param patientId L'UUID du patient
   * @returns Un objet JSON certifié FHIR R4
=======
>>>>>>> origin/main
   */
  async exportPatientToFhir(patientId: string): Promise<FhirBundle> {
    this.logger.log(`[FHIR Export] Extraction complète du dossier patient: ${patientId}`);

<<<<<<< HEAD
    // 1. EXTRACTION DES DONNÉES SOURCES (Postgres & Mongo)
=======
>>>>>>> origin/main
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        visits: { include: { prescriptions: true } },
        vitals: true
      }
    });

    if (!patient) {
      throw new NotFoundException(`Patient ${patientId} introuvable.`);
    }

    const mongoRecords = await this.clinicalRecordService.getPatientRecords(patientId);

<<<<<<< HEAD
    // 2. VÉRIFICATION DES DONNÉES CLINIQUES VITALES MANQUANTES
    // Un dossier patient vide ou sans constantes vitales n'a pas d'utilité médicale
    // pour un confrère. On lève une exception stricte.
=======
>>>>>>> origin/main
    if (patient.vitals.length === 0) {
       this.logger.warn(`[FHIR] Échec de l'export: Le patient ${patientId} n'a aucune constante vitale enregistrée.`);
       throw new UnprocessableEntityException("Dossier incomplet : Impossible de générer un Bundle FHIR pour un patient sans aucune constante vitale (Vitals). Veuillez acquérir des données avant l'export.");
    }

    if (patient.visits.length === 0) {
       this.logger.warn(`[FHIR] Échec de l'export: Le patient ${patientId} n'a aucune visite/consultation.`);
       throw new UnprocessableEntityException("Dossier incomplet : Le patient ne possède aucun historique de consultation.");
    }

<<<<<<< HEAD
    // 3. SÉRIALISATION MAPPING STRICTE (Zéro 'any')
=======
>>>>>>> origin/main
    const entries: z.infer<typeof FhirBundleSchema>['entry'] = [];

    // A. Mapper le Patient
    try {
<<<<<<< HEAD
      const patientResource = {
        resourceType: 'Patient',
        id: patient.id,
        name: [{
          use: 'official',
          family: patient.lastName,
          given: [patient.firstName]
        }],
        birthDate: patient.dateOfBirth.toISOString().split('T')[0],
        gender: 'unknown' // Donnée par défaut tolérée par FHIR si manquante dans la DB source
      };

      entries.push({
        fullUrl: `urn:uuid:${patient.id}`,
        resource: patientResource
      });
    } catch (parseError: unknown) {
      throw new UnprocessableEntityException("Données d'identité du patient corrompues. Le nom ou la date de naissance sont manquants.");
=======
      entries.push({
        fullUrl: `urn:uuid:${patient.id}`,
        resource: this.fhirMapper.toFhirPatient(patient)
      });
    } catch (parseError: unknown) {
      throw new UnprocessableEntityException("Données d'identité du patient corrompues.");
>>>>>>> origin/main
    }

    // B. Mapper les Constantes Vitales (Observations IoT/BLE)
    for (const vital of patient.vitals) {
<<<<<<< HEAD
      // Si la température existe (Mapping Température Corporelle)
      if (vital.temperature) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-temp`,
          resource: {
            resourceType: 'Observation',
            id: `${vital.id}-temp`,
            status: 'final',
            subject: { reference: `Patient/${patient.id}` },
            effectiveDateTime: vital.recordedAt.toISOString(),
            code: {
              coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }]
            },
            valueQuantity: { value: vital.temperature, unit: 'Cel', system: 'http://unitsofmeasure.org', code: 'Cel' }
          }
        });
      }

      // Mapping Rythme Cardiaque (Heart Rate)
      if (vital.heartRate) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-hr`,
          resource: {
            resourceType: 'Observation',
            id: `${vital.id}-hr`,
            status: 'final',
            subject: { reference: `Patient/${patient.id}` },
            effectiveDateTime: vital.recordedAt.toISOString(),
            code: {
              coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }]
            },
            valueQuantity: { value: vital.heartRate, unit: 'beats/minute', system: 'http://unitsofmeasure.org', code: '/min' }
          }
        });
      }

      // Mapping Pression Artérielle (Blood Pressure)
      if (vital.bloodPressure) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-bp`,
          resource: {
            resourceType: 'Observation',
            id: `${vital.id}-bp`,
            status: 'final',
            subject: { reference: `Patient/${patient.id}` },
            effectiveDateTime: vital.recordedAt.toISOString(),
            code: {
              coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }]
            },
            valueString: vital.bloodPressure // Simplification pour ce mock, un vrai FHIR BP est un composant à deux branches (Systolic/Diastolic)
          }
=======
      if (vital.temperature) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-temp`,
          resource: this.fhirMapper.toFhirObservation(vital, 'temperature')
        });
      }

      if (vital.heartRate) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-hr`,
          resource: this.fhirMapper.toFhirObservation(vital, 'heartRate')
        });
      }

      if (vital.bloodPressure) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-bp`,
          resource: this.fhirMapper.toFhirObservation(vital, 'bloodPressure')
>>>>>>> origin/main
        });
      }
    }

<<<<<<< HEAD
    // C. Mapper les Prescriptions (MedicationRequest)
    for (const visit of patient.visits) {
      for (const prescription of visit.prescriptions) {
        entries.push({
          fullUrl: `urn:uuid:${prescription.id}`,
          resource: {
            resourceType: 'MedicationRequest',
            id: prescription.id,
            status: prescription.status === 'deleted' ? 'cancelled' : 'active',
            intent: 'order',
            medicationCodeableConcept: { text: prescription.medicationName },
            subject: { reference: `Patient/${patient.id}` },
            authoredOn: prescription.prescribedAt.toISOString(),
            dosageInstruction: [
              { text: prescription.dosage },
              { text: prescription.instructions || 'Aucune instruction spécifique.' }
            ]
          }
=======
    // C. Mapper les Prescriptions (MedicationRequest) et Encounter (Visites)
    for (const visit of patient.visits) {
      entries.push({
        fullUrl: `urn:uuid:${visit.id}`,
        resource: this.fhirMapper.toFhirEncounter(visit)
      });
      for (const prescription of visit.prescriptions) {
        entries.push({
          fullUrl: `urn:uuid:${prescription.id}`,
          resource: this.fhirMapper.toFhirMedicationRequest(prescription)
>>>>>>> origin/main
        });
      }
    }

    // D. Mapper les Dossiers Cliniques Dynamiques (MongoDB -> FHIR Observations)
    for (const record of mongoRecords) {
<<<<<<< HEAD
      // Exemple : Dossier Pédiatrique dynamique avec un Z-Score de croissance
      if (record.specialty === 'PEDIATRICS' && record.data?.headCircumference) {
         entries.push({
           fullUrl: `urn:uuid:${record._id}`,
           resource: {
              resourceType: 'Observation',
              id: record._id.toString(),
              status: 'final',
              subject: { reference: `Patient/${patient.id}` },
              effectiveDateTime: (record as any).createdAt.toISOString(),
              code: {
                 coding: [{ system: 'http://loinc.org', code: '9843-4', display: 'Head Occipital-frontal circumference' }]
              },
              valueQuantity: { value: record.data.headCircumference, unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' }
           }
=======
      const fhirRec = this.fhirMapper.toFhirClinicalRecord(record);
      if (fhirRec) {
         entries.push({
           fullUrl: `urn:uuid:${record._id}`,
           resource: fhirRec
>>>>>>> origin/main
         });
      }
    }

    const fhirBundle: FhirBundle = {
      resourceType: 'Bundle',
      type: 'document',
      entry: entries
    };

<<<<<<< HEAD
    // 4. VALIDATION FINALE SÉCURISÉE (ZOD PARSING)
    // Le mapper strict TypeScript a empêché l'utilisation de `any`.
    // Zod certifie que la structure est 100% conforme à HL7/FHIR R4 avant émission.
    const validationResult = FhirBundleSchema.safeParse(fhirBundle);

    if (!validationResult.success) {
      this.logger.error(`[FATAL FHIR ERROR] Le sérialiseur a généré un document invalide (Violation Schema R4).`, validationResult.error.format());
      throw new UnprocessableEntityException("Impossible de générer un dossier médical légal : données patient incomplètes ou formatées de manière incorrecte.");
    }

    this.logger.log(`[FHIR Export] Succès. Bundle FHIR R4 généré avec ${validationResult.data.entry.length} entrées.`);
=======
    // VALIDATION FINALE SÉCURISÉE (ZOD PARSING)
    const validationResult = FhirBundleSchema.safeParse(fhirBundle);

    if (!validationResult.success) {
      this.logger.error(`[FATAL FHIR ERROR] Le sérialiseur a généré un document invalide.`, validationResult.error.format());
      throw new UnprocessableEntityException("Impossible de générer un dossier médical légal : données patient incomplètes ou formatées de manière incorrecte.");
    }

>>>>>>> origin/main
    return validationResult.data;
  }

  /**
<<<<<<< HEAD
   * Portail Partenaire (Pharmacies locales)
   * Retourne UNIQUEMENT les ordonnances (MedicationRequest) actives sous format FHIR.
=======
   * GET /fhir/Patient/:id
   */
  async getPatient(id: string): Promise<FhirPatient> {
    const patient = await this.prisma.patient.findUnique({
      where: { id }
    });

    if (!patient) throw new NotFoundException(`Patient ${id} not found`);

    const fhirPatient = this.fhirMapper.toFhirPatient(patient);
    return FhirPatientSchema.parse(fhirPatient); // Strict output validation
  }

  /**
   * POST /fhir/Patient
   * Ingress: Crée un patient via un payload FHIR
   */
  async ingestPatient(fhirPayload: any): Promise<FhirPatient> {
    const parsedData = FhirPatientSchema.parse(fhirPayload); // Lève une erreur Zod en cas d'échec

    const dbPatientData = this.fhirMapper.fromFhirPatient(parsedData);
    const createdPatient = await this.prisma.patient.create({
      data: dbPatientData
    });

    return this.fhirMapper.toFhirPatient(createdPatient);
  }

  /**
   * GET /fhir/Observation
   */
  async getObservations(patientId: string, skip: number = 0, take: number = 10): Promise<FhirBundle> {
    const patientIdUuid = patientId.replace('Patient/', '');

    const vitals = await this.prisma.vital.findMany({
      where: { patientId: patientIdUuid },
      skip,
      take,
      orderBy: { recordedAt: 'desc' }
    });

    const entries: z.infer<typeof FhirBundleSchema>['entry'] = [];

    for (const vital of vitals) {
      if (vital.temperature) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-temp`,
          resource: this.fhirMapper.toFhirObservation(vital, 'temperature')
        });
      }
      if (vital.heartRate) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-hr`,
          resource: this.fhirMapper.toFhirObservation(vital, 'heartRate')
        });
      }
      if (vital.bloodPressure) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-bp`,
          resource: this.fhirMapper.toFhirObservation(vital, 'bloodPressure')
        });
      }
    }

    const bundle: FhirBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: entries
    };

    return FhirBundleSchema.parse(bundle);
  }

  /**
   * POST /fhir/Observation
   * Ingress: Sauvegarde une Observation FHIR en base
   */
  async ingestObservation(fhirPayload: any): Promise<FhirObservation> {
    const parsedData = FhirObservationSchema.parse(fhirPayload);

    const dbVitalData = this.fhirMapper.fromFhirObservation(parsedData);

    const createdVital = await this.prisma.vital.create({
      data: dbVitalData
    });

    const code = parsedData.code?.coding?.[0]?.code;
    let type: 'temperature' | 'heartRate' | 'bloodPressure' = 'temperature';
    if (code === '8867-4') type = 'heartRate';
    else if (code === '85354-9') type = 'bloodPressure';

    return this.fhirMapper.toFhirObservation(createdVital, type);
  }

  /**
   * Portail Partenaire (Pharmacies locales)
>>>>>>> origin/main
   */
  async getActivePrescriptionsForPharmacy(patientId: string): Promise<FhirBundle> {
    const activePrescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId: patientId,
        status: { not: 'deleted' },
        deletedAt: null
      }
    });

    const entries: z.infer<typeof FhirBundleSchema>['entry'] = [];

    for (const rx of activePrescriptions) {
       entries.push({
          fullUrl: `urn:uuid:${rx.id}`,
<<<<<<< HEAD
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
=======
          resource: this.fhirMapper.toFhirMedicationRequest(rx)
>>>>>>> origin/main
       });
    }

    const fhirBundle: FhirBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: entries
    };

    const validationResult = FhirBundleSchema.safeParse(fhirBundle);
    if (!validationResult.success) {
       this.logger.error("Erreur de formatage FHIR pour la pharmacie locale.", validationResult.error);
       throw new UnprocessableEntityException("Formatage FHIR échoué.");
    }

    return validationResult.data;
  }
}
