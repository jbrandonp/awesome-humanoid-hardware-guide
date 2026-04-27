import { PrismaService } from '../prisma/prisma.service';
import { DpdpaConsentService } from '../audit/dpdpa-consent.service';
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
export declare class IntelligenceService {
    private readonly prisma;
    private readonly consentManager;
    private readonly logger;
    constructor(prisma: PrismaService, consentManager: DpdpaConsentService);
    /**
     * MOTEUR D'INTELLIGENCE CLINIQUE ACTIF (Remplacement du fichier JSON mocké)
     *
     * Au lieu de lire un fichier statique "drug_interactions.json", cette fonction
     * se connecte à la véritable base de données (PostgreSQL via Prisma), croise
     * l'historique réel du patient (si le DPDPA l'autorise), et identifie les
     * contre-indications majeures avant la validation de l'ordonnance (Omnibox).
     *
     * @param request La requête structurée et typée (Zéro 'any')
     * @returns DrugInteractionResult Le résultat détaillé des risques
     */
    checkDrugInteractions(request: DrugInteractionRequest): Promise<DrugInteractionResult>;
    /**
     * Utilitaire de création autonome de log de sécurité (Isolé).
     * Enveloppé dans un try/catch pour ne jamais bloquer l'exécution si le disque dur (Windows 7) est plein.
     */
    private logSecurityEvent;
}
//# sourceMappingURL=intelligence.service.d.ts.map