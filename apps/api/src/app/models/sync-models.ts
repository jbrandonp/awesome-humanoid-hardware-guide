import { z } from 'zod';

const DateOrStringSchema = z.union([
  z.string().datetime(),
  z.date()
]).transform(val => val instanceof Date ? val.toISOString() : val);

export const PatientSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: DateOrStringSchema,
  _status: z.enum(['synced', 'created', 'updated', 'deleted']),
  deleted_at: DateOrStringSchema.nullable(),
});

export type PatientDto = z.infer<typeof PatientSchema>;

export const VisitSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  date: DateOrStringSchema,
  notes: z.string(),
  _status: z.enum(['synced', 'created', 'updated', 'deleted']),
  deleted_at: DateOrStringSchema.nullable(),
});

export type VisitDto = z.infer<typeof VisitSchema>;

export const VitalsSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  bloodPressure: z.string().optional().nullable(),
  heartRate: z.number().optional().nullable(),
  temperature: z.number().optional().nullable(),
  recordedAt: DateOrStringSchema,
  _status: z.enum(['synced', 'created', 'updated', 'deleted']),
  deleted_at: DateOrStringSchema.nullable(),
});

export type VitalsDto = z.infer<typeof VitalsSchema>;

export const PrescriptionSchema = z.object({
  id: z.string().uuid(),
  visitId: z.string().uuid(),
  patientId: z.string().uuid(),
  medicationName: z.string().min(1),
  dosage: z.string().min(1),
  instructions: z.string().optional().nullable(),
  prescribedAt: DateOrStringSchema,
  _status: z.enum(['synced', 'created', 'updated', 'deleted']),
  deleted_at: DateOrStringSchema.nullable(),
});

export type PrescriptionDto = z.infer<typeof PrescriptionSchema>;

export const DualSignOffSchema = z.object({
  primaryUserId: z.string().uuid(),
  secondaryPin: z.string().min(4).max(8).optional(),
  secondaryBadgeId: z.string().min(1).optional(),
  patientId: z.string().uuid(),
  medicationName: z.string().min(1),
  dosage: z.string().min(1),
  timestamp: DateOrStringSchema,
  offlineHash: z.string().optional(),
}).refine(data => data.secondaryPin || data.secondaryBadgeId, {
  message: "Either PIN or Badge ID must be provided for secondary sign-off",
});

export type DualSignOffDto = z.infer<typeof DualSignOffSchema>;