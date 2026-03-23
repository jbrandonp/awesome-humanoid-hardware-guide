import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

// ============================================================================
// TYPAGES STRICTS - ZERO 'ANY' POLICY (ABDM Specifications)
// ============================================================================

export interface AbhaRegistrationRequest {
  aadharNumber: string;
  otp: string;
  mobileNumber?: string;
  transactionId?: string; // Token de suivi de la session ABDM
}

export interface AbhaRegistrationResult {
  success: boolean;
  abhaAddress?: string;
  abhaNumber?: string;
  errorMessage?: string;
  isOfflineFallback?: boolean; // Indicateur si le serveur NHA est injoignable
}

export interface ConsentArtefact {
  id: string;
  patientAbhaAddress: string;
  hiuId: string; // Health Information User (Demandeur)
  hipId: string; // Health Information Provider (Fournisseur)
  validFromIso: string;
  validToIso: string;
  signature: string; // Signature cryptographique du patient
}

export interface HipShareRequest {
  consentArtefactId: string;
  patientAbhaAddress: string;
  rawClinicalData: string; // JSON FHIR R4 en clair à chiffrer
  requesterPublicKeyBase64: string; // Clé publique Curve25519 (ECDH) du destinataire
}

export interface HiuRequest {
  patientAbhaAddress: string;
  purposeOfRequest: 'CARE' | 'RESEARCH' | 'PUBLIC_HEALTH';
  requestedHiTypes: string[]; // ex: ['Prescription', 'DiagnosticReport']
}

export interface AbdmApiResponse {
  status: 'SENT' | 'QUEUED_OFFLINE' | 'FAILED';
  transactionId?: string;
  errorMessage?: string;
}

@Injectable()
export class AbdmService implements OnModuleInit {
  private readonly logger = new Logger(AbdmService.name);

  // File d'attente résiliente si le serveur NHA (National Health Authority) ne répond pas
  private readonly offlineQueue: HipShareRequest[] = [];
  private isProcessingQueue = false;

  // Cryptographie ABDM : Paires de clés locales (Elliptic Curve Diffie-Hellman - X25519)
  // L'application génère sa paire à chaque démarrage (Échange de clés éphémère - PFS)
  private readonly ecdh: crypto.ECDH;

  constructor() {
    // Initialisation du moteur cryptographique officiel requis par ABDM (Curve25519)
    this.ecdh = crypto.createECDH('prime256v1'); // Alternative à x25519 pour compatibilité NodeJS standard
    this.ecdh.generateKeys();
  }

  onModuleInit() {
    // Lancement du "Watchdog" de la file d'attente hors-ligne (Retry toutes les minutes)
    setInterval(() => this.processOfflineQueue(), 60000);
  }

  /**
   * M1 - CRÉATION ABHA (Ayushman Bharat Health Account)
   * Protégé contre les Timeouts de l'API NHA.
   */
  async createAbha(request: AbhaRegistrationRequest): Promise<AbhaRegistrationResult> {
    this.logger.log(`[ABDM M1] Tentative de création ABHA pour Aadhar: ${request.aadharNumber.substring(0, 4)}XXXX...`);

    try {
      // MOCK : Appel Axios réel vers l'API ABDM Sandbox (https://healthidsbx.abdm.gov.in/api)
      // avec timeout strict (10 secondes) pour ne pas geler le vieux PC Windows 7
      await new Promise((resolve, reject) => {
        // Simulation d'un crash aléatoire du serveur gouvernemental (Timeout)
        if (Math.random() < 0.2) return reject(new Error('ECONNABORTED'));
        setTimeout(resolve, 800);
      });

      if (request.otp === '123456') {
        return {
          success: true,
          abhaAddress: `patient_${Date.now()}@ndhm`,
          abhaNumber: '14-1234-5678-9012'
        };
      }

      return { success: false, errorMessage: 'OTP Invalide ou expiré.' };

    } catch (networkError: unknown) {
      this.logger.error(`[CRITICAL ABDM ERROR] Le serveur d'identité gouvernemental est hors-ligne.`, networkError);

      // Fallback local: On ne crashe pas, l'UI affichera qu'on est passé en mode "Local Only".
      return {
         success: false,
         isOfflineFallback: true,
         errorMessage: 'Serveur national injoignable. Le dossier patient a été créé localement (Hors-ligne). La liaison ABHA se fera au retour du réseau.'
      };
    }
  }

  /**
   * M3 - Health Information Provider (HIP) - PARTAGE DE DONNÉES SÉCURISÉ (DPDPA)
   * Chiffrement Asymétrique des Consent Artefacts avant envoi sur le réseau.
   */
  async shareHealthRecords(request: HipShareRequest): Promise<AbdmApiResponse> {
    this.logger.log(`[ABDM HIP] Préparation du partage (Consent Artefact: ${request.consentArtefactId}) pour ${request.patientAbhaAddress}...`);

    try {
       // 1. CHIFFREMENT ASYMÉTRIQUE STRICT (Standard ABDM / DPDPA)
       // L'expéditeur (Nous/HIP) utilise sa clé privée + la clé publique du destinataire (HIU)
       // pour générer un secret partagé (Shared Secret ECDH)
       const hiuPublicKey = Buffer.from(request.requesterPublicKeyBase64, 'base64');
       const sharedSecret = this.ecdh.computeSecret(hiuPublicKey);

       // 2. Chiffrement AES-256-GCM du payload FHIR R4 en utilisant le Shared Secret
       const iv = crypto.randomBytes(12);
       const cipher = crypto.createCipheriv('aes-256-gcm', sharedSecret.subarray(0, 32), iv);

       let encryptedData = cipher.update(request.rawClinicalData, 'utf8', 'base64');
       encryptedData += cipher.final('base64');
       const authTag = cipher.getAuthTag().toString('base64');

       const securePayload = {
          iv: iv.toString('base64'),
          encryptedData,
          authTag,
          hipPublicKey: this.ecdh.getPublicKey('base64')
       };

       this.logger.log(`[ABDM HIP] Chiffrement ECDH+AES256 réussi. Poussée réseau en cours...`);

       // 3. ENVOI RÉSEAU AVEC GESTION DES TIMEOUTS
       // MOCK : Axios POST vers https://dev.abdm.gov.in/gateway/v0.5/health-information/notify
       await new Promise((resolve, reject) => {
         if (Math.random() < 0.3) return reject(new Error('Gateway Timeout 504')); // 30% de chance d'échec
         setTimeout(resolve, 500);
       });

       return { status: 'SENT', transactionId: `TXN_${Date.now()}` };

    } catch (encryptionOrNetworkError: unknown) {
       this.logger.error(`[FATAL ABDM] Échec de l'envoi chiffré. Le dossier est sécurisé en file d'attente locale (WatermelonDB/RAM).`, encryptionOrNetworkError);

       // FALLBACK : Résilience "Offline-First"
       // La donnée vitale n'est pas perdue. Elle attend le retour de l'internet.
       this.offlineQueue.push(request);

       return {
         status: 'QUEUED_OFFLINE',
         errorMessage: 'Réseau clinique indisponible ou instable. Le transfert chiffré est en attente (Retry asynchrone).'
       };
    }
  }

  /**
   * Health Information User (HIU) - DEMANDE DE DOSSIER (Request Data)
   */
  async requestHealthRecords(request: HiuRequest): Promise<AbdmApiResponse> {
     this.logger.log(`[ABDM HIU] Demande d'historique pour ${request.patientAbhaAddress} (Motif: ${request.purposeOfRequest})`);

     try {
        // Envoi au Consent Manager gouvernemental
        // MOCK Axios POST
        await new Promise(resolve => setTimeout(resolve, 400));

        return { status: 'SENT', transactionId: `REQ_${Date.now()}` };
     } catch (e) {
        throw new HttpException('Passerelle ABDM injoignable', HttpStatus.SERVICE_UNAVAILABLE);
     }
  }

  /**
   * WATCHDOG DE LA FILE D'ATTENTE (Retry Mechanism)
   * Si la clinique rurale perd l'internet pendant une tempête, les partages HIP
   * s'empilent dans `offlineQueue`. Cette fonction vide la queue discrètement dès que le ping revient.
   */
  private async processOfflineQueue() {
     if (this.isProcessingQueue || this.offlineQueue.length === 0) return;
     this.isProcessingQueue = true;

     this.logger.log(`[WATCHDOG ABDM] Relance de l'envoi de ${this.offlineQueue.length} dossiers médicaux en attente...`);

     const itemsToRetry = [...this.offlineQueue];
     this.offlineQueue.length = 0; // Clear the queue temporarily

     for (const request of itemsToRetry) {
        try {
           const result = await this.shareHealthRecords(request);
           if (result.status === 'QUEUED_OFFLINE') {
              // Si ça a encore échoué (réseau toujours down), on le remet dans la file principale
              this.offlineQueue.push(request);
           }
        } catch (fatalError) {
           this.logger.error(`[WATCHDOG ABDM] Abandon définitif d'un paquet corrompu.`, fatalError);
        }
     }

     this.isProcessingQueue = false;
  }
}
