const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.spec.ts';
let content = fs.readFileSync(filePath, 'utf8');

const importReplacement = `import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HighAlertMedicationService } from './HighAlertMedicationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConnectionStore } from '../stores/connection.store';`;

content = content.replace(
  "import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';\nimport { HighAlertMedicationService } from './HighAlertMedicationService';\nimport AsyncStorage from '@react-native-async-storage/async-storage';",
  importReplacement
);

const mockStore = `vi.mock('../stores/connection.store', () => ({
  useConnectionStore: {
    getState: vi.fn(),
  },
}));`;

content = content.replace(
  "vi.mock('@react-native-async-storage/async-storage', () => ({",
  `${mockStore}\n\nvi.mock('@react-native-async-storage/async-storage', () => ({`
);

const beforeEachSetup = `    (HighAlertMedicationService as any).isSyncing = false;

    // Default mock for useConnectionStore to be CONNECTED
    vi.mocked(useConnectionStore.getState).mockReturnValue({
      status: 'CONNECTED',
      serverUrl: 'http://mock-server:3000',
      errorMessage: null,
      setStatus: vi.fn(),
      setServerUrl: vi.fn(),
      setError: vi.fn(),
      enableOfflineMode: vi.fn(),
      enableManualFallback: vi.fn(),
    });`;

content = content.replace(
  "    (HighAlertMedicationService as any).isSyncing = false;",
  beforeEachSetup
);

content = content.replace(
  /http:\/\/localhost:3000/g,
  'http://mock-server:3000'
);

const newTest = `
  it('should abort early if connection status is not CONNECTED', async () => {
    vi.mocked(useConnectionStore.getState).mockReturnValueOnce({
      status: 'OFFLINE_MODE',
      serverUrl: null,
      errorMessage: null,
      setStatus: vi.fn(),
      setServerUrl: vi.fn(),
      setError: vi.fn(),
      enableOfflineMode: vi.fn(),
      enableManualFallback: vi.fn(),
    });

    await HighAlertMedicationService.attemptSync();

    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect((HighAlertMedicationService as any).isSyncing).toBe(false);
  });

  it('should abort early if serverUrl is missing', async () => {
    vi.mocked(useConnectionStore.getState).mockReturnValueOnce({
      status: 'CONNECTED',
      serverUrl: null,
      errorMessage: null,
      setStatus: vi.fn(),
      setServerUrl: vi.fn(),
      setError: vi.fn(),
      enableOfflineMode: vi.fn(),
      enableManualFallback: vi.fn(),
    });

    await HighAlertMedicationService.attemptSync();

    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect((HighAlertMedicationService as any).isSyncing).toBe(false);
  });
`;

content = content.replace(
  "  it('should return early if queue string is null', async () => {",
  `${newTest}\n  it('should return early if queue string is null', async () => {`
);

fs.writeFileSync(filePath, content);
