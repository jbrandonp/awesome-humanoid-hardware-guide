import {
  Patient,
  Visit,
  Vital,
  CatalogMedication,
  CatalogDiagnostic,
  Prescription,
  DrugContraindication,
} from './databaseModels';

describe('WatermelonDB Models', () => {
  describe('Patient Model', () => {
    it('should have the correct static table name', () => {
      expect(Patient.table).toBe('patients');
    });

    it('should be defined as a class', () => {
      expect(typeof Patient).toBe('function');
    });
  });

  describe('Visit Model', () => {
    it('should have the correct static table name', () => {
      expect(Visit.table).toBe('visits');
    });

    it('should be defined as a class', () => {
      expect(typeof Visit).toBe('function');
    });
  });

  describe('Vital Model', () => {
    it('should have the correct static table name', () => {
      expect(Vital.table).toBe('vitals');
    });

    it('should be defined as a class', () => {
      expect(typeof Vital).toBe('function');
    });
  });

  describe('CatalogMedication Model', () => {
    it('should have the correct static table name', () => {
      expect(CatalogMedication.table).toBe('catalog_medications');
    });

    it('should be defined as a class', () => {
      expect(typeof CatalogMedication).toBe('function');
    });
  });

  describe('CatalogDiagnostic Model', () => {
    it('should have the correct static table name', () => {
      expect(CatalogDiagnostic.table).toBe('catalog_diagnostics');
    });

    it('should be defined as a class', () => {
      expect(typeof CatalogDiagnostic).toBe('function');
    });
  });

  describe('Prescription Model', () => {
    it('should have the correct static table name', () => {
      expect(Prescription.table).toBe('prescriptions');
    });

    it('should be defined as a class', () => {
      expect(typeof Prescription).toBe('function');
    });
  });

  describe('DrugContraindication Model', () => {
    it('should have the correct static table name', () => {
      expect(DrugContraindication.table).toBe('drug_contraindications');
    });

    it('should be defined as a class', () => {
      expect(typeof DrugContraindication).toBe('function');
    });
  });
});
