import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, AnyBulkWriteOperation } from 'mongoose';
import { ClinicalRecord, ClinicalRecordDocument } from './clinical-record.schema';

@Injectable()
export class ClinicalRecordService {
  private readonly logger = new Logger(ClinicalRecordService.name);

  constructor(
    @InjectModel(ClinicalRecord.name) private recordModel: Model<ClinicalRecordDocument>,
  ) { }

  async createSpecialtyRecord(patientId: string, specialty: string, formData: unknown): Promise<ClinicalRecordDocument> {
    this.logger.log(`Création d'un dossier ${specialty} dynamique pour le patient ${patientId}`);
    const record = new this.recordModel({
      patientId,
      specialty,
      data: formData,
    });
    return record.save();
  }

  async getPatientRecords(patientId: string): Promise<ClinicalRecordDocument[]> {
    // Exclusion des tombstones (deletedAt: { $exists: false })
    return this.recordModel.find({ patientId, deletedAt: { $exists: false } }).exec();
  }

  async getPatientRecordById(recordId: string): Promise<ClinicalRecordDocument | null> {
    return this.recordModel.findById(recordId).exec();
  }

  // Tombstone Model
  async deleteRecord(recordId: string): Promise<ClinicalRecordDocument | null> {
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
    
    // Pseudonymization of the patientId itself for the link
    const pseudoId = `PSEUDO-${randomUUID()}`;
    let updatedCount = 0;
    const batchSize = 100;
    let operations: AnyBulkWriteOperation[] = [];

    // Use cursor for memory efficiency with large datasets
    const cursor = this.recordModel.find({ patientId }).cursor();

    for (let record = await cursor.next(); record != null; record = await cursor.next()) {
      if (!record.data) continue;

      const dataObj = JSON.parse(JSON.stringify(record.data)); // Deep clone to avoid mutation issues
      // Anonymization of dynamic data (names and dates)
      for (const key of Object.keys(dataObj)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('name') || lowerKey.includes('firstname') || lowerKey.includes('lastname') || lowerKey.includes('contact') || lowerKey.includes('phone') || lowerKey.includes('email')) {
          dataObj[key] = `ANON-${randomUUID().substring(0, 8)}`;
        } else if (lowerKey.includes('date') || lowerKey.includes('dob') || lowerKey.includes('birth')) {
          const dateVal = new Date(dataObj[key] as string | number);
          if (!isNaN(dateVal.getTime())) {
            // Strategic Date Shifting (DPDPA compliance)
            dateVal.setFullYear(dateVal.getFullYear() - 1); 
            dataObj[key] = dateVal.toISOString();
          }
        }
      }

      operations.push({
        updateOne: {
          filter: { _id: record._id },
          update: {
            $set: {
              patientId: pseudoId, // Disconnect from original patientId
              data: dataObj,
              status: 'deleted',
              deletedAt: new Date(),
              isAnonymized: true
            }
          }
        }
      });
      updatedCount++;

      if (operations.length >= batchSize) {
        await this.recordModel.bulkWrite(operations);
        operations = [];
      }
    }

    if (operations.length > 0) {
      await this.recordModel.bulkWrite(operations);
    }

    return updatedCount;
  }
}
