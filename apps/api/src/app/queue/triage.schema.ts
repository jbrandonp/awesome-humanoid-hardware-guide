import { z } from 'zod';

export const TriageInputSchema = z.object({
  age: z.number().min(0).max(120, 'Age must be between 0 and 120'),
  spO2: z.number().min(0).max(100, 'SpO2 must be between 0 and 100'),
  heartRate: z.number().min(0).max(300, 'Heart rate must be between 0 and 300'),
  temperature: z.number().min(20).max(45, 'Temperature must be between 20 and 45'),
  systolicBP: z.number().min(0).max(300, 'Systolic BP must be between 0 and 300'),
  diastolicBP: z.number().min(0).max(200, 'Diastolic BP must be between 0 and 200'),
  painScale: z.number().min(0).max(10, 'Pain scale must be between 0 and 10'),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  estimatedResources: z.number().min(0, 'Estimated resources must be 0 or greater'),
});

export type TriageInput = z.infer<typeof TriageInputSchema>;

export type TriageResult = {
  score: number; // 1 to 5
};
