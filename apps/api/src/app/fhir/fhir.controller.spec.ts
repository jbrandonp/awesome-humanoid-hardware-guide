import { Test, TestingModule } from '@nestjs/testing';
import { FhirController } from './fhir.controller';
import { FhirService } from './fhir.service';
import { DpdpaConsentService } from '../audit/dpdpa-consent.service';
import { HttpStatus } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';

describe('FhirController', () => {
  let controller: FhirController;
  let consentManager: jest.Mocked<DpdpaConsentService>;
  let fhirService: jest.Mocked<FhirService>;

  beforeEach(async () => {
    const consentManagerMock = {
      checkConsent: jest.fn(),
    };
    const fhirServiceMock = {
      getActivePrescriptionsForPharmacy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FhirController],
      providers: [
        { provide: DpdpaConsentService, useValue: consentManagerMock },
        { provide: FhirService, useValue: fhirServiceMock },
      ],
    }).compile();

    controller = module.get<FhirController>(FhirController);
    consentManager = module.get(DpdpaConsentService);
    fhirService = module.get(FhirService);
  });

  describe('pharmacyAccess', () => {
    it('should return 401 if user is not authenticated', async () => {
      const req = { user: undefined } as unknown as FastifyRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as FastifyReply;

      await controller.pharmacyAccess('patient-123', req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(res.send).toHaveBeenCalledWith({ error: 'Non authentifié' });
    });

    it('should return 403 if consent is not granted', async () => {
      const req = { user: { userId: 'pharmacist-123' } } as unknown as FastifyRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as FastifyReply;

      consentManager.checkConsent.mockResolvedValue(false);

      await controller.pharmacyAccess('patient-123', req, res);

      expect(consentManager.checkConsent).toHaveBeenCalledWith('pharmacist-123', 'patient-123');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(res.send).toHaveBeenCalledWith({ error: 'Consentement patient requis ou expiré' });
    });

    it('should return prescriptions if consent is granted', async () => {
      const req = { user: { userId: 'pharmacist-123' } } as unknown as FastifyRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as FastifyReply;

      const mockPrescriptions = [{ id: 'prescription-1' }];
      consentManager.checkConsent.mockResolvedValue(true);
      fhirService.getActivePrescriptionsForPharmacy.mockResolvedValue(mockPrescriptions as any);

      await controller.pharmacyAccess('patient-123', req, res);

      expect(consentManager.checkConsent).toHaveBeenCalledWith('pharmacist-123', 'patient-123');
      expect(fhirService.getActivePrescriptionsForPharmacy).toHaveBeenCalledWith('patient-123');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.send).toHaveBeenCalledWith(mockPrescriptions);
    });
  });
});
