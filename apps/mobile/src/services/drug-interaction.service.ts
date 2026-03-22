import interactions from '../data/drug_interactions.json';

export interface DrugInteraction {
  interactingDrug: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export class DrugInteractionChecker {
  /**
   * Vérifie si un nouveau médicament interagit avec la liste actuelle
   * des médicaments du panier (ou de l'historique du patient).
   */
  static checkInteractions(newMedicationName: string, currentMedications: string[]): DrugInteraction[] {
    const foundInteractions: DrugInteraction[] = [];

    // Vérifier les interactions où le nouveau médicament est la clé principale
    const interactionsMap: Record<string, any> = interactions;
    const newMedInteractions: DrugInteraction[] = interactionsMap[newMedicationName] || [];

    for (const med of currentMedications) {
      // 1. Sens : Nouveau -> Actuel
      const interaction1 = newMedInteractions.find(i => i.interactingDrug === med);
      if (interaction1 && interaction1.severity === 'high') {
        foundInteractions.push(interaction1);
      }

      // 2. Sens inverse : Actuel -> Nouveau
      const currentMedInteractions: DrugInteraction[] = interactionsMap[med] || [];
      const interaction2 = currentMedInteractions.find(i => i.interactingDrug === newMedicationName);
      if (interaction2 && interaction2.severity === 'high') {
         foundInteractions.push(interaction2);
      }
    }

    return foundInteractions;
  }
}
