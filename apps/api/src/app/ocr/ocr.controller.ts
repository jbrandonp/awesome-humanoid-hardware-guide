import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OcrService, OcrReviewRequiredException } from './ocr.service';
import { AuthGuard } from '@nestjs/passport';
import { AuditLog } from '../audit/audit.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ocr')
@UseGuards(AuthGuard('jwt'))
export class OcrController {
  constructor(
    private readonly ocrService: OcrService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('extract-vitals')
  @AuditLog('OCR_NER_EXTRACT_VITALS')
  async extractVitals(
    @Body('text') text: string,
    @Body('patientId') patientId: string,
    @Body('forceInjection') forceInjection: boolean = false, // Si un humain valide manuellement les 95%
  ): Promise<{ message: string; entities: unknown[]; vitalId: string }> {
    if (!text || !patientId) {
      throw new HttpException(
        'Texte brut et identifiant patient requis pour le moteur NLP.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // 1. Appel du Moteur de Traitement du Langage (NER) et de Confiance (Score 95%)
      const nlpResult = await this.ocrService.extractVitalsWithNer(text);

      // 2. Traitement des entités certifiées (>95% ou Forcées par le docteur)
      if (nlpResult.isAutoInjectable || forceInjection) {
        let bloodPressure = null;
        let heartRate = null;
        let temperature = null;
        let glucose = null;

        for (const entity of nlpResult.extractedEntities) {
          switch (entity.category) {
            case 'GLUCOSE':
              glucose = entity.numericValue;
              break;
            case 'HEART_RATE':
              heartRate = entity.numericValue;
              break;
            case 'TEMPERATURE':
              temperature = entity.numericValue;
              break;
            case 'BLOOD_PRESSURE_DIASTOLIC':
              if (typeof bloodPressure === 'string' && bloodPressure.includes('/...')) {
                bloodPressure = bloodPressure.replace('/...', `/${entity.numericValue}`);
              }
              break;
            case 'BLOOD_PRESSURE_SYSTOLIC':
              bloodPressure = `${entity.numericValue}/...`;
              break;
          }
        }

        // Injection 100% Automatique dans le dossier clinique (WatermelonDB <-> Postgres)
        const newVital = await this.prisma.vital.create({
          data: {
            patientId: patientId,
            bloodPressure: bloodPressure,
            heartRate: heartRate,
            temperature: temperature,
            glucose: glucose,
            recordedAt: new Date(),
            status: 'created',
          },
        });

        return {
          message: forceInjection
            ? 'Injection forcée validée par un humain.'
            : 'Confiance IA > 95%. Constantes injectées automatiquement et sans friction au dossier.',
          entities: nlpResult.extractedEntities,
          vitalId: newVital.id,
        };
      }

      // Si aucune entité n'a été trouvée dans le texte
      throw new HttpException(
        "Aucune donnée vitale exploitable n'a pu être extraite du rapport.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } catch (error: unknown) {
      // Gestion Spécifique de la faille de confiance médicale (<95%)
      // L'API renvoie un 422 Unprocessable Entity avec les fragments de texte ambiguë.
      if (error instanceof OcrReviewRequiredException) {
        throw error;
      }

      throw new HttpException(
        'Échec du moteur sémantique.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
