import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalRecordService } from '../clinical-record/clinical-record.service';
import { z } from 'zod';
import {
  FhirMapper,
  FhirBundleSchema,
  FhirBundle,
  FhirPatientSchema,
  FhirPatient,
  FhirObservationSchema,
  FhirObservation
} from './fhir.mapper';

@Injectable()
export class FhirService {
  private readonly logger = new Logger(FhirService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clinicalRecordService: ClinicalRecordService,
    private readonly fhirMapper: FhirMapper
  ) { }

  /**
   * MOTEUR D'EXPORTATION HL7 FHIR R4 (Droit à la Portabilité DPDPA/RGPD)
   */
  async exportPatientToFhir(patientId: string): Promise<FhirBundle> {
    this.logger.log(`[FHIR Export] Extraction complète du dossier patient: ${patientId}`);

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

    if (patient.vitals.length === 0) {
      this.logger.warn(`[FHIR] Échec de l'export: Le patient ${patientId} n'a aucune constante vitale enregistrée.`);
      throw new UnprocessableEntityException("Dossier incomplet : Impossible de générer un Bundle FHIR pour un patient sans aucune constante vitale (Vitals). Veuillez acquérir des données avant l'export.");
    }

    if (patient.visits.length === 0) {
      this.logger.warn(`[FHIR] Échec de l'export: Le patient ${patientId} n'a aucune visite/consultation.`);
      throw new UnprocessableEntityException("Dossier incomplet : Le patient ne possède aucun historique de consultation.");
    }

    const entries: z.infer<typeof FhirBundleSchema>['entry'] = [];

    // A. Mapper le Patient
    try {
      entries.push({
        fullUrl: `urn:uuid:${patient.id}`,
        resource: this.fhirMapper.toFhirPatient(patient)
      });
    } catch (parseError: unknown) {
      throw new UnprocessableEntityException("Données d'identité du patient corrompues.");
    }

    // B. Mapper les Constantes Vitales (Observations IoT/BLE)
    for (const vital of patient.vitals) {
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

      if (vital.glucose) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-glucose`,
          resource: this.fhirMapper.toFhirObservation(vital, 'glucose')
        });
      }
    }

    // C. Mapper les Prescriptions (MedicationRequest) et Encounter (Visites)
    for (const visit of patient.visits) {
      entries.push({
        fullUrl: `urn:uuid:${visit.id}`,
        resource: this.fhirMapper.toFhirEncounter(visit)
      });
      for (const prescription of visit.prescriptions) {
        entries.push({
          fullUrl: `urn:uuid:${prescription.id}`,
          resource: this.fhirMapper.toFhirMedicationRequest({
            ...prescription,
            instructions: prescription.instructions || undefined
          })
        });
      }
    }

    // D. Mapper les Dossiers Cliniques Dynamiques (MongoDB -> FHIR Observations)
    for (const record of mongoRecords) {
      const fhirRec = this.fhirMapper.toFhirClinicalRecord({
        ...record.toObject(),
        _id: record._id.toString()
      });
      if (fhirRec) {
        entries.push({
          fullUrl: `urn:uuid:${record._id}`,
          resource: fhirRec
        });
      }
    }

    const fhirBundle: FhirBundle = {
      resourceType: 'Bundle',
      type: 'document',
      entry: entries
    };

    // VALIDATION FINALE SÉCURISÉE (ZOD PARSING)
    const validationResult = FhirBundleSchema.safeParse(fhirBundle);

    if (!validationResult.success) {
      this.logger.error(`[FATAL FHIR ERROR] Le sérialiseur a généré un document invalide.`, validationResult.error.format());
      throw new UnprocessableEntityException("Impossible de générer un dossier médical légal : données patient incomplètes ou formatées de manière incorrecte.");
    }

    return validationResult.data;
  }

  /**
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
    const patientIdUuid = this.fhirMapper.extractIdFromReference(patientId);

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
      if (vital.glucose) {
        entries.push({
          fullUrl: `urn:uuid:${vital.id}-glucose`,
          resource: this.fhirMapper.toFhirObservation(vital, 'glucose')
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
      data: {
        ...dbVitalData,
        recordedAt: parsedData.effectiveDateTime ? new Date(parsedData.effectiveDateTime) : new Date()
      }
    });

    const code = parsedData.code?.coding?.[0]?.code;
    let type: 'temperature' | 'heartRate' | 'bloodPressure' | 'glucose' = 'temperature';
    if (code === '8867-4') type = 'heartRate';
    else if (code === '85354-9') type = 'bloodPressure';
    else if (code === '88365-2') type = 'glucose';

    return this.fhirMapper.toFhirObservation(createdVital, type);
  }

  /**
   * Portail Partenaire (Pharmacies locales)
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
        resource: this.fhirMapper.toFhirMedicationRequest(rx)
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
