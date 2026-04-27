import { Controller, Post, Body, Get, Param, Put, ParseUUIDPipe } from '@nestjs/common';
import { NursingStationService } from './nursing-station.service';
import type { CreateAdministrationDto } from './dto/create-administration.dto';
import { medicationAdministrationSchema } from './dto/create-administration.dto';
import { BedStatus } from '@prisma/client';

@Controller('nursing-station')
export class NursingStationController {
  constructor(private readonly nursingStationService: NursingStationService) {}

  @Post('administrations')
  async createAdministration(@Body() createAdministrationDto: CreateAdministrationDto): Promise<unknown> {
    const parsedData = medicationAdministrationSchema.parse(createAdministrationDto);
    return this.nursingStationService.createAdministration(parsedData);
  }

  @Get('beds')
  async getBeds() {
    return this.nursingStationService.getBeds();
  }

  @Get('beds/:id')
  async getBed(@Param('id', ParseUUIDPipe) id: string) {
    return this.nursingStationService.getBed(id);
  }

  @Put('beds/:id/status')
  async updateBedStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: BedStatus,
  ) {
    return this.nursingStationService.updateBedStatus(id, status);
  }

  @Get('patients')
  async getPatients() {
    return this.nursingStationService.getPatients();
  }

  @Get('medications/due')
  async getMedicationsDue() {
    return this.nursingStationService.getMedicationsDue();
  }
}
