import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { stat } from 'fs/promises';
import { SemanticParser, SemanticExtractionResult } from './semantic-parser';

// ============================================================================
// TYPAGES STRICTS (ZERO 'ANY' POLICY)
// ============================================================================

export type WhisperTaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED_OOM_RISK';

export interface WhisperTask {
  id: string;
  filePath: string;
  status: WhisperTaskStatus;
  resultText?: string;
  extractedData?: SemanticExtractionResult;
  errorMessage?: string;
  enqueuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WhisperConfig {
  binaryPath: string;
  modelPath: string;
  maxFileSizeBytes: number;
  maxExecutionTimeMs: number;
  threads: number;
}

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);

  // File d'attente FIFO stricte (Evite le lancement concurrent de multiples IA)
  private taskQueue: WhisperTask[] = [];
  private isProcessingQueue: boolean = false;

  // Configuration "Low-Resource" (Cible: Windows 7, 4Go RAM)
  private readonly config: WhisperConfig;

  constructor() {
    this.config = {
      // Chemins relatifs à la racine du projet ou définis par le sysadmin
      binaryPath: process.env.WHISPER_BIN_PATH || path.join(process.cwd(), 'bin', 'whisper.cpp', 'main'),
      // Modèle Medium q8_0 : Équilibre parfait. Le q8_0 consomme ~1.5 Go de RAM (contre 3Go pour f16)
      modelPath: process.env.WHISPER_MODEL_PATH || path.join(process.cwd(), 'models', 'ggml-medium.en-q8_0.bin'),
      // Hard Limit: Si le WAV dépasse 50Mo, l'empreinte mémoire d'inférence explosera.
      maxFileSizeBytes: 50 * 1024 * 1024,
      // Timeout d'exécution : Empêche un processus zombie de geler le CPU indéfiniment
      maxExecutionTimeMs: 5 * 60 * 1000, // 5 Minutes max
      // Threads limités à 2 pour ne pas monopoliser le CPU d'un vieux processeur Dual-Core
      threads: 2
    };
  }

  /**
   * INGESTION SÉCURISÉE DU FICHIER AUDIO
   * Vérifie les limites de sécurité avant même d'accepter la tâche en RAM.
   */
  async enqueueAudio(filePath: string): Promise<string> {
    try {
      // 1. GESTION DES ERREURS : Le fichier existe-t-il ?
      if (!fs.existsSync(filePath)) {
         throw new HttpException("Le fichier audio spécifié est introuvable sur le disque.", HttpStatus.BAD_REQUEST);
      }

      // 2. GESTION DES ERREURS (OOM RISK) : La taille du fichier dépasse-t-elle la limite stricte de 50Mo ?
      const fileStats = await stat(filePath);
      if (fileStats.size > this.config.maxFileSizeBytes) {
         this.logger.warn(`[Whisper] Rejet du fichier audio (${fileStats.size} octets). Dépassement de la limite de sécurité RAM (50Mo).`);
         throw new HttpException(
           "Fichier audio trop volumineux. Risque de saturation mémoire (Out of Memory). Veuillez enregistrer une note plus courte.",
           HttpStatus.PAYLOAD_TOO_LARGE
         );
      }

      // 3. MISE EN FILE D'ATTENTE
      const taskId = `AI-DICTATION-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const task: WhisperTask = {
        id: taskId,
        filePath,
        status: 'PENDING',
        enqueuedAt: new Date()
      };

      this.taskQueue.push(task);
      this.logger.log(`[Whisper] Tâche ajoutée à la file d'attente (IA Locale): ${taskId}`);

      // Déclencheur asynchrone non-bloquant
      this.processQueueSafely();

      return taskId;

    } catch (fsError: unknown) {
      if (fsError instanceof HttpException) throw fsError;
      this.logger.error("[Whisper] Erreur système lors de la lecture du fichier audio.", fsError);
      throw new HttpException("Erreur système locale lors de l'accès au fichier.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Récupère le statut d'une transcription en cours (Polling du frontend)
   */
  getTaskStatus(taskId: string): WhisperTask | undefined {
    return this.taskQueue.find(t => t.id === taskId);
  }

  /**
   * MOTEUR DE TRAITEMENT SÉQUENTIEL (Un seul processus Whisper à la fois)
   * Évite de lancer 2 processus IA qui feraient exploser les 4Go de RAM (2x 1.5Go = Crash)
   */
  private async processQueueSafely(): Promise<void> {
    if (this.isProcessingQueue || this.taskQueue.length === 0) return;

    this.isProcessingQueue = true;

    // On prend la plus ancienne tâche en attente (FIFO)
    const taskIndex = this.taskQueue.findIndex(t => t.status === 'PENDING');

    if (taskIndex !== -1) {
      const task = this.taskQueue[taskIndex];
      task.status = 'PROCESSING';
      task.startedAt = new Date();
      this.logger.log(`[Whisper] Début du traitement audio pour: ${task.id}`);

      try {
         // Exécution réelle du binaire C++
         const transcriptionResult = await this.spawnWhisperProcess(task.filePath);

         // Succès
         task.status = 'COMPLETED';
         task.completedAt = new Date();
         task.resultText = transcriptionResult.text;
         task.extractedData = transcriptionResult.extractedData;

         this.logger.log(`[Whisper] Transcription terminée (${task.id}).`);

         // Optional : On pourrait déclencher l'AuditLog DPDPA ici pour certifier la transcription

      } catch (aiError: unknown) {
         // Échec de l'IA (Fichier corrompu, Crash Binaire, Timeout CPU)
         task.status = 'FAILED';
         task.completedAt = new Date();
         task.errorMessage = (aiError as Error).message || "Erreur inconnue du moteur d'intelligence artificielle.";
         this.logger.error(`[Whisper] Échec critique de la tâche ${task.id}:`, task.errorMessage);
      }
    }

    this.isProcessingQueue = false;

    // S'il reste des tâches, on relance la boucle
    if (this.taskQueue.some(t => t.status === 'PENDING')) {
        this.processQueueSafely();
    }
  }

  /**
   * EXÉCUTION NATIVE DE L'IA LOCALE (child_process.spawn)
   * Gère les flux binaires (stdout/stderr) et les Timeouts (Kill Switch).
   */
  private spawnWhisperProcess(audioFilePath: string): Promise<{ text: string, extractedData: SemanticExtractionResult }> {
    return new Promise((resolve, reject) => {

      // 1. Vérification stricte des dépendances binaires avant exécution
      if (!fs.existsSync(this.config.binaryPath)) {
         return reject(new Error(`Le binaire whisper.cpp est introuvable au chemin : ${this.config.binaryPath}`));
      }
      if (!fs.existsSync(this.config.modelPath)) {
         return reject(new Error(`Le modèle IA (q8_0) est introuvable au chemin : ${this.config.modelPath}`));
      }

      // 2. Construction des arguments d'optimisation RAM
      // -m : Chemin du modèle (Medium Quantifié)
      // -f : Fichier audio WAV (16kHz attendu)
      // -t : Nombre de threads limités pour ne pas surchauffer les vieux CPU
      // --max-context 0 : Demande à Whisper de minimiser l'historique de contexte si possible
      const args = [
        '-m', this.config.modelPath,
        '-f', audioFilePath,
        '-t', this.config.threads.toString(),
        '--max-context', '0',
        '--no-timestamps' // Sortie texte propre sans les horodatages [00:00:00]
      ];

      this.logger.debug(`[Whisper] Spawn: ${this.config.binaryPath} ${args.join(' ')}`);

      let stdoutData = '';
      let stderrData = '';

      // 3. Lancement du processus non-bloquant
      const whisperProcess: ChildProcess = spawn(this.config.binaryPath, args);

      // 4. Watchdog Timeout (Kill Switch)
      // Si la machine Windows 7 gèle et que Whisper tourne pendant > 5 minutes, on tue le processus
      const timeoutId = setTimeout(() => {
        this.logger.error(`[Whisper] TIMEOUT EXTREME: Le processus a dépassé ${this.config.maxExecutionTimeMs / 1000}s. Exécution du Kill Switch (SIGKILL).`);
        whisperProcess.kill('SIGKILL');
        reject(new Error("Timeout: L'IA a mis trop de temps à répondre ou le fichier est trop complexe pour ce CPU."));
      }, this.config.maxExecutionTimeMs);

      // 5. Collecte des flux asynchrones (Stdout = Résultat, Stderr = Logs/Progression/Erreurs)
      whisperProcess.stdout?.on('data', (data: Buffer) => {
        stdoutData += data.toString('utf-8');
      });

      whisperProcess.stderr?.on('data', (data: Buffer) => {
        // Whisper.cpp écrit souvent ses logs d'initialisation (chargement du modèle) dans stderr
        stderrData += data.toString('utf-8');
      });

      // 6. Gestion des erreurs d'exécution inattendues (ex: binaire corrompu, permissions OS)
      whisperProcess.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        this.logger.error(`[Whisper] Erreur de lancement du processus binaire:`, error);
        reject(new Error(`Impossible de démarrer l'exécutable IA : ${error.message}`));
      });

      // 7. Conclusion du processus
      whisperProcess.on('close', (code: number, signal: NodeJS.Signals | null) => {
        clearTimeout(timeoutId);

        if (signal === 'SIGKILL' || signal === 'SIGTERM') {
           return; // Déjà géré par le Timeout
        }

        if (code !== 0) {
           this.logger.warn(`[Whisper] Le binaire s'est arrêté avec une erreur (Code: ${code}). Stderr: ${stderrData.substring(0, 500)}...`);

           // Si l'audio était dans un mauvais format (ex: MP3 au lieu de WAV 16kHz)
           if (stderrData.includes('Invalid RIFF') || stderrData.includes('format not supported')) {
              return reject(new Error("Format audio corrompu ou non supporté (Le fichier doit être un WAV 16kHz Mono)."));
           }
           // Out Of Memory natif du C++
           if (stderrData.includes('out of memory') || stderrData.includes('std::bad_alloc')) {
              return reject(new Error("Panne Matérielle (Out Of Memory) : La RAM système est saturée, l'IA a crashé."));
           }

           return reject(new Error(`L'intelligence artificielle a crashé de manière inattendue (Code de sortie: ${code}).`));
        }

        // Si tout s'est bien passé
        const cleanText = stdoutData.trim();
        if (!cleanText) {
           this.logger.warn(`[Whisper] Transcription terminée avec succès mais le résultat est vide. (Bruit de fond ?)`);
        }

        // Extraction intelligente basique (NER pour l'aide à la décision du Sprint 4)
        const enhancedResult = this.applyBasicMedicalNer(cleanText);

        resolve(enhancedResult);
      });
    });
  }

  /**
   * Post-traitement local : Extrait les entités médicales clés (Molécule, Dosage, etc.)
   * depuis la transcription brute de Whisper.cpp, via le SemanticParser (Edge NLP).
   */
  private applyBasicMedicalNer(rawText: string): { text: string, extractedData: SemanticExtractionResult } {
     let resultText = rawText;

     // 1. Appel au nouveau moteur NLP basé sur Regex
     const extractedData = SemanticParser.extractPrescriptionData(rawText);

     // 2. Formatage pour la présentation (compatibilité ascendante du texte brut)
     const detectedMeds: string[] = [];
     if (extractedData.molecule) {
        detectedMeds.push(extractedData.molecule);
     }

     if (detectedMeds.length > 0) {
        resultText += `\n\n[IA_SUGGESTIONS] Médicaments détectés dans la dictée : ${detectedMeds.join(', ')}`;
     }

     return { text: resultText, extractedData };
  }
}
