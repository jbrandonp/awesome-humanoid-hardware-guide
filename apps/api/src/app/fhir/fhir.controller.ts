import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  UseFilters,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FhirService } from './fhir.service';
import { DpdpaConsentService } from '../audit/dpdpa-consent.service';
import { Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';
import type { FastifyReply } from 'fastify';
import { FhirValidationFilter } from './fhir-validation.filter';
import { SmartOnFhirGuard, FhirScopes } from './smart-on-fhir.guard';
import type { FhirPatient, FhirObservation, FhirBundle } from './fhir.mapper';

type AuthenticatedFastifyRequest = FastifyRequest & { user?: { userId: string } };

@Controller('fhir')
@UseFilters(FhirValidationFilter)
export class FhirController {
  constructor(
    private readonly fhirService: FhirService,
    private readonly consentManager: DpdpaConsentService,
  ) {}

  /**
   * Export complet (RGPD / DPDPA Portability)
   */
  @Get('patient/:id/export')
  @UseGuards(AuthGuard('jwt'), SmartOnFhirGuard)
  @FhirScopes('patient/Patient.read', 'patient/Observation.read')
  @AuditLog('FHIR_EXPORT_FULL_RECORD')
  async exportRecord(@Param('id') id: string): Promise<FhirBundle> {
    return this.fhirService.exportPatientToFhir(id);
  }

  /**
   * GET /fhir/Patient/:id
   */
  @Get('Patient/:id')
  @UseGuards(AuthGuard('jwt'), SmartOnFhirGuard)
  @FhirScopes('patient/Patient.read')
  async getPatient(@Param('id') id: string): Promise<FhirPatient> {
    return this.fhirService.getPatient(id);
  }

  /**
   * POST /fhir/Patient
   */
  @Post('Patient')
  @UseGuards(AuthGuard('jwt'), SmartOnFhirGuard)
  @FhirScopes('patient/Patient.write')
  async createPatient(@Body() fhirPayload: unknown): Promise<FhirPatient> {
    return this.fhirService.ingestPatient(fhirPayload);
  }

  /**
   * GET /fhir/Observation?subject=Patient/:id
   */
  @Get('Observation')
  @UseGuards(AuthGuard('jwt'), SmartOnFhirGuard)
  @FhirScopes('patient/Observation.read')
  async getObservations(
    @Query('subject') subject: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ): Promise<FhirBundle> {
    const skipVal = skip ? Number(skip) : 0;
    const takeVal = take ? Number(take) : 10;
    return this.fhirService.getObservations(subject, skipVal, takeVal);
  }

  /**
   * POST /fhir/Observation
   */
  @Post('Observation')
  @UseGuards(AuthGuard('jwt'), SmartOnFhirGuard)
  @FhirScopes('patient/Observation.write')
  async createObservation(@Body() fhirPayload: unknown): Promise<FhirObservation> {
    return this.fhirService.ingestObservation(fhirPayload);
  }

  /**
   * Portail Partenaire (Pharmacies locales)
   */
  @Get('pharmacy/:patientId/prescriptions')
  @UseGuards(AuthGuard('jwt'), SmartOnFhirGuard)
  @FhirScopes('patient/MedicationRequest.read')
  @AuditLog('FHIR_PHARMACY_ACCESS_PRESCRIPTIONS')
  async pharmacyAccess(
    @Param('patientId') patientId: string,
    @Req() req: AuthenticatedFastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<FastifyReply> {
    // Extraction du userId depuis le JWT validé
    const user = req.user;
    if (!user || !user.userId) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ error: 'Non authentifié' });
    }

    // 1. Vérification stricte du consentement DPDPA
    const hasConsent = await this.consentManager.checkConsent(
      user.userId,
      patientId,
    );

    if (!hasConsent) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .send({ error: 'Consentement patient requis ou expiré' });
    }

    // 2. Renvoie UNIQUEMENT les ordonnances
    const fhirPrescriptions =
      await this.fhirService.getActivePrescriptionsForPharmacy(patientId);
    return res.status(HttpStatus.OK).send(fhirPrescriptions);
  }
}
