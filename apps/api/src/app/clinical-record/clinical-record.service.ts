import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClinicalRecord, ClinicalRecordDocument } from './clinical-record.schema';

@Injectable()
export class ClinicalRecordService {
  private readonly logger = new Logger(ClinicalRecordService.name);

  constructor(
    @InjectModel(ClinicalRecord.name) private recordModel: Model<ClinicalRecordDocument>,
  ) { }

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

  // DPDPA Async Anonymization (Soft Delete & Pseudonymization)
  async anonymizePatientRecords(patientId: string): Promise<number> {
    this.logger.warn(`[DPDPA] ANONYMISATION ASYNCHRONE des dossiers dynamiques MongoDB pour le patient ${patientId}`);
    const records = await this.recordModel.find({ patientId }).exec();
    let updatedCount = 0;
    const operations = [];

    for (const record of records) {
      if (!record.data) continue;

      let hasModifications = false;
      const dataObj = record.data;

      // Anonymisation des données dynamiques (noms et dates)
      for (const key of Object.keys(dataObj)) {
        if (key.toLowerCase().includes('name') || key.toLowerCase().includes('firstname') || key.toLowerCase().includes('lastname')) {
          dataObj[key] = `ANON-${randomUUID()}`;
          hasModifications = true;
        } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('dob') || key.toLowerCase().includes('birth')) {
          const dateVal = new Date(dataObj[key] as string | number);
          if (!isNaN(dateVal.getTime())) {
            dateVal.setDate(dateVal.getDate() + 10); // Shift date par ex de 10 jours
            dataObj[key] = dateVal.toISOString();
            hasModifications = true;
          }
        }
      }

      if (hasModifications) {
        operations.push({
          updateOne: {
            filter: { _id: record._id },
            update: {
              $set: {
                data: dataObj,
                status: 'deleted',
                deletedAt: new Date()
              }
            }
          }
        });
        updatedCount++;
      }
    }

    if (operations.length > 0) {
      await this.recordModel.bulkWrite(operations as any);
    }

    return updatedCount;
  }
}
