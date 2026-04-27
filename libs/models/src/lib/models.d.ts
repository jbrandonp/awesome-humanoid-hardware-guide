import { z } from 'zod';
export declare const PatientSchema: z.ZodObject<{
    id: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    dateOfBirth: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<string, string | Date>>;
    _status: z.ZodEnum<{
        synced: "synced";
        deleted: "deleted";
        created: "created";
        updated: "updated";
    }>;
    deleted_at: z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<string, string | Date>>>;
}, z.core.$strip>;
export type PatientDto = z.infer<typeof PatientSchema>;
export declare const VisitSchema: z.ZodObject<{
    id: z.ZodString;
    patientId: z.ZodString;
    date: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<string, string | Date>>;
    notes: z.ZodString;
    _status: z.ZodEnum<{
        synced: "synced";
        deleted: "deleted";
        created: "created";
        updated: "updated";
    }>;
    deleted_at: z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<string, string | Date>>>;
}, z.core.$strip>;
export type VisitDto = z.infer<typeof VisitSchema>;
export declare const VitalsSchema: z.ZodObject<{
    id: z.ZodString;
    patientId: z.ZodString;
    bloodPressure: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    heartRate: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    temperature: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    recordedAt: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<string, string | Date>>;
    _status: z.ZodEnum<{
        synced: "synced";
        deleted: "deleted";
        created: "created";
        updated: "updated";
    }>;
    deleted_at: z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<string, string | Date>>>;
}, z.core.$strip>;
export type VitalsDto = z.infer<typeof VitalsSchema>;
export declare const PrescriptionSchema: z.ZodObject<{
    id: z.ZodString;
    visitId: z.ZodString;
    patientId: z.ZodString;
    medicationName: z.ZodString;
    dosage: z.ZodString;
    instructions: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    prescribedAt: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<string, string | Date>>;
    _status: z.ZodEnum<{
        synced: "synced";
        deleted: "deleted";
        created: "created";
        updated: "updated";
    }>;
    deleted_at: z.ZodNullable<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<string, string | Date>>>;
}, z.core.$strip>;
export type PrescriptionDto = z.infer<typeof PrescriptionSchema>;
export declare const DualSignOffSchema: z.ZodObject<{
    primaryUserId: z.ZodString;
    secondaryPin: z.ZodOptional<z.ZodString>;
    secondaryBadgeId: z.ZodOptional<z.ZodString>;
    patientId: z.ZodString;
    medicationName: z.ZodString;
    dosage: z.ZodString;
    timestamp: z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>, z.ZodTransform<string, string | Date>>;
    offlineHash: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DualSignOffDto = z.infer<typeof DualSignOffSchema>;
//# sourceMappingURL=models.d.ts.map