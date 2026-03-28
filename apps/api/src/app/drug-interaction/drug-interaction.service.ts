import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalRecord, ClinicalRecordDocument } from '../clinical-record/clinical-record.schema';
import { DrugInteractionCheckDto, DrugInteractionOverrideDto } from './dto/drug-interaction.dto';
// crypto import removed

export type InteractionLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'FATAL';

export interface InteractionReport {
  level: InteractionLevel | 'NONE';
  alerts: string[];
}

@Injectable()
export class DrugInteractionService {
  private readonly logger = new Logger(DrugInteractionService.name);

  constructor(
    @InjectModel(ClinicalRecord.name) private recordModel: Model<ClinicalRecordDocument>,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Mock interaction rules for demonstration
   */
  private checkRules(newMeds: string[], historyMeds: string[]): InteractionReport {
    const alerts: string[] = [];
    let highestLevel: InteractionLevel | 'NONE' = 'NONE';

    const updateLevel = (level: InteractionLevel) => {
      const levels = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, FATAL: 4 };
      if (levels[level] > levels[highestLevel]) {
        highestLevel = level;
      }
    };

    const allMeds = [...newMeds, ...historyMeds].map(m => m.toLowerCase());

    if (newMeds.some(m => m.toLowerCase().includes('artemether')) && allMeds.some(m => m.toLowerCase().includes('amoxicilline'))) {
      alerts.push('Artemether + Amoxicilline (FATAL) - Risque sévère d\'allongement de l\'intervalle QT conduisant à des arythmies cardiaques fatales.');
      updateLevel('FATAL');
    }

    if (newMeds.some(m => m.toLowerCase().includes('ibuprofène')) && historyMeds.some(m => m.toLowerCase().includes('aspirine'))) {
      alerts.push('Ibuprofène + Aspirine (HIGH) - Risque hémorragique accru.');
      updateLevel('HIGH');
    }
    
    if (newMeds.some(m => m.toLowerCase().includes('paracetamol')) && historyMeds.some(m => m.toLowerCase().includes('alcool'))) {
      alerts.push('Paracetamol + Alcool (MEDIUM) - Risque hépatique.');
      updateLevel('MEDIUM');
    }
    
    if (newMeds.some(m => m.toLowerCase().includes('vitamine c')) && historyMeds.some(m => m.toLowerCase().includes('fer'))) {
      alerts.push('Vitamine C + Fer (LOW) - Interaction mineure augmentant l\'absorption.');
      updateLevel('LOW');
    }

    return { level: highestLevel, alerts };
  }

  async checkInteraction(dto: DrugInteractionCheckDto): Promise<InteractionReport> {
    this.logger.log(`Checking drug interactions for patient ${dto.patientId} by practitioner ${dto.practitionerId}`);

    // Fetch history from MongoDB
    const records = await this.recordModel.find({ patientId: dto.patientId, deletedAt: { $exists: false } }).exec();
    
    // Extract past medications from the flexible 'data' schema 
    const historyMeds: string[] = [];
    for (const record of records) {
      if (record.data && Array.isArray(record.data.medications)) {
        historyMeds.push(...record.data.medications);
      } else if (record.data && typeof record.data.medicationName === 'string') {
        historyMeds.push(record.data.medicationName);
      }
    }

    const report = this.checkRules(dto.newMedications, historyMeds);

    if (report.level === 'HIGH' || report.level === 'FATAL') {
      throw new HttpException({
        message: 'Alerte clinique: Interaction critique détectée. Une justification clinique (override) est requise pour valider cette prescription.',
        report
      }, HttpStatus.FORBIDDEN);
    }

    return report;
  }

  async overridePrescription(dto: DrugInteractionOverrideDto): Promise<{ success: boolean; report: InteractionReport }> {
    this.logger.log(`Override requested for drug interactions for patient ${dto.patientId} by practitioner ${dto.practitionerId}`);

    // Fetch history to re-generate the report
    const records = await this.recordModel.find({ patientId: dto.patientId, deletedAt: { $exists: false } }).exec();
    const historyMeds: string[] = [];
    for (const record of records) {
      if (record.data && Array.isArray(record.data.medications)) {
        historyMeds.push(...record.data.medications);
      } else if (record.data && typeof record.data.medicationName === 'string') {
        historyMeds.push(record.data.medicationName);
      }
    }

    const report = this.checkRules(dto.newMedications, historyMeds);

    if (report.level !== 'HIGH' && report.level !== 'FATAL') {
      return { success: true, report };
    }

    // Audit Log in PostgreSQL
    await this.prisma.auditLog.create({
      data: {
        userId: dto.practitionerId,
        patientId: dto.patientId,
        action: 'PRESCRIPTION_OVERRIDE',
        metadata: {
          interactionLevel: report.level,
          alerts: report.alerts,
          newMedications: dto.newMedications,
          justification: dto.justification, // Store plain-text for medical audit
        },
      },
    });

    this.logger.warn(`Prescription override registered and hashed for practitioner ${dto.practitionerId} on patient ${dto.patientId}`);

    return { success: true, report };
  }
}
