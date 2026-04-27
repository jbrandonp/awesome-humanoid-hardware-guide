import Fuse from 'fuse.js';
import medicalDict from '../i18n/medical_dict.json';

export interface PosologyTranslations {
  [languageCode: string]: string;
}

export class PosologyTranslatorService {
  private fuse: Fuse<{ key: string; translations: PosologyTranslations }>;
  private dictionaryEntries: { key: string; translations: PosologyTranslations }[];

  constructor() {
    // Transform dictionary object into an array of objects for Fuse.js
    this.dictionaryEntries = Object.entries(medicalDict).map(([key, translations]) => ({
      key,
      translations: translations as PosologyTranslations,
    }));

    // Initialize Fuse with the dictionary entries
    // We search based on the 'key' (the original French posology string)
    this.fuse = new Fuse(this.dictionaryEntries, {
      keys: ['key'],
      threshold: 0.4, // Threshold for fuzzy matching (0.0 = perfect match, 1.0 = match anything)
      includeScore: true,
    });
  }

  /**
   * Translates a given posology string into regional languages.
   * Performs a local fuzzy search against the medical dictionary.
   * 
   * @param posology The structured prescription string (e.g., "1 comprimé matin et soir après le repas")
   * @returns An object containing the translations, or null if no confident match is found.
   */
  public translate(posology: string): PosologyTranslations | null {
    if (!posology || posology.trim() === '') {
      return null;
    }

    const results = this.fuse.search(posology);

    // If we have a match, return its translations
    if (results.length > 0) {
      // The first result is the closest match based on the score
      return results[0].item.translations;
    }

    return null;
  }
}
