import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import schema from '@systeme-sante/models/src/lib/schema';
import {
  Patient,
  Visit,
  Vital,
  Prescription,
} from '@systeme-sante/models/src/lib/databaseModels';

const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false, // Recommended setting LokiJS to false for electron/tauri without specific worker config
  useIncrementalIndexedDB: true,
  onIndexedDBVersionChange: () => {
    // Database was deleted in another browser tab
  },
  onQuotaExceededError: (error) => {
    // Browser ran out of disk space
  },
  onSetUpError: (error) => {
    // Database failed to load
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Patient, Visit, Vital, Prescription],
});
