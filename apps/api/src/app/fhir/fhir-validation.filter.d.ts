import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { z } from 'zod';
export declare class FhirValidationFilter implements ExceptionFilter {
    catch(exception: z.ZodError, host: ArgumentsHost): void;
}
//# sourceMappingURL=fhir-validation.filter.d.ts.map