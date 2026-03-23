import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from '@systeme-sante/models/src/lib/schema';
import {
  Patient,
  Visit,
  Vital,
  Prescription,
  DrugContraindication,
  CatalogMedication,
  CatalogDiagnostic,
} from '@systeme-sante/models/src/lib/databaseModels';

const adapter = new SQLiteAdapter({
  schema,
  // (You might want to comment it out once database is stable)
  jsi: false /* Set true for fast JSI based sqlite adapter on hermes */,
  onSetUpError: (error) => {
    // Database failed to load
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    Patient,
    Visit,
    Vital,
    Prescription,
    DrugContraindication,
    CatalogMedication,
    CatalogDiagnostic,
  ],
});
