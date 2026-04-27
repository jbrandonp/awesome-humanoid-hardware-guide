import { Model, Query, Relation } from '@nozbe/watermelondb';
export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';
export declare class Patient extends Model {
    static table: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    deletedAt: Date | null;
    visits: Query<Visit>;
    vitals: Query<Vital>;
    prescriptions: Query<Prescription>;
}
export declare class Visit extends Model {
    static table: string;
    patient: Relation<Patient>;
    date: Date;
    notes: string;
    deletedAt: Date | null;
    prescriptions: Query<Prescription>;
}
export declare class Vital extends Model {
    static table: string;
    patient: Relation<Patient>;
    bloodPressure: string | null;
    heartRate: number | null;
    temperature: number | null;
    glucose: number | null;
    recordedAt: Date;
    deletedAt: Date | null;
}
export declare class CatalogMedication extends Model {
    static table: string;
    name: string;
    defaultDosage: string | null;
    category: string;
}
export declare class DrugContraindication extends Model {
    static table: string;
    drugA: string;
    drugB: string;
    severity: string;
    description: string;
}
export declare class CatalogDiagnostic extends Model {
    static table: string;
    code: string;
    name: string;
}
export declare class Prescription extends Model {
    static table: string;
    visit: Relation<Visit>;
    patient: Relation<Patient>;
    medicationName: string;
    dosage: string;
    instructions: string | null;
    prescribedAt: Date;
    deletedAt: Date | null;
}
export declare class MedicationAdministration extends Model {
    static table: string;
    prescription: Relation<Prescription>;
    nurseId: string;
    status: string;
    dosageGiven: string;
    route: string;
    administeredAt: Date;
    isPrn: boolean;
    clinicalJustification: string | null;
    deletedAt: Date | null;
}
export declare class ClinicalIncident extends Model {
    static table: string;
    patientId: string;
    type: string;
    severity: string;
    description: string;
    metadata: string;
    createdAt: Date;
}
//# sourceMappingURL=databaseModels.d.ts.map