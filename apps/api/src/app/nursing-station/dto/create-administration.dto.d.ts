import { z } from 'zod';
export declare const medicationAdministrationSchema: z.ZodObject<{
    prescriptionId: z.ZodString;
    nurseId: z.ZodString;
    status: z.ZodEnum<{
        ADMINISTERED: "ADMINISTERED";
        REFUSED: "REFUSED";
        OMITTED: "OMITTED";
        PARTIAL: "PARTIAL";
    }>;
    dosageGiven: z.ZodString;
    route: z.ZodString;
    administeredAt: z.ZodString;
    isPrn: z.ZodDefault<z.ZodBoolean>;
    clinicalJustification: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    secondaryNursePin: z.ZodOptional<z.ZodString>;
    secondaryNurseBadgeId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateAdministrationDto = z.infer<typeof medicationAdministrationSchema>;
//# sourceMappingURL=create-administration.dto.d.ts.map