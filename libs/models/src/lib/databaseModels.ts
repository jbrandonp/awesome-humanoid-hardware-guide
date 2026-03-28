import { Model } from '@nozbe/watermelondb';
import {
  field,
  date,
  relation,
  children,
} from '@nozbe/watermelondb/decorators';

export class Patient extends Model {
  static override table = 'patients';

  @field('first_name') firstName!: string;
  @field('last_name') lastName!: string;
  @date('date_of_birth') dateOfBirth!: Date;
  @field('_status') status!: string;
  @date('deleted_at') deletedAt!: Date | null;

  @children('visits') visits!: any;
  @children('vitals') vitals!: any;
  @children('prescriptions') prescriptions!: any;
}

export class Visit extends Model {
  static override table = 'visits';

  @relation('patients', 'patient_id') patient!: any;
  @date('date') date!: Date;
  @field('notes') notes!: string; // Will store Yjs Document Updates (Base64)
  @field('_status') status!: string;
  @date('deleted_at') deletedAt!: Date | null;

  @children('prescriptions') prescriptions!: any;
}

export class Vital extends Model {
  static override table = 'vitals';

  @relation('patients', 'patient_id') patient!: any;
  @field('blood_pressure') bloodPressure!: string | null;
  @field('heart_rate') heartRate!: number | null;
  @field('temperature') temperature!: number | null;
  @field('glucose') glucose!: number | null;
  @date('recorded_at') recordedAt!: Date;
  @field('_status') status!: string;
  @date('deleted_at') deletedAt!: Date | null;
}

export class CatalogMedication extends Model {
  static override table = 'catalog_medications';

  @field('name') name!: string;
  @field('default_dosage') defaultDosage!: string | null;
  @field('category') category!: string;
}

export class CatalogDiagnostic extends Model {
  static override table = 'catalog_diagnostics';

  @field('code') code!: string;
  @field('name') name!: string;
}

export class Prescription extends Model {
  static override table = 'prescriptions';

  @relation('visits', 'visit_id') visit!: any;
  @relation('patients', 'patient_id') patient!: any;
  @field('medication_name') medicationName!: string;
  @field('dosage') dosage!: string;
  @field('instructions') instructions!: string | null;
  @date('prescribed_at') prescribedAt!: Date;
  @field('_status') status!: string;
  @date('deleted_at') deletedAt!: Date | null;
}
