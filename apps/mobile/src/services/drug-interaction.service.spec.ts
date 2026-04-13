import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import {
  DrugInteractionChecker,
  ClinicalRisk,
} from './drug-interaction.service';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('DrugInteractionChecker', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  const defaultPatientId = 'patient-123';
  const defaultPractitionerId = 'practitioner-456';
  const newMedicationName = 'Aspirin';
  const currentMedications = ['Ibuprofen', 'Paracetamol'];

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('checkInteractionsLive', () => {
    describe('Happy path', () => {
      it('should return found clinical risks when API call is successful', async () => {
        const mockRisks: ClinicalRisk[] = [
          {
            interactingDrugA: 'Aspirin',
            interactingDrugB: 'Ibuprofen',
            severityLevel: 'MODERATE',
            medicalDescription: 'Increased risk of bleeding.',
            recommendationAction: 'Monitor patient closely.',
          },
        ];

        mockedAxios.post.mockResolvedValueOnce({
          data: {
            status: 'WARNING',
            risksFound: mockRisks,
            checkedAtIso: new Date().toISOString(),
            message: 'Interactions detected',
          },
        });

        const result = await DrugInteractionChecker.checkInteractionsLive(
          newMedicationName,
          currentMedications,
          defaultPatientId,
          defaultPractitionerId,
        );

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(mockedAxios.post).toHaveBeenCalledWith(
           expect.stringContaining('/intelligence/check-interactions'),
          {
            patientId: defaultPatientId,
            practitionerId: defaultPractitionerId,
            newMedications: [{ medicationName: newMedicationName }],
            existingMedications: [
              { medicationName: 'Ibuprofen' },
              { medicationName: 'Paracetamol' },
            ],
          },
          expect.objectContaining({
            timeout: 2000,
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        );

        expect(result).toEqual(mockRisks);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should return an empty array if API returns successful response but no risksFound array', async () => {
        mockedAxios.post.mockResolvedValueOnce({
          data: {
            status: 'SAFE',
            checkedAtIso: new Date().toISOString(),
            message: 'No interactions detected',
          },
        });

        const result = await DrugInteractionChecker.checkInteractionsLive(
          newMedicationName,
          currentMedications,
          defaultPatientId,
          defaultPractitionerId,
        );

        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect(result).toEqual([]);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });

    describe('Error handling (Zero-Crash Policy)', () => {
      it('should return empty array and log error on 403 Forbidden (DPDPA Revoked)', async () => {
        const error = new AxiosError('Forbidden');
        error.response = { status: 403 } as any;
        error.isAxiosError = true;

        mockedAxios.isAxiosError.mockReturnValueOnce(true);
        mockedAxios.post.mockRejectedValueOnce(error);

        const result = await DrugInteractionChecker.checkInteractionsLive(
          newMedicationName,
          currentMedications,
          defaultPatientId,
          defaultPractitionerId,
        );

        expect(result).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Le Patient a révoqué l'accès (DPDPA). Interactions inaccessibles.",
        );
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should return empty array and log warning on ECONNABORTED (Timeout)', async () => {
        // Crée l'erreur de manière à ce que l'instance ait bien la propriété code définie
        const error = new AxiosError('timeout of 2000ms exceeded', 'ECONNABORTED');
        error.isAxiosError = true;
        error.code = 'ECONNABORTED'; // Force le code

        mockedAxios.isAxiosError.mockReturnValueOnce(true);
        mockedAxios.post.mockRejectedValueOnce(error);

        const result = await DrugInteractionChecker.checkInteractionsLive(
          newMedicationName,
          currentMedications,
          defaultPatientId,
          defaultPractitionerId,
        );

        expect(result).toEqual([]);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "Timeout réseau. L'Intelligence Artificielle est trop lente.",
        );
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });

      it('should return empty array and log warning on generic Axios error (Offline/Server Down)', async () => {
        // S'assure que le message est bien défini dans l'objet d'erreur
        const error = new AxiosError('Network Error');
        error.isAxiosError = true;
        error.message = 'Network Error'; // Force le message

        mockedAxios.isAxiosError.mockReturnValueOnce(true);
        mockedAxios.post.mockRejectedValueOnce(error);

        const result = await DrugInteractionChecker.checkInteractionsLive(
          newMedicationName,
          currentMedications,
          defaultPatientId,
          defaultPractitionerId,
        );

        expect(result).toEqual([]);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Le serveur IA clinique est inaccessible (Hors-Ligne).',
          'Network Error',
        );
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });

      it('should return empty array and not log specific Axios errors if non-Axios error is thrown', async () => {
        const error = new Error('Some unexpected internal parsing error');

        mockedAxios.isAxiosError.mockReturnValueOnce(false);
        mockedAxios.post.mockRejectedValueOnce(error);

        const result = await DrugInteractionChecker.checkInteractionsLive(
          newMedicationName,
          currentMedications,
          defaultPatientId,
          defaultPractitionerId,
        );

        expect(result).toEqual([]);
        // Non-Axios errors silently return empty array based on current implementation
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });
  });
});
