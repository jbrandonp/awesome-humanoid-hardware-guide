import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

// @ts-ignore
import schema from '@systeme-sante/models/src/lib/schema'
// @ts-ignore
import { Patient, Visit, Vital, Prescription, DrugContraindication, CatalogMedication, CatalogDiagnostic } from '@systeme-sante/models/src/lib/databaseModels'

import { SecurityManager } from './services/SecurityManager'

// We use a singleton and a Proxy to ensure backward compatibility for files
// performing synchronous imports like `import { database } from './database'`
let _databaseInstance: Database | null = null;

const createDatabaseInstance = async (): Promise<Database> => {
  if (_databaseInstance) return _databaseInstance;

  const encryptionKey = await SecurityManager.getEncryptionKey();

  const adapter = new SQLiteAdapter({
    schema,
    // Inject the key through the dbName option.
    // Our custom patches in WMDatabaseBridge.java and FMDatabase.m will intercept '?key='
    // extract it, and apply SQLCipher encryption on the database seamlessly.
    dbName: `systeme_sante?key=${encryptionKey}`,
    jsi: false, /* JSI needs custom native bindings to pass the key for SQLCipher, we use Async Bridge */
    onSetUpError: error => {
      // Database failed to load
      // No sensitive info logged
    }
  });

  _databaseInstance = new Database({
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

  return _databaseInstance;
};

// Initiate the async load immediately
let initializationPromise = createDatabaseInstance();

export const database = new Proxy({} as Database, {
  get: (target, prop) => {
    if (!_databaseInstance) {
      // In a real scenario, this would block until initialized or throw,
      // but WatermelonDB operations are mostly observable/async anyway.
      // For synchronous compatibility without top-level await:
      throw new Error("Database accessed before initialization completed.");
    }
    const value = (_databaseInstance as any)[prop];
    return typeof value === 'function' ? value.bind(_databaseInstance) : value;
  }
});

// Optionally export the promise for App.tsx to wait for readiness
export const initializeDatabase = () => initializationPromise;
