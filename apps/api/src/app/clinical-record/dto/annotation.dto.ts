import { z } from 'zod';

export const AnnotationPayloadSchema = z.object({
  imageId: z.string(),
  annotations: z.record(z.string(), z.unknown()),
});

export class SaveAnnotationDto {
  imageId!: string;
  annotations!: Record<string, unknown>;
}
