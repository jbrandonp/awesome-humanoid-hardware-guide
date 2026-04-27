import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { z } from 'zod';
import { FhirOperationOutcome } from './fhir.mapper';

@Catch(z.ZodError)
export class FhirValidationFilter implements ExceptionFilter {
   catch(exception: z.ZodError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    // Prepare FHIR OperationOutcome based on ZodError issues
    const issues = exception.issues.map((err: z.ZodIssue) => ({
      severity: 'error' as const,
      code: 'invalid' as const,
      details: { text: err.message },
      expression: err.path.map(String)
    }));

    const outcome: FhirOperationOutcome = {
      resourceType: 'OperationOutcome',
      issue: issues
    };

    // Return the specific FHIR structure instead of standard 400 Bad Request
    response.status(HttpStatus.BAD_REQUEST).send(outcome);
  }
}
