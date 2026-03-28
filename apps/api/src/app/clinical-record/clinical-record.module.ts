import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicalRecordController } from './clinical-record.controller';
import { ClinicalRecord, ClinicalRecordSchema } from './clinical-record.schema';
import { ClinicalRecordService } from './clinical-record.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ClinicalRecord.name, schema: ClinicalRecordSchema }]),
  ],
  controllers: [ClinicalRecordController],
  providers: [ClinicalRecordService],
  exports: [ClinicalRecordService]
})
export class ClinicalRecordModule {}
