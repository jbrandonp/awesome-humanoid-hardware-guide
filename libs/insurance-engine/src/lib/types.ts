import { z } from 'zod';

export const LineItemSchema = z.object({
  id: z.string(),
  code: z.string(), // CPT/CCAM
  diagnosisCode: z.string(), // ICD-10
  unitPriceCents: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
});

export type LineItem = z.infer<typeof LineItemSchema>;

export const InsurancePolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  rules: z.object({
    exclusions: z.array(z.string()).default([]), // Array of ICD-10 codes
    deductibleCents: z.number().int().nonnegative().default(0), // Amount left to pay by the patient
    copayCents: z.number().int().nonnegative().default(0), // Fixed amount per line item (or visit)
    coinsurance: z.number().min(0).max(100).default(100), // Percentage of coverage (0-100)
    capsCents: z.object({
      perItem: z.number().int().nonnegative().optional(),
      annual: z.number().int().nonnegative().optional(),
    }).optional(),
  }),
});

export type InsurancePolicy = z.infer<typeof InsurancePolicySchema>;

export interface RuleExecutionTrace {
  rule: 'exclusion' | 'deductible' | 'copay' | 'coinsurance' | 'cap' | 'cascade';
  applied: boolean;
  amountCoveredCents: number;
  amountPatientCents: number;
  description: string;
}

export interface EOBLineItem {
  lineItemId: string;
  originalTotalCents: number;
  coveredCents: number;
  patientResponsibilityCents: number;
  traces: RuleExecutionTrace[];
}

export interface ExplanationOfBenefits {
  totalOriginalCents: number;
  totalCoveredCents: number;
  totalPatientResponsibilityCents: number;
  lines: EOBLineItem[];
}
