import { z } from 'zod';
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

export const DrugInteractionCheckSchema = z.object({
  patientId: z.string().uuid(),
  practitionerId: z.string().uuid(),
  newMedications: z.array(z.string().min(1)).min(1),
});

export const DrugInteractionOverrideSchema = DrugInteractionCheckSchema.extend({
  justification: z.string().min(10, 'La justification clinique doit faire au moins 10 caractères.'),
});

export type DrugInteractionCheckDto = z.infer<typeof DrugInteractionCheckSchema>;
export type DrugInteractionOverrideDto = z.infer<typeof DrugInteractionOverrideSchema>;

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodSchema<any>) {}

  transform(value: any, metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error: any) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: error.errors,
      });
    }
  }
}
