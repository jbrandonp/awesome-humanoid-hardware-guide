import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

interface WhisperTask {
  id: string;
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);
  private queue: WhisperTask[] = [];
  private isProcessing = false;
  private readonly whisperPath: string;
  private readonly modelPath: string;

  constructor() {
    // Expected paths for local AI inference (without internet)
    // In production, these binaries would be packaged with the server
    this.whisperPath = process.env.WHISPER_BIN_PATH || path.join(process.cwd(), 'bin', 'whisper', 'main');
    this.modelPath = process.env.WHISPER_MODEL_PATH || path.join(process.cwd(), 'models', 'base.en.q8_0.bin');
  }

  async enqueueAudio(filePath: string): Promise<string> {
    const taskId = Math.random().toString(36).substring(7);
    const task: WhisperTask = { id: taskId, filePath, status: 'pending' };

    this.queue.push(task);
    this.logger.log(`Tâche ajoutée à la file d'attente (IA Locale): ${taskId}`);

    this.processQueue(); // Trigger queue processing if idle
    return taskId;
  }

  getTaskStatus(taskId: string): WhisperTask | undefined {
    return this.queue.find(t => t.id === taskId);
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const taskIndex = this.queue.findIndex(t => t.status === 'pending');

    if (taskIndex !== -1) {
      const task = this.queue[taskIndex];
      task.status = 'processing';
      this.logger.log(`Traitement du fichier audio avec whisper.cpp: ${task.filePath}`);

      try {
        // En vrai, nous vérifierions l'existence du binaire : fs.existsSync(this.whisperPath)
        // Ici on simule l'appel exact qui serait fait en production
        const command = `"${this.whisperPath}" -m "${this.modelPath}" -f "${task.filePath}" --output-txt`;

        // --- DEBUT MOCK POUR SANDBOX ---
        // Étant donné que le modèle ~1Go et le binaire C++ ne sont pas installés sur le cloud actuel,
        // on retourne une réponse simulée qui mime exactement la sortie texte.
        let stdout = "Patient presents with acute fever and chills.";

        // Mocking execution delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        // --- FIN MOCK ---

        // Véritable commande si le binaire était présent :
        // const { stdout, stderr } = await execAsync(command);

        task.status = 'completed';
        task.result = stdout.trim();
        this.logger.log(`Transcription locale terminée pour ${task.id}: ${task.result}`);

      } catch (error) {
        this.logger.error(`Erreur lors de la transcription whisper.cpp`, error);
        task.status = 'failed';
        task.error = String(error);
      }
    }

    this.isProcessing = false;

    // Process next item
    if (this.queue.some(t => t.status === 'pending')) {
        this.processQueue();
    }
  }
}
