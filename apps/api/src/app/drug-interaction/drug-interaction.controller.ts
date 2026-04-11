import { Controller, Post, Body, UsePipes, UseGuards } from '@nestjs/common';
import { DrugInteractionService } from './drug-interaction.service';
import { 
  DrugInteractionCheckSchema, 
  DrugInteractionOverrideSchema,
  ZodValidationPipe
} from './dto/drug-interaction.dto';
import type {
  DrugInteractionCheckDto, 
  DrugInteractionOverrideDto, 
} from './dto/drug-interaction.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('drug-interaction')
@UseGuards(AuthGuard('jwt'))
export class DrugInteractionController {
  constructor(private readonly interactionService: DrugInteractionService) {}

  @Post('check')
  @UsePipes(new ZodValidationPipe(DrugInteractionCheckSchema))
  async check(@Body() dto: DrugInteractionCheckDto): Promise<unknown> {
    return this.interactionService.checkInteraction(dto);
  }

  @Post('override')
  @UsePipes(new ZodValidationPipe(DrugInteractionOverrideSchema))
  async override(@Body() dto: DrugInteractionOverrideDto): Promise<unknown> {
    return this.interactionService.overridePrescription(dto);
  }
}
