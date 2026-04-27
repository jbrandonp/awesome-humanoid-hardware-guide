import { describe, it, expect, beforeEach } from 'vitest';
import { PosologyTranslatorService } from './posology-translator.service';

describe('PosologyTranslatorService', () => {
  let service: PosologyTranslatorService;

  beforeEach(() => {
    service = new PosologyTranslatorService();
  });

  it('should return null for empty or whitespace strings', () => {
    expect(service.translate('')).toBeNull();
    expect(service.translate('   ')).toBeNull();
  });

  it('should match the exact posology string "1 comprimé matin et soir après le repas"', () => {
    const result = service.translate('1 comprimé matin et soir après le repas');
    expect(result).not.toBeNull();
    expect(result?.en).toBe('1 tablet morning and evening after meals');
    expect(result?.hi).toBe('भोजन के बाद सुबह और शाम 1 गोली');
    expect(result?.gu).toBe('જમ્યા પછી સવારે અને સાંજે 1 ગોળી');
    // Ensure all 15 languages are present
    const languages = Object.keys(result!);
    expect(languages.length).toBe(15);
  });

  it('should fuzzy match posology strings with slight typos', () => {
    // "comprimé" written without accent and "apres" without accent
    const result = service.translate('1 comprime matin et soir apres le repas');
    expect(result).not.toBeNull();
    expect(result?.en).toBe('1 tablet morning and evening after meals');
    
    // "1 cp" abbreviation mapped to the 3 days rule 
    const result2 = service.translate('1 cp matin et soir pendant 3 jours');
    expect(result2).not.toBeNull();
    expect(result2?.en).toBe('1 tablet morning and evening for 3 days');
  });

  it('should return null if no good match is found in the dictionary', () => {
    // Completely unrelated string should return null given the threshold 0.4
    const result = service.translate('take completely different medication entirely unknown');
    expect(result).toBeNull();
  });
});
