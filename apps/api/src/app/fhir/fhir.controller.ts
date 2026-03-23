import { Controller, Get, Param, UseGuards, Res, HttpStatus, Query, Req, ForbiddenException } from '@nestjs/common';
import { FhirService } from './fhir.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';
import { FastifyReply } from 'fastify';

@Controller('fhir')
export class FhirController {
  constructor(private readonly fhirService: FhirService) {}

  /**
   * Export complet (RGPD / DPDPA Portability)
   * Le flux ZIP sécurisé est renvoyé afin de réduire l'utilisation de la RAM
   */
  @Get('patient/:id/export')
  @UseGuards(AuthGuard('jwt'))
  @AuditLog('FHIR_EXPORT_FULL_RECORD')
  async exportRecord(
    @Param('id') id: string,
    @Res() res: FastifyReply,
    @Req() req: any,
    @Query('password') password?: string
  ) {
    // Check authorization: only the patient themselves or an ADMIN can export
    const user = req.user;
    if (user.role !== 'ADMIN' && user.id !== id && user.patientId !== id) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à exporter ce dossier.");
    }

    const archive = await this.fhirService.exportPatientToZipStream(id, password);

    // Fastify stream headers
    res.header('Content-Type', 'application/zip');
    res.header('Content-Disposition', `attachment; filename="patient-${id}-export.zip"`);

    // Stream directly back to the client
    return res.send(archive);
  }

  /**
   * Portail Partenaire (Pharmacies locales scannant un QR Code)
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
