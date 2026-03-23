// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY
// ============================================================================

export interface SemanticExtractionResult {
  molecule: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
}

export class SemanticParser {
  /**
   * Analyse sémantique d'un texte brut (Whisper) basé sur des expressions régulières
   * avancées et un système de règles pour extraire les informations de prescription.
   *
   * @param text Le texte brut issu de Whisper.cpp (ex: "Prescrire du paracétamol 500 milligrammes trois fois par jour pendant cinq jours")
   * @returns Un objet JSON structuré avec les données extraites
   */
  public static extractPrescriptionData(text: string): SemanticExtractionResult {
    const normalizedText = text.toLowerCase().replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ');

    const result: SemanticExtractionResult = {
      molecule: null,
      dosage: null,
      frequency: null,
      duration: null
    };

    // 1. Extraction de la Molécule
    // On cherche des mots clés après "prescrire (du|de la|des)? " ou "donner (du|de la|des)? "
    const moleculeRegex = /(?:prescrire|donner)\s+(?:du\s+|de\s+la\s+|des\s+|d')?([a-zà-ÿ0-9-]+)/i;
    const moleculeMatch = normalizedText.match(moleculeRegex);
    if (moleculeMatch && moleculeMatch[1]) {
      // Si la molécule est trouvée, on la met en majuscule
      result.molecule = moleculeMatch[1].charAt(0).toUpperCase() + moleculeMatch[1].slice(1);
    } else {
        // Fallback: Si pas de "prescrire", on cherche parmi une liste de molécules courantes
        const commonDrugs = ['paracetamol', 'paracétamol', 'amoxicilline', 'amoxicillin', 'artemether', 'lumefantrine', 'ibuprofène', 'ibuprofen'];
        for (const drug of commonDrugs) {
            if (normalizedText.includes(drug)) {
                result.molecule = drug.charAt(0).toUpperCase() + drug.slice(1);
                break;
            }
        }
    }

    // 2. Extraction du Dosage
    // Ex: "500 milligrammes", "500mg", "1 gramme", "1g", "1 g"
    const dosageRegex = /(\d+(?:[.,]\d+)?)\s*(milligrammes?|mg|grammes?|g|microgrammes?|µg|mcg|millilitres?|ml)\b/i;
    const dosageMatch = normalizedText.match(dosageRegex);
    if (dosageMatch) {
      let unit = dosageMatch[2].toLowerCase();
      // Normalisation de l'unité
      if (unit.startsWith('milligramme')) unit = 'mg';
      else if (unit.startsWith('gramme')) unit = 'g';
      else if (unit.startsWith('microgramme')) unit = 'µg';
      else if (unit.startsWith('millilitre')) unit = 'ml';

      result.dosage = `${dosageMatch[1]}${unit}`;
    }

    // 3. Extraction de la Fréquence
    // Ex: "trois fois par jour", "3 fois par jour", "1 fois/jour", "matin midi et soir"
    const frequencyRegex = /(un|une|deux|trois|quatre|cinq|six|\d+)\s+fois\s+par\s+jour|(\d+)\s+fois\/jour/i;
    const frequencyMatch = normalizedText.match(frequencyRegex);
    if (frequencyMatch) {
      const times = frequencyMatch[1] || frequencyMatch[2];
      let numTimes = times;
      // Conversion des mots en chiffres
      const numMap: { [key: string]: string } = { 'un': '1', 'une': '1', 'deux': '2', 'trois': '3', 'quatre': '4', 'cinq': '5', 'six': '6' };
      if (numMap[times.toLowerCase()]) {
        numTimes = numMap[times.toLowerCase()];
      }
      result.frequency = `${numTimes}/jour`;
    } else {
        // Fallback pour "matin midi et soir"
        if (normalizedText.includes('matin midi et soir') || normalizedText.includes('matin, midi et soir')) {
            result.frequency = '3/jour';
        } else if (normalizedText.includes('matin et soir')) {
            result.frequency = '2/jour';
        }
    }

    // 4. Extraction de la Durée
    // Ex: "pendant cinq jours", "pour 5 jours", "pendant 1 semaine"
    const durationRegex = /(?:pendant|pour)\s+(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|\d+)\s+(jour|jours|semaine|semaines|mois)/i;
    const durationMatch = normalizedText.match(durationRegex);
    if (durationMatch) {
      const amount = durationMatch[1];
      const unit = durationMatch[2].toLowerCase();

      let numAmount = amount;
      const numMap: { [key: string]: string } = { 'un': '1', 'une': '1', 'deux': '2', 'trois': '3', 'quatre': '4', 'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9', 'dix': '10' };
      if (numMap[amount.toLowerCase()]) {
        numAmount = numMap[amount.toLowerCase()];
      }

      let normalizedUnit = unit.startsWith('jour') ? 'jours' : (unit.startsWith('semaine') ? 'semaines' : 'mois');
      // Gérer le singulier
      if (numAmount === '1' && normalizedUnit !== 'mois') {
          normalizedUnit = normalizedUnit.slice(0, -1);
      }

      result.duration = `${numAmount} ${normalizedUnit}`;
    }

    return result;
  }
}
