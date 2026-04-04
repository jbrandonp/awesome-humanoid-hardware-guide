import { describe, it, expect } from 'vitest';
import { FilterCriteria, EpidemiologyRecord, processEpidemiologyData } from './epidemiology.worker';

describe('epidemiology.worker', () => {
  it('should correctly filter records exactly on startDate and endDate boundaries in UTC', () => {
    const records: EpidemiologyRecord[] = [
      { id: '1', date: '2026-04-01T00:00:00.000Z', age: 30, specialty: 'Cardiology', icd10: 'I10' },
      { id: '2', date: '2026-04-01T12:00:00.000Z', age: 35, specialty: 'Cardiology', icd10: 'I10' },
      { id: '3', date: '2026-04-01T23:59:59.000Z', age: 40, specialty: 'Cardiology', icd10: 'I10' },
      { id: '4', date: '2026-03-31T23:59:59.000Z', age: 45, specialty: 'Cardiology', icd10: 'I10' }, // Before
      { id: '5', date: '2026-04-02T00:00:00.000Z', age: 50, specialty: 'Cardiology', icd10: 'I10' }, // After
    ];

    const filters: FilterCriteria = {
      startDate: '2026-04-01',
      endDate: '2026-04-01',
      minAge: null,
      maxAge: null,
      specialty: null,
      icd10: null,
    };

    const result = processEpidemiologyData(records, filters);

    // We expect 3 records: those strictly on 2026-04-01 regardless of time
    expect(result.totalCases).toBe(3);

    // The timeline data should aggregate all 3 cases under '2026-04-01'
    expect(result.timelineData).toEqual([{ date: '2026-04-01', cases: 3 }]);
  });
});
