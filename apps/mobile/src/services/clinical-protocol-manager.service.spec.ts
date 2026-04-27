import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClinicalProtocolManager, Medication, ClinicalProtocol } from './clinical-protocol-manager.service';

describe('ClinicalProtocolManager.mergeProtocol', () => {
  const mockDate = 1625097600000; // Fixed timestamp

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should merge a protocol into an empty list of medications', () => {
    const currentMedications: Medication[] = [];
    const protocol: ClinicalProtocol = {
      id: 'proto-1',
      name: 'Test Protocol',
      medications: [
        { id: 'med-1', name: 'Aspirin', dosage: '500mg', instructions: 'Take once' }
      ]
    };

    const result = ClinicalProtocolManager.mergeProtocol(currentMedications, protocol);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Aspirin');
    expect(result[0].id).toBe(`med-1-${mockDate}`);
    expect(result[0].dosage).toBe('500mg');
  });

  it('should add a new medication to an existing list', () => {
    const currentMedications: Medication[] = [
      { id: 'existing-1', name: 'Paracetamol', dosage: '1g' }
    ];
    const protocol: ClinicalProtocol = {
      id: 'proto-1',
      name: 'Test Protocol',
      medications: [
        { id: 'med-1', name: 'Aspirin', dosage: '500mg' }
      ]
    };

    const result = ClinicalProtocolManager.mergeProtocol(currentMedications, protocol);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Paracetamol');
    expect(result[1].name).toBe('Aspirin');
    expect(result[1].id).toBe(`med-1-${mockDate}`);
  });

  it('should update dosage and instructions for existing medications (case-insensitive)', () => {
    const currentMedications: Medication[] = [
      { id: 'existing-1', name: 'aspirin', dosage: '100mg', instructions: 'Old instructions' }
    ];
    const protocol: ClinicalProtocol = {
      id: 'proto-1',
      name: 'Test Protocol',
      medications: [
        { id: 'med-1', name: 'Aspirin', dosage: '500mg', instructions: 'New instructions' }
      ]
    };

    const result = ClinicalProtocolManager.mergeProtocol(currentMedications, protocol);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('existing-1'); // Keeps original ID
    expect(result[0].name).toBe('aspirin'); // Keeps original name (case)
    expect(result[0].dosage).toBe('500mg'); // Updated
    expect(result[0].instructions).toBe('New instructions'); // Updated
  });

  it('should preserve medications that are not in the protocol', () => {
    const currentMedications: Medication[] = [
      { id: 'med-stay', name: 'Keep Me', dosage: 'some' }
    ];
    const protocol: ClinicalProtocol = {
      id: 'proto-empty',
      name: 'Empty Protocol',
      medications: []
    };

    const result = ClinicalProtocolManager.mergeProtocol(currentMedications, protocol);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Keep Me');
  });

  it('should handle multiple medications in a protocol', () => {
    const currentMedications: Medication[] = [
      { id: 'med-1', name: 'Aspirin', dosage: '100mg' }
    ];
    const protocol: ClinicalProtocol = {
      id: 'proto-multi',
      name: 'Multi Protocol',
      medications: [
        { id: 'med-1-proto', name: 'Aspirin', dosage: '500mg' },
        { id: 'med-2-proto', name: 'Ibuprofen', dosage: '400mg' }
      ]
    };

    const result = ClinicalProtocolManager.mergeProtocol(currentMedications, protocol);

    expect(result).toHaveLength(2);
    expect(result.find(m => m.name === 'Aspirin')?.dosage).toBe('500mg');
    expect(result.find(m => m.name === 'Ibuprofen')?.dosage).toBe('400mg');
    expect(result.find(m => m.name === 'Ibuprofen')?.id).toBe(`med-2-proto-${mockDate}`);
  });
});
