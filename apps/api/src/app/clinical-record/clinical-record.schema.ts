import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ClinicalRecordDocument = ClinicalRecord & Document;

@Schema({ timestamps: true })
export class ClinicalRecord {
  @Prop({ required: true, index: true })
  patientId!: string;

  @Prop({ required: true })
  specialty!: string; // ex: PEDIATRICS, DERMATOLOGY, GYNECOLOGY

  // Le contenu dynamique du formulaire
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  data!: Record<string, unknown>;
  // Ex Pédiatrie : { headCircumference: 35, zScore: 0.5 }
  // Ex Dermato : { lesionType: 'macule', location: 'left-arm', imageAnnotationIds: [...] }

  @Prop({ default: 'created' })
  status!: string; // Pour la logique de Sync

  @Prop()
  deletedAt?: Date; // Tombstone Model
}

export const ClinicalRecordSchema = SchemaFactory.createForClass(ClinicalRecord);
