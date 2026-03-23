import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClinicalRecord, ClinicalRecordDocument } from './clinical-record.schema';

@Injectable()
export class ClinicalRecordService {
  private readonly logger = new Logger(ClinicalRecordService.name);

  constructor(
    @InjectModel(ClinicalRecord.name) private recordModel: Model<ClinicalRecordDocument>,
  ) {}

  async createSpecialtyRecord(patientId: string, specialty: string, formData: any) {
    this.logger.log(`Création d'un dossier ${specialty} dynamique pour le patient ${patientId}`);
    const record = new this.recordModel({
      patientId,
      specialty,
      data: formData,
    });
    return record.save();
  }

  async getPatientRecords(patientId: string) {
    // Exclusion des tombstones (deletedAt: { $exists: false })
    return this.recordModel.find({ patientId, deletedAt: { $exists: false } }).exec();
  }

  // Tombstone Model
  async deleteRecord(recordId: string) {
    this.logger.log(`Suppression logique (Tombstone) du record MongoDB ${recordId}`);
    return this.recordModel.findByIdAndUpdate(recordId, {
      deletedAt: new Date(),
      status: 'deleted'
    });
  }

  // DPDPA Hard Delete Cascade
  async hardDeletePatientRecords(patientId: string): Promise<number> {
    this.logger.warn(`[DPDPA] PURGE DÉFINITIVE de tous les dossiers dynamiques MongoDB pour le patient ${patientId}`);
    const result = await this.recordModel.deleteMany({ patientId }).exec();
    return result.deletedCount || 0;
  }
}
