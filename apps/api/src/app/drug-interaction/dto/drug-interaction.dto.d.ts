import { z } from 'zod';
import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare const DrugInteractionCheckSchema: z.ZodObject<{
    patientId: z.ZodString;
    practitionerId: z.ZodString;
    newMedications: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const DrugInteractionOverrideSchema: z.ZodObject<{
    patientId: z.ZodString;
    practitionerId: z.ZodString;
    newMedications: z.ZodArray<z.ZodString>;
    justification: z.ZodString;
}, z.core.$strip>;
export type DrugInteractionCheckDto = z.infer<typeof DrugInteractionCheckSchema>;
export type DrugInteractionOverrideDto = z.infer<typeof DrugInteractionOverrideSchema>;
export declare class ZodValidationPipe implements PipeTransform {
    private schema;
    constructor(schema: z.ZodSchema<unknown>);
    transform(value: unknown, _metadata: ArgumentMetadata): unknown;
}
//# sourceMappingURL=drug-interaction.dto.d.ts.map