import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClinicalRecordService } from './clinical-record.service';
import { SaveAnnotationDto } from './dto/annotation.dto';

@Controller('clinical-records')
export class ClinicalRecordController {
  constructor(private readonly clinicalRecordService: ClinicalRecordService) {}

  @Post(':patientId/radiology/annotations')
  async saveAnnotations(
    @Param('patientId') patientId: string,
    @Body() saveAnnotationDto: SaveAnnotationDto,
  ) {
    const { imageId, annotations } = saveAnnotationDto;
    return this.clinicalRecordService.createSpecialtyRecord(
      patientId,
      'RADIOLOGY',
      { imageId, annotations },
    );
  }

  @Get(':patientId/radiology/annotations/:imageId')
  async getAnnotations(
    @Param('patientId') patientId: string,
    @Param('imageId') imageId: string,
  ) {
    const records = await this.clinicalRecordService.getPatientRecords(patientId);
    
    // Filtre les dossiers RADIOLOGY et trouve ceux qui correspondent à l'imageId
    const radiologyRecords = records.filter(
      (record) => 
        record.specialty === 'RADIOLOGY' && 
        record.data && 
        (record.data as Record<string, unknown>).imageId === imageId
    );

    // Si aucun record n'est trouvé, on retourne null ou un objet vide
    if (radiologyRecords.length === 0) {
      return null;
    }

    // Trie par date de création décroissante (du plus récent au plus ancien)
    // On suppose que la DB gère createdAt (Schema options: timestamps: true)
    radiologyRecords.sort((a, b) => {
      const dateA = (a as unknown as { createdAt: Date }).createdAt?.getTime() || 0;
      const dateB = (b as unknown as { createdAt: Date }).createdAt?.getTime() || 0;
      return dateB - dateA;
    });

    // Retourne le plus récent
    const latestRecord = radiologyRecords[0];
    return (latestRecord.data as Record<string, unknown>).annotations;
  }
}
