import { z } from 'zod';

export const medicationAdministrationSchema = z.object({
  prescriptionId: z.string().uuid(),
  nurseId: z.string().uuid(),
  status: z.enum(['ADMINISTERED', 'REFUSED', 'OMITTED', 'PARTIAL']),
  dosageGiven: z.string().min(1),
  route: z.string().min(1),
  administeredAt: z.string().datetime(), // Or use z.date() if the input is converted
  isPrn: z.boolean().default(false),
  clinicalJustification: z.string().nullable().optional(),
  secondaryNursePin: z.string().optional(), // For High-Alert Medications
  secondaryNurseBadgeId: z.string().optional(), // For High-Alert Medications
}).refine(
  (data) => {
    if (data.isPrn) {
      return data.clinicalJustification && data.clinicalJustification.trim().length > 0;
    }
    return true;
  },
  {
    message: "A clinical justification is strictly required when administering a PRN (pro re nata) medication.",
    path: ["clinicalJustification"],
  }
);

export type CreateAdministrationDto = z.infer<typeof medicationAdministrationSchema>;
