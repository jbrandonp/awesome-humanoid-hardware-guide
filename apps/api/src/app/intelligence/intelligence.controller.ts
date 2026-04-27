import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import type { DrugInteractionRequest } from './intelligence.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('intelligence')
@UseGuards(AuthGuard('jwt'))
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Post('check-interactions')
  async checkInteractions(@Body() request: DrugInteractionRequest): Promise<unknown> {
    if (
      !request ||
      !request.patientId ||
      !request.practitionerId ||
      !request.newMedications
    ) {
      throw new HttpException(
        "Données de prescription manquantes pour l'IA.",
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.intelligenceService.checkDrugInteractions(request);
  }
}
