import { Controller, Get, Post, Param, Query, Body, UseGuards, UseFilters, Res, HttpStatus } from '@nestjs/common';
import { FhirService } from './fhir.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';
import { FastifyReply } from 'fastify';
import { FhirValidationFilter } from './fhir-validation.filter';
import { SmartOnFhirGuard, FhirScopes } from './smart-on-fhir.guard';

@Controller('fhir')
@UseFilters(FhirValidationFilter)
export class FhirController {
  constructor(private readonly fhirService: FhirService) {}

  /**
   * Export complet (RGPD / DPDPA Portability)
   */
  @Get('patient/:id/export')
  @UseGuards(AuthGuard('jwt'), SmartOnFhirGuard)
  @FhirScopes('patient/Patient.read', 'patient/Observation.read')
  @AuditLog('FHIR_EXPORT_FULL_RECORD')
  async exportRecord(@Param('id') id: string) {
    return this.fhirService.exportPatientToFhir(id);
  }

  /**
   * GET /fhir/Patient/:id
   */
  @Get('Patient/:id')
  @UseGuards(AuthGuard('jwt'), SmartOnFhirGuard)
  @FhirScopes('patient/Patient.read')
  async getPatient(@Param('id') id: string) {
    return this.fhirService.getPatient(id);
  }

  /**
   * POST /fhir/Patient
   */
  @Post('Patient')
  @UseGuards(AuthGuard('jwt'), SmartOnFhirGuard)
  @FhirScopes('patient/Patient.write')
  async createPatient(@Body() fhirPayload: any) {
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
    @Query('take') take?: number
  ) {
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
  async createObservation(@Body() fhirPayload: any) {
    return this.fhirService.ingestObservation(fhirPayload);
  }

  /**
   * Portail Partenaire (Pharmacies locales)
   * Ce point de terminaison devrait idéalement être protégé par une API Key partenaire (`@UseGuards(PartnerKeyGuard)`)
   * ou un token d'usage unique encodé dans le QR.
   */
  @Get('pharmacy/:patientId/prescriptions')
  @AuditLog('FHIR_PHARMACY_ACCESS_PRESCRIPTIONS')
  async pharmacyAccess(
    @Param('patientId') patientId: string,
    @Res() res: FastifyReply
  ) {
    // 1. Simule la vérification du consentement via le partenaire (ex: via un token dans l'URL)
    const hasConsent = true;

    if (!hasConsent) {
      return res.status(HttpStatus.FORBIDDEN).send({ error: 'Consentement requis ou expiré' });
    }

    // 2. Renvoie UNIQUEMENT les ordonnances
    const fhirPrescriptions = await this.fhirService.getActivePrescriptionsForPharmacy(patientId);
    return res.status(HttpStatus.OK).send(fhirPrescriptions);
  }
}
