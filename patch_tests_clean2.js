const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.spec.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for store BEFORE HighAlertMedicationService import
content = content.replace(
  "import AsyncStorage from '@react-native-async-storage/async-storage';",
  "import AsyncStorage from '@react-native-async-storage/async-storage';\nimport { useConnectionStore } from '../stores/connection.store';"
);

// 2. Add mock for store at the top level (after other vi.mocks)
content = content.replace(
  "describe('HighAlertMedicationService', () => {",
  `vi.mock('../stores/connection.store', () => {
  return {
    useConnectionStore: {
      getState: vi.fn(),
    },
  };
});\n\ndescribe('HighAlertMedicationService', () => {`
);

// 3. Set default mock state in beforeEach
content = content.replace(
  "global.fetch = vi.fn();\n  });",
  `global.fetch = vi.fn();

    vi.mocked(useConnectionStore.getState).mockReturnValue({
      status: 'CONNECTED',
      serverUrl: 'http://mock-server:3000',
      errorMessage: null,
      setStatus: vi.fn(),
      setServerUrl: vi.fn(),
      setError: vi.fn(),
      enableOfflineMode: vi.fn(),
      enableManualFallback: vi.fn(),
    });
  });`
);

// 4. Update the tests to use mock-server:3000 instead of localhost:3000
content = content.replace(/http:\/\/localhost:3000/g, 'http://mock-server:3000');

// 5. Add new test cases for aborting
const abortTests = `
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
      expect(global.fetch).not.toHaveBeenCalled();
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
      expect(global.fetch).not.toHaveBeenCalled();
      expect((HighAlertMedicationService as any).isSyncing).toBe(false);
    });
`;

content = content.replace(
  "  describe('attemptSync', () => {",
  `  describe('attemptSync', () => {\n${abortTests}`
);

fs.writeFileSync(filePath, content);
