import { Controller, Post, Body } from '@nestjs/common';
import { NursingStationService } from './nursing-station.service';
import type { CreateAdministrationDto } from './dto/create-administration.dto';
import { medicationAdministrationSchema } from './dto/create-administration.dto';

@Controller('nursing-station')
export class NursingStationController {
  constructor(private readonly nursingStationService: NursingStationService) {}

  @Post('administrations')
  async createAdministration(@Body() createAdministrationDto: CreateAdministrationDto) {
    const parsedData = medicationAdministrationSchema.parse(createAdministrationDto);
    return this.nursingStationService.createAdministration(parsedData);
  }
}
