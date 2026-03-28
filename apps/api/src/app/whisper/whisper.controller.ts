import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { WhisperService } from './whisper.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';

@Controller('whisper')
@UseGuards(AuthGuard('jwt'))
export class WhisperController {
  constructor(private readonly whisperService: WhisperService) {}

  @Post('transcribe')
  @AuditLog('AI_DICTATION_SUBMIT')
  async submitAudioForTranscription(@Body('filePath') filePath: string) {
    if (!filePath) {
      return { error: 'Chemin du fichier audio requis.' };
    }

    // Le chemin pointerait vers un fichier temporaire uploade sur le serveur ou téléchargé via l'API mobile
    const taskId = await this.whisperService.enqueueAudio(filePath);

    return {
      message: 'Fichier audio ajouté à la file de traitement local.',
      taskId,
    };
  }

  @Get('status/:taskId')
  async getTranscriptionStatus(@Param('taskId') taskId: string) {
    const task = this.whisperService.getTaskStatus(taskId);
    if (!task) {
      return { error: 'Tâche introuvable' };
    }
    return task;
  }
}
