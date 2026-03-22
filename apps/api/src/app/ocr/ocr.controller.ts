import { Controller, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { OcrService } from './ocr.service';
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
  @AuditLog('OCR_EXTRACT_VITALS')
  async extractVitals(
    @Body('text') text: string,
    @Body('patientId') patientId: string
  ) {
    if (!text || !patientId) {
      throw new HttpException('Texte brut et identifiant patient requis', HttpStatus.BAD_REQUEST);
    }

    // 1. Simuler l'OCR NER pour extraire les valeurs
    const extractedVitals = await this.ocrService.extractVitalsFromText(text);

    // 2. Injecter automatiquement ces valeurs dans la courbe de suivi via Prisma
    // (Cette donnée se synchronisera ensuite avec le WatermelonDB du client via le moteur CRDT)
    const newVital = await this.prisma.vital.create({
      data: {
        patientId: patientId,
        bloodPressure: extractedVitals.bloodPressure || null,
        heartRate: extractedVitals.heartRate || null,
        temperature: extractedVitals.temperature || null,
        recordedAt: new Date(),
        status: 'created'
      }
    });

    return {
      message: 'Constantes extraites et injectées dans le dossier',
      extractedData: extractedVitals,
      vitalId: newVital.id
    };
  }
}
