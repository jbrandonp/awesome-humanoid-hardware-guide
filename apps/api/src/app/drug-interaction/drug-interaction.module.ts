import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecord, ClinicalRecordSchema } from '../clinical-record/clinical-record.schema';
import { DrugInteractionController } from './drug-interaction.controller';
import { DrugInteractionService } from './drug-interaction.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ClinicalRecord.name, schema: ClinicalRecordSchema }]),
    PrismaModule,
  ],
  controllers: [DrugInteractionController],
  providers: [DrugInteractionService],
})
export class DrugInteractionModule {}
