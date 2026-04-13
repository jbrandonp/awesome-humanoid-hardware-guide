import { OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
export declare const AbhaRegistrationRequestSchema: z.ZodObject<{
    aadharNumber: z.ZodString;
    otp: z.ZodString;
    mobileNumber: z.ZodOptional<z.ZodString>;
    transactionId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AbhaRegistrationResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    abhaAddress: z.ZodOptional<z.ZodString>;
    abhaNumber: z.ZodOptional<z.ZodString>;
    errorMessage: z.ZodOptional<z.ZodString>;
    isOfflineFallback: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ConsentArtefactSchema: z.ZodObject<{
    id: z.ZodString;
    patientAbhaAddress: z.ZodString;
    hiuId: z.ZodString;
    hipId: z.ZodString;
    validFromIso: z.ZodString;
    validToIso: z.ZodString;
    signature: z.ZodString;
}, z.core.$strip>;
export declare const HipShareRequestSchema: z.ZodObject<{
    consentArtefactId: z.ZodString;
    patientAbhaAddress: z.ZodString;
    rawClinicalData: z.ZodString;
    requesterPublicKeyBase64: z.ZodString;
}, z.core.$strip>;
export declare const HiuRequestSchema: z.ZodObject<{
    patientAbhaAddress: z.ZodString;
    purposeOfRequest: z.ZodEnum<{
        CARE: "CARE";
        RESEARCH: "RESEARCH";
        PUBLIC_HEALTH: "PUBLIC_HEALTH";
    }>;
    requestedHiTypes: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const AbdmApiResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        FAILED: "FAILED";
        SENT: "SENT";
        QUEUED_OFFLINE: "QUEUED_OFFLINE";
    }>;
    transactionId: z.ZodOptional<z.ZodString>;
    errorMessage: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AbhaRegistrationRequest = z.infer<typeof AbhaRegistrationRequestSchema>;
export type AbhaRegistrationResult = z.infer<typeof AbhaRegistrationResultSchema>;
export type ConsentArtefact = z.infer<typeof ConsentArtefactSchema>;
export type HipShareRequest = z.infer<typeof HipShareRequestSchema>;
export type HiuRequest = z.infer<typeof HiuRequestSchema>;
export type AbdmApiResponse = z.infer<typeof AbdmApiResponseSchema>;
export declare class AbdmService implements OnModuleInit {
    private readonly logger;
    private readonly offlineQueue;
    private isProcessingQueue;
    private readonly privateKey;
    private readonly publicKey;
    constructor();
    onModuleInit(): void;
    /**
     * M1 - CRÉATION ABHA (Ayushman Bharat Health Account)
     * Protégé contre les Timeouts de l'API NHA.
     */
    createAbha(rawRequest: unknown): Promise<AbhaRegistrationResult>;
    /**
     * M3 - Health Information Provider (HIP) - PARTAGE DE DONNÉES SÉCURISÉ (DPDPA)
     * Chiffrement Asymétrique des Consent Artefacts avant envoi sur le réseau.
     */
    shareHealthRecords(rawRequest: unknown): Promise<AbdmApiResponse>;
    /**
     * Health Information User (HIU) - DEMANDE DE DOSSIER (Request Data)
     */
    requestHealthRecords(rawRequest: unknown): Promise<AbdmApiResponse>;
    /**
     * WATCHDOG DE LA FILE D'ATTENTE (Retry Mechanism)
     * Si la clinique rurale perd l'internet pendant une tempête, les partages HIP
     * s'empilent dans `offlineQueue`. Cette fonction vide la queue discrètement dès que le ping revient.
     */
    private processOfflineQueue;
}
//# sourceMappingURL=abdm.service.d.ts.map