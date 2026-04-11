import { Model, Query, Relation } from '@nozbe/watermelondb';
import {
  field,
  date,
  relation,
  children,
} from '@nozbe/watermelondb/decorators';

export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';

export class Patient extends Model {
  static override table = 'patients';

  @field('first_name') firstName!: string;
  @field('last_name') lastName!: string;
  @date('date_of_birth') dateOfBirth!: Date;
  @date('deleted_at') deletedAt!: Date | null;

  @children('visits') visits!: Query<Visit>;
  @children('vitals') vitals!: Query<Vital>;
  @children('prescriptions') prescriptions!: Query<Prescription>;
}

export class Visit extends Model {
  static override table = 'visits';

  @relation('patients', 'patient_id') patient!: Relation<Patient>;
  @date('date') date!: Date;
  @field('notes') notes!: string; // Will store Yjs Document Updates (Base64)
  @date('deleted_at') deletedAt!: Date | null;

  @children('prescriptions') prescriptions!: Query<Prescription>;
}

export class Vital extends Model {
  static override table = 'vitals';

  @relation('patients', 'patient_id') patient!: Relation<Patient>;
  @field('blood_pressure') bloodPressure!: string | null;
  @field('heart_rate') heartRate!: number | null;
  @field('temperature') temperature!: number | null;
  @field('glucose') glucose!: number | null;
  @date('recorded_at') recordedAt!: Date;
  @date('deleted_at') deletedAt!: Date | null;
}

export class CatalogMedication extends Model {
  static override table = 'catalog_medications';

  @field('name') name!: string;
  @field('default_dosage') defaultDosage!: string | null;
  @field('category') category!: string;
}

export class DrugContraindication extends Model {
  static override table = 'drug_contraindications';

  @field('drug_a') drugA!: string;
  @field('drug_b') drugB!: string;
  @field('severity') severity!: string;
  @field('description') description!: string;
}

export class CatalogDiagnostic extends Model {
  static override table = 'catalog_diagnostics';

  @field('code') code!: string;
  @field('name') name!: string;
}

export class Prescription extends Model {
  static override table = 'prescriptions';

  @relation('visits', 'visit_id') visit!: Relation<Visit>;
  @relation('patients', 'patient_id') patient!: Relation<Patient>;
  @field('medication_name') medicationName!: string;
  @field('dosage') dosage!: string;
  @field('instructions') instructions!: string | null;
  @date('prescribed_at') prescribedAt!: Date;
  @date('deleted_at') deletedAt!: Date | null;
}

export class MedicationAdministration extends Model {
  static override table = 'medication_administrations';

  @relation('prescriptions', 'prescription_id') prescription!: Relation<Prescription>;
  @field('nurse_id') nurseId!: string;
  @field('status') status!: string; // ADMINISTERED, REFUSED, OMITTED, PARTIAL
  @field('dosage_given') dosageGiven!: string;
  @field('route') route!: string;
  @date('administered_at') administeredAt!: Date;
  @field('is_prn') isPrn!: boolean;
  @field('clinical_justification') clinicalJustification!: string | null;
  @date('deleted_at') deletedAt!: Date | null;
}

export class ClinicalIncident extends Model {
  static override table = 'clinical_incidents';

  @field('patient_id') patientId!: string;
  @field('type') type!: string;
  @field('severity') severity!: string;
  @field('description') description!: string;
  @field('metadata') metadata!: string; // JSON String
  @date('created_at') createdAt!: Date;
}
