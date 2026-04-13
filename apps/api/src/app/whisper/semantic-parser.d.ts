export interface SemanticExtractionResult {
    molecule: string | null;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
}
export declare class SemanticParser {
    /**
     * Analyse sémantique d'un texte brut (Whisper) basé sur des expressions régulières
     * avancées et un système de règles pour extraire les informations de prescription.
     *
     * @param text Le texte brut issu de Whisper.cpp (ex: "Prescrire du paracétamol 500 milligrammes trois fois par jour pendant cinq jours")
     * @returns Un objet JSON structuré avec les données extraites
     */
    static extractPrescriptionData(text: string): SemanticExtractionResult;
}
//# sourceMappingURL=semantic-parser.d.ts.map