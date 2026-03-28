export interface Medication {
  id: string;
  name: string;
  dosage: string;
  instructions?: string;
}

export interface ClinicalProtocol {
  id: string;
  name: string;
  medications: Medication[];
}

export class ClinicalProtocolManager {
  private static protocols: ClinicalProtocol[] = [
    {
      id: 'proto-palu',
      name: 'Protocole Paludisme',
      medications: [
        {
          id: 'med-1',
          name: 'Test de Diagnostic Rapide (TDR) Paludisme',
          dosage: '1 test',
          instructions: 'À réaliser immédiatement au cabinet',
        },
        {
          id: 'med-2',
          name: 'Artéméther-Luméfantrine',
          dosage: '80/480 mg',
          instructions: '1 comprimé matin et soir pendant 3 jours',
        },
        {
          id: 'med-3',
          name: 'Paracétamol',
          dosage: '1000 mg',
          instructions: '1 comprimé toutes les 6 heures si fièvre',
        },
      ],
    },
    {
      id: 'proto-hta',
      name: 'Protocole HTA Simple',
      medications: [
        {
          id: 'med-4',
          name: 'Amlodipine',
          dosage: '5 mg',
          instructions: '1 comprimé par jour',
        },
      ],
    },
  ];

  static getAvailableProtocols(): ClinicalProtocol[] {
    return this.protocols;
  }

  static getProtocolById(id: string): ClinicalProtocol | undefined {
    return this.protocols.find((p) => p.id === id);
  }

  static createProtocol(name: string, medications: Medication[]): ClinicalProtocol {
    const newProtocol: ClinicalProtocol = {
      id: `proto-custom-${Date.now()}`,
      name,
      medications: [...medications],
    };
    
    this.protocols.push(newProtocol);
    return newProtocol;
  }

  static shareProtocol(protocol: ClinicalProtocol): void {
    // Zero Cloud Logs Policy: We log locally to simulate P2P / CRDT sharing.
    // In a real application, this would broadcast via the local network or sync via CRDT.
    console.log(`[P2P/CRDT Simulation] Broadcasting protocol: ${protocol.name}`);
  }

  static mergeProtocol(
    currentMedications: Medication[],
    protocol: ClinicalProtocol
  ): Medication[] {
    const merged = [...currentMedications];

    for (const protoMed of protocol.medications) {
      const existingIndex = merged.findIndex(
        (m) => m.name.toLowerCase() === protoMed.name.toLowerCase()
      );

      if (existingIndex !== -1) {
        // Intelligent merge: replace with protocol dosage/instructions if present
        merged[existingIndex] = {
          ...merged[existingIndex],
          dosage: protoMed.dosage,
          instructions: protoMed.instructions,
        };
      } else {
        // Add new medication
        // Ensure unique ID
        merged.push({
          ...protoMed,
          id: `${protoMed.id}-${Date.now()}`,
        });
      }
    }

    return merged;
  }
}
