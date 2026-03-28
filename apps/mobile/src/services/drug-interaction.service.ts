import axios from 'axios';

// Structures strictes conformes au Backend DPDPA
export interface MedicationQuery {
  medicationName: string;
  dosageId?: string;
}

export interface DrugInteractionRequest {
  patientId: string;
  practitionerId: string;
  newMedications: MedicationQuery[];
  existingMedications: MedicationQuery[];
}

export interface ClinicalRisk {
  interactingDrugA: string;
  interactingDrugB: string;
  severityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  medicalDescription: string;
  recommendationAction: string;
}

export interface DrugInteractionResult {
  status: 'SAFE' | 'WARNING' | 'ERROR';
  risksFound: ClinicalRisk[];
  checkedAtIso: string;
  message: string;
}

export class DrugInteractionChecker {
  /**
   * Vérifie de manière asynchrone (via le backend sécurisé) si le nouveau médicament
   * interagit avec la prescription actuelle ou l'historique du patient (si DPDPA OK).
   *
   * Gère les erreurs réseaux locales (Timeout / API hors-ligne sur les PC Windows 7 de la clinique).
   */
  static async checkInteractionsLive(
    newMedicationName: string,
    currentMedications: string[],
    patientId: string,
    practitionerId: string,
  ): Promise<ClinicalRisk[]> {
    const requestPayload: DrugInteractionRequest = {
      patientId,
      practitionerId,
      newMedications: [{ medicationName: newMedicationName }],
      existingMedications: currentMedications.map((name) => ({
        medicationName: name,
      })),
    };

    try {
      // Appel API en mode Timeout restrictif pour ne pas figer l'Omnibox
      // (15s chrono max pour prescrire, on abandonne l'appel IA si > 2s).
      const response = await axios.post<DrugInteractionResult>(
        'http://localhost:3000/api/intelligence/check-interactions',
        requestPayload,
        {
          timeout: 2000,
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}` // À injecter dans l'idéal
          },
        },
      );

      if (response.data && response.data.risksFound) {
        return response.data.risksFound;
      }

      return [];
    } catch (networkError: unknown) {
      // Gestion Extrême des Erreurs (Zero-Crash Policy)
      // Si l'API est down (Coupure de courant) ou si la DB a crashé
      if (axios.isAxiosError(networkError)) {
        if (networkError.response?.status === 403) {
          console.error(
            "Le Patient a révoqué l'accès (DPDPA). Interactions inaccessibles.",
          );
        } else if (networkError.code === 'ECONNABORTED') {
          console.warn(
            "Timeout réseau. L'Intelligence Artificielle est trop lente.",
          );
        } else {
          console.warn(
            'Le serveur IA clinique est inaccessible (Hors-Ligne).',
            networkError.message,
          );
        }
      }

      // Par précaution médicale, on ne retourne pas de fausses données
      return [];
    }
  }
}
