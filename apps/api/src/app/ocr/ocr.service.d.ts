import { HttpException } from '@nestjs/common';
export type VitalSignCategory = 'GLUCOSE' | 'HEART_RATE' | 'TEMPERATURE' | 'BLOOD_PRESSURE_SYSTOLIC' | 'BLOOD_PRESSURE_DIASTOLIC';
export interface NerExtractedEntity {
    category: VitalSignCategory;
    rawTextMatch: string;
    numericValue: number;
    unit: string | null;
    confidenceScore: number;
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
export declare class OcrReviewRequiredException extends HttpException {
    readonly extractedData: NerOcrResult;
    constructor(extractedData: NerOcrResult);
}
export declare class OcrService {
    private readonly logger;
    private readonly CLINICAL_CONFIDENCE_THRESHOLD;
    /**
     * MOTEUR NER LOCAL (Named Entity Recognition Heuristique)
     *
     * Remplace les simples Regex par un analyseur de contexte (Tokenizer & Scorer).
     * Identifie la valeur, l'unité, et calcule un score de confiance basé sur
     * la structure grammaticale de la phrase issue d'un rapport de laboratoire brouillon.
     */
    extractVitalsWithNer(ocrText: string): Promise<NerOcrResult>;
    /**
     * Moteur probabiliste de contexte (Simule un NLP Tokenizer)
     * Il calcule le score de confiance selon la proximité spatiale entre le mot-clé,
     * la valeur numérique, et l'unité de mesure.
     */
    private analyzeContextWindow;
}
//# sourceMappingURL=ocr.service.d.ts.map