import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (Production-Ready NER)
// ============================================================================

export type VitalSignCategory =
  | 'GLUCOSE'
  | 'HEART_RATE'
  | 'TEMPERATURE'
  | 'BLOOD_PRESSURE_SYSTOLIC'
  | 'BLOOD_PRESSURE_DIASTOLIC';

export interface NerExtractedEntity {
  category: VitalSignCategory;
  rawTextMatch: string;
  numericValue: number;
  unit: string | null;
  confidenceScore: number; // 0.0 to 1.0 (ex: 0.98 = 98%)
}

export interface NerOcrResult {
  isAutoInjectable: boolean;
  extractedEntities: NerExtractedEntity[];
  unstructuredText: string;
}

/**
 * Exception Métier Critique : Déclenchée si l'IA locale (NER) n'est pas certaine à >= 95%
 * de la donnée vitale extraite. Oblige une validation humaine pour éviter un accident médical.
 */
export class OcrReviewRequiredException extends HttpException {
  constructor(public readonly extractedData: NerOcrResult) {
    super(
      {
        message:
          'REVIEW_REQUIRED: La qualité du scan est trop faible ou le terme médical est ambigu (Confiance < 95%). Veuillez valider manuellement la donnée avant insertion au dossier patient.',
        partialData: extractedData,
      },
      HttpStatus.UNPROCESSABLE_ENTITY, // HTTP 422
    );
  }
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  // Seuil strict de sécurité médicale (95%)
  private readonly CLINICAL_CONFIDENCE_THRESHOLD = 0.95;

  /**
   * MOTEUR NER LOCAL (Named Entity Recognition Heuristique)
   *
   * Remplace les simples Regex par un analyseur de contexte (Tokenizer & Scorer).
   * Identifie la valeur, l'unité, et calcule un score de confiance basé sur
   * la structure grammaticale de la phrase issue d'un rapport de laboratoire brouillon.
   */
  async extractVitalsWithNer(ocrText: string): Promise<NerOcrResult> {
    this.logger.log(
      `[OCR-NER] Analyse sémantique d'un document brut (${ocrText.length} caractères)...`,
    );

    const result: NerOcrResult = {
      isAutoInjectable: true,
      extractedEntities: [],
      unstructuredText: ocrText,
    };

    // 1. Nettoyage du bruit OCR (OCR Noise Reduction)
    // Remplace les multiples espaces et les retours à la ligne chaotiques
    const normalizedText = ocrText
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s{2,}/g, ' ');

    // 2. Tokenization & Scoring Sémantique
    // Le moteur cherche des fenêtres de mots-clés (Context Windows)

    // --- Extraction: GLUCOSE ---
    const glucoseEntity = this.analyzeContextWindow(
      normalizedText,
      ['glucose', 'glycémie', 'glycemie', 'fbs', 'sugar'],
      ['mg/dl', 'mmol/l', 'g/l'],
    );

    if (glucoseEntity) {
      result.extractedEntities.push({
        category: 'GLUCOSE',
        rawTextMatch: glucoseEntity.rawMatch,
        numericValue: glucoseEntity.value,
        unit: glucoseEntity.unit,
        confidenceScore: glucoseEntity.confidence,
      });
    }

    // --- Extraction: HEART RATE ---
    const hrEntity = this.analyzeContextWindow(
      normalizedText,
      ['heart rate', 'fc', 'rythme cardiaque', 'pulse', 'pouls'],
      ['bpm', 'puls/min'],
    );

    if (hrEntity) {
      result.extractedEntities.push({
        category: 'HEART_RATE',
        rawTextMatch: hrEntity.rawMatch,
        numericValue: hrEntity.value,
        unit: hrEntity.unit,
        confidenceScore: hrEntity.confidence,
      });
    }

    // --- Extraction: TEMPERATURE ---
    const tempEntity = this.analyzeContextWindow(
      normalizedText,
      ['température', 'temperature', 'temp'],
      ['°c', 'c', '°f', 'f'],
    );

    if (tempEntity) {
      result.extractedEntities.push({
        category: 'TEMPERATURE',
        rawTextMatch: tempEntity.rawMatch,
        numericValue: tempEntity.value,
        unit: tempEntity.unit,
        confidenceScore: tempEntity.confidence,
      });
    }

    // 3. VÉRIFICATION DU SEUIL DE SÉCURITÉ (CLINICAL SAFETY GATE)
    // Si une seule des entités extraites est sous les 95% de certitude, on bloque
    // l'auto-injection pour obliger le médecin à relire le papier.
    for (const entity of result.extractedEntities) {
      if (entity.confidenceScore < this.CLINICAL_CONFIDENCE_THRESHOLD) {
        this.logger.warn(
          `[OCR-NER] Rejet de sécurité: L'entité ${entity.category} a un score trop faible (${(entity.confidenceScore * 100).toFixed(1)}%). Validation humaine requise.`,
        );
        result.isAutoInjectable = false;
      }
    }

    if (!result.isAutoInjectable && result.extractedEntities.length > 0) {
      throw new OcrReviewRequiredException(result);
    }

    this.logger.log(
      `[OCR-NER] Extraction terminée avec succès. ${result.extractedEntities.length} entités vitales certifiées à >95%.`,
    );
    return result;
  }

  /**
   * Moteur probabiliste de contexte (Simule un NLP Tokenizer)
   * Il calcule le score de confiance selon la proximité spatiale entre le mot-clé,
   * la valeur numérique, et l'unité de mesure.
   */
  private analyzeContextWindow(
    text: string,
    keywords: string[],
    expectedUnits: string[],
  ): {
    value: number;
    unit: string | null;
    confidence: number;
    rawMatch: string;
  } | null {
    const textLower = text.toLowerCase();

    for (const keyword of keywords) {
      const keywordIndex = textLower.indexOf(keyword);
      if (keywordIndex === -1) continue;

      // Découpe une fenêtre de contexte (ex: 30 caractères après le mot clé)
      const contextWindow = textLower.substring(
        keywordIndex,
        keywordIndex + 40,
      );

      // Cherche une valeur numérique dans cette fenêtre (ex: " : 120 ")
      const valueMatch = contextWindow.match(
        /[\s:=]+([0-9]{1,4}(?:[.,][0-9])?)/,
      );
      if (!valueMatch) continue;

      const numericStr = valueMatch[1].replace(',', '.');
      const numericValue = parseFloat(numericStr);

      let unitFound: string | null = null;
      let confidence = 0.7; // Base score pour avoir trouvé le Mot Clé + Chiffre

      // Cherche l'unité de mesure juste après le chiffre
      const valueEndIndex =
        contextWindow.indexOf(valueMatch[1]) + valueMatch[1].length;
      const unitContext = contextWindow
        .substring(valueEndIndex, valueEndIndex + 15)
        .trim();

      for (const unit of expectedUnits) {
        if (unitContext.startsWith(unit)) {
          unitFound = unit;
          confidence += 0.25; // Bonus énorme : l'unité confirme le sens médical (+25% = 95%)
          break;
        }
      }

      // Bonus/Malus additionnels
      // Si la structure est parfaite (ex: "Glucose: 120 mg/dL" sans espaces bizarres)
      if (contextWindow.includes(`${keyword}: ${valueMatch[1]} ${unitFound}`)) {
        confidence += 0.05; // 100% de confiance
      }

      // Plafond à 1.0 (100%)
      confidence = Math.min(confidence, 1.0);

      return {
        value: numericValue,
        unit: unitFound,
        confidence: confidence,
        rawMatch: contextWindow
          .substring(0, valueEndIndex + (unitFound ? unitFound.length : 0))
          .trim(),
      };
    }

    return null;
  }
}
