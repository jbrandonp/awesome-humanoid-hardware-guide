import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import { schema } from '@systeme-sante/models';
import {
  Patient,
  Visit,
  Vital,
  Prescription,
  MedicationAdministration,
  ClinicalIncident,
} from '@systeme-sante/models';

const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false, // Recommended setting LokiJS to false for electron/tauri without specific worker config
  useIncrementalIndexedDB: true,

  onQuotaExceededError: (error) => {
    console.error('Database Quota Exceeded:', error);
  },
  onSetUpError: (error) => {
    console.error('Database Setup Error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Patient, Visit, Vital, Prescription, MedicationAdministration, ClinicalIncident],
});
