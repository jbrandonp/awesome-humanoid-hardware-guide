import { Controller, Post, Body, Req, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConsentManagerService } from './consent-manager.service';
import { Request } from 'express';
import { z } from 'zod';

const RevokeConsentSchema = z.object({
  patientId: z.string().uuid(),
  userId: z.string().uuid().optional(),
});

@Controller('patient')
export class ConsentManagerController {
  private readonly logger = new Logger(ConsentManagerController.name);

  constructor(private readonly consentManagerService: ConsentManagerService) {}

  @Post('revoke-consent')
  async revokeConsent(@Body() body: any, @Req() req: Request) {
    try {
      const { patientId, userId } = RevokeConsentSchema.parse(body);
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      this.logger.log(`[ConsentManager] Requête de révocation reçue pour le patient ${patientId}`);

      const jobId = await this.consentManagerService.enqueueRevocationJob({
        patientId,
        userId,
        ipAddress,
      });

      return {
        status: 'ACCEPTED',
        message: 'La révocation de consentement a été prise en compte et est en cours de traitement asynchrone.',
        jobId,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException({ message: 'Validation failed', errors: error.errors }, HttpStatus.BAD_REQUEST);
      }
      this.logger.error('[ConsentManager] Error processing revoke consent request', error);
      throw new HttpException('Erreur serveur lors de la révocation.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
