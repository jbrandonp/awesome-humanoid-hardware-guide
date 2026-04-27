import { z } from 'zod';
export declare const TriageInputSchema: z.ZodObject<{
    age: z.ZodNumber;
    spO2: z.ZodNumber;
    heartRate: z.ZodNumber;
    temperature: z.ZodNumber;
    systolicBP: z.ZodNumber;
    diastolicBP: z.ZodNumber;
    painScale: z.ZodNumber;
    chiefComplaint: z.ZodString;
    estimatedResources: z.ZodNumber;
}, z.core.$strip>;
export type TriageInput = z.infer<typeof TriageInputSchema>;
export type TriageResult = {
    score: number;
};
//# sourceMappingURL=triage.schema.d.ts.map