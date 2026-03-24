import { calculateTriageScore } from './triage.algorithm';
import { TriageInputSchema } from './triage.schema';

describe('Triage Algorithm (ESI)', () => {
  describe('Triage Input Validation (Zod)', () => {
    it('should validate correct input', () => {
      const result = TriageInputSchema.safeParse({
        age: 30,
        spO2: 98,
        heartRate: 80,
        temperature: 37,
        systolicBP: 120,
        diastolicBP: 80,
        painScale: 2,
        chiefComplaint: 'Minor cut',
        estimatedResources: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should fail validation on invalid vital signs (e.g. SpO2 > 100)', () => {
      const result = TriageInputSchema.safeParse({
        age: 30,
        spO2: 105, // Invalid
        heartRate: 80,
        temperature: 37,
        systolicBP: 120,
        diastolicBP: 80,
        painScale: 2,
        chiefComplaint: 'Minor cut',
        estimatedResources: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('SpO2 must be between 0 and 100');
      }
    });
  });

  describe('calculateTriageScore', () => {
    const baseInput = {
      age: 30,
      spO2: 98,
      heartRate: 80,
      temperature: 37,
      systolicBP: 120,
      diastolicBP: 80,
      painScale: 2,
      chiefComplaint: 'Checkup',
      estimatedResources: 0,
    };

    it('should return ESI 1 for immediate life-saving intervention (e.g. SpO2 < 90)', () => {
      const input = { ...baseInput, spO2: 85 };
      expect(calculateTriageScore(input)).toBe(1);
    });

    it('should return ESI 1 for shock (systolicBP < 70)', () => {
      const input = { ...baseInput, systolicBP: 65 };
      expect(calculateTriageScore(input)).toBe(1);
    });

    it('should return ESI 2 for severe pain (painScale >= 7)', () => {
      const input = { ...baseInput, painScale: 8, estimatedResources: 1 };
      expect(calculateTriageScore(input)).toBe(2);
    });

    it('should return ESI 2 for high-risk chief complaints (e.g. chest pain)', () => {
      const input = { ...baseInput, chiefComplaint: 'Severe chest pain' };
      expect(calculateTriageScore(input)).toBe(2);
    });

    it('should return ESI 5 for 0 resources required', () => {
      const input = { ...baseInput, estimatedResources: 0 };
      expect(calculateTriageScore(input)).toBe(5);
    });

    it('should return ESI 4 for 1 resource required', () => {
      const input = { ...baseInput, estimatedResources: 1 };
      expect(calculateTriageScore(input)).toBe(4);
    });

    it('should return ESI 3 for >1 resources required with normal vitals', () => {
      const input = { ...baseInput, estimatedResources: 2 };
      expect(calculateTriageScore(input)).toBe(3);
    });

    it('should upgrade ESI 3 to ESI 2 for adult danger zone vitals (heartRate > 100)', () => {
      const input = { ...baseInput, estimatedResources: 2, heartRate: 110 }; // Adult > 100 HR
      expect(calculateTriageScore(input)).toBe(2);
    });

    it('should upgrade ESI 3 to ESI 2 for pediatric danger zone vitals (age 2, heartRate > 140)', () => {
      const input = { ...baseInput, age: 2, estimatedResources: 2, heartRate: 150 }; // Child 1-3yr > 140 HR
      expect(calculateTriageScore(input)).toBe(2);
    });

    it('should NOT upgrade ESI 3 to ESI 2 for pediatric safe vitals (age 2, heartRate 130)', () => {
      const input = { ...baseInput, age: 2, estimatedResources: 2, heartRate: 130 };
      expect(calculateTriageScore(input)).toBe(3);
    });
  });
});
