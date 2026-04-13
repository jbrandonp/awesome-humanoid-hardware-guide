import { z } from 'zod';
export declare const AnnotationPayloadSchema: z.ZodObject<{
    imageId: z.ZodString;
    annotations: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export declare class SaveAnnotationDto {
    imageId: string;
    annotations: Record<string, unknown>;
}
//# sourceMappingURL=annotation.dto.d.ts.map