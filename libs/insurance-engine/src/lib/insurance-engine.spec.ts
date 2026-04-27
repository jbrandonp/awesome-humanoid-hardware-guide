import { InsuranceEngine } from './insurance-engine';
import { InsurancePolicy, LineItem } from './types';

describe('InsuranceEngine', () => {
  let engine: InsuranceEngine;

  beforeEach(() => {
    engine = new InsuranceEngine();
  });

  it('a) should fully cover a 100% covered item', () => {
    const item: LineItem = {
      id: 'item-1',
      code: 'CPT-123',
      diagnosisCode: 'A00',
      unitPriceCents: 5000,
      quantity: 1,
    };

    const policy: InsurancePolicy = {
      id: 'pol-1',
      name: 'Primary',
      rules: {
        exclusions: [],
        deductibleCents: 0,
        copayCents: 0,
        coinsurance: 100,
      },
    };

    const eob = engine.evaluate([item], [policy]);

    expect(eob.totalOriginalCents).toBe(5000);
    expect(eob.totalCoveredCents).toBe(5000);
    expect(eob.totalPatientResponsibilityCents).toBe(0);
    expect(eob.lines[0].coveredCents).toBe(5000);
  });

  it('b) should handle partially covered item hitting the max cap', () => {
    const item: LineItem = {
      id: 'item-1',
      code: 'CPT-123',
      diagnosisCode: 'A00',
      unitPriceCents: 10000,
      quantity: 1,
    };

    const policy: InsurancePolicy = {
      id: 'pol-1',
      name: 'Primary',
      rules: {
        exclusions: [],
        deductibleCents: 0,
        copayCents: 0,
        coinsurance: 100,
        capsCents: {
          perItem: 8000,
        },
      },
    };

    const eob = engine.evaluate([item], [policy]);

    expect(eob.totalOriginalCents).toBe(10000);
    expect(eob.totalCoveredCents).toBe(8000);
    expect(eob.totalPatientResponsibilityCents).toBe(2000);
    expect(eob.lines[0].traces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'cap',
          applied: true,
          amountCoveredCents: 8000,
          amountPatientCents: 2000,
        }),
      ])
    );
  });

  it('c) should totally reject an item due to ICD-10 exclusion', () => {
    const item: LineItem = {
      id: 'item-1',
      code: 'CPT-123',
      diagnosisCode: 'EXC-10', // Excluded
      unitPriceCents: 5000,
      quantity: 1,
    };

    const policy: InsurancePolicy = {
      id: 'pol-1',
      name: 'Primary',
      rules: {
        exclusions: ['EXC-10'],
        deductibleCents: 0,
        copayCents: 0,
        coinsurance: 100,
      },
    };

    const eob = engine.evaluate([item], [policy]);

    expect(eob.totalOriginalCents).toBe(5000);
    expect(eob.totalCoveredCents).toBe(0);
    expect(eob.totalPatientResponsibilityCents).toBe(5000);
    expect(eob.lines[0].traces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'exclusion',
          applied: true,
          amountCoveredCents: 0,
          amountPatientCents: 5000,
        }),
      ])
    );
  });

  it('d) should switch coverage mid-calculation due to annual deductible being met', () => {
    const items: LineItem[] = [
      {
        id: 'item-1',
        code: 'CPT-1',
        diagnosisCode: 'A00',
        unitPriceCents: 6000, // Meets deductible (5000) and leaves 1000 covered at 80% (800) -> patient pays 5000 + 200 = 5200. Covered: 800
        quantity: 1,
      },
      {
        id: 'item-2',
        code: 'CPT-2',
        diagnosisCode: 'A01',
        unitPriceCents: 2000, // Deductible already met. Covered at 80% (1600) -> patient pays 400. Covered: 1600
        quantity: 1,
      },
    ];

    const policy: InsurancePolicy = {
      id: 'pol-1',
      name: 'Primary',
      rules: {
        exclusions: [],
        deductibleCents: 5000,
        copayCents: 0,
        coinsurance: 80,
      },
    };

    const eob = engine.evaluate(items, [policy]);

    expect(eob.totalOriginalCents).toBe(8000);
    
    // Item 1
    expect(eob.lines[0].coveredCents).toBe(800);
    expect(eob.lines[0].patientResponsibilityCents).toBe(5200);
    
    // Item 2
    expect(eob.lines[1].coveredCents).toBe(1600);
    expect(eob.lines[1].patientResponsibilityCents).toBe(400);

    // Totals
    expect(eob.totalCoveredCents).toBe(2400);
    expect(eob.totalPatientResponsibilityCents).toBe(5600);
  });

  it('e) should calculate in cascade with primary and secondary insurance', () => {
    const item: LineItem = {
      id: 'item-1',
      code: 'CPT-123',
      diagnosisCode: 'A00',
      unitPriceCents: 10000,
      quantity: 1,
    };

    const primaryPolicy: InsurancePolicy = {
      id: 'pol-1',
      name: 'Primary',
      rules: {
        exclusions: [],
        deductibleCents: 2000, // Patient pays 2000. 8000 left
        copayCents: 0,
        coinsurance: 50, // Insurance pays 4000. Patient left with 4000
      },
    };

    // Primary leaves patient with 2000 (deductible) + 4000 (coinsurance difference) = 6000 responsibility.
    
    const secondaryPolicy: InsurancePolicy = {
      id: 'pol-2',
      name: 'Secondary',
      rules: {
        exclusions: [],
        deductibleCents: 0,
        copayCents: 1000, // Patient pays 1000. 5000 left
        coinsurance: 100, // Insurance pays 5000.
      },
    };

    const eob = engine.evaluate([item], [primaryPolicy, secondaryPolicy]);

    expect(eob.totalOriginalCents).toBe(10000);
    
    // Primary covered 4000
    // Secondary covered 5000
    // Total covered: 9000
    expect(eob.totalCoveredCents).toBe(9000);
    
    // Total patient responsibility: 10000 - 9000 = 1000 (the copay from secondary)
    expect(eob.totalPatientResponsibilityCents).toBe(1000);
  });
});
