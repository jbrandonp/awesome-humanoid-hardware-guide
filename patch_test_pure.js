const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.spec.ts';
let content = fs.readFileSync(filePath, 'utf8');

const storeImport = `
import { useConnectionStore } from '../stores/connection.store';
`;

content = content.replace(
  "import { HighAlertMedicationService } from './HighAlertMedicationService';",
  `import { HighAlertMedicationService } from './HighAlertMedicationService';${storeImport}`
);

const storeMock = `
vi.mock('../stores/connection.store', () => {
  return {
    useConnectionStore: {
      getState: vi.fn(),
    },
  };
});
`;

content = content.replace(
  "vi.mock('@react-native-async-storage/async-storage', () => {",
  `${storeMock}\nvi.mock('@react-native-async-storage/async-storage', () => {`
);

const setupMocks = `
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
`;

content = content.replace(
  "global.fetch = vi.fn();\n  });",
  `global.fetch = vi.fn();\n${setupMocks}\n  });`
);

content = content.replace(
  /http:\/\/localhost:3000/g,
  'http://mock-server:3000'
);

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
    });
`;

content = content.replace(
  "  describe('attemptSync', () => {",
  `  describe('attemptSync', () => {\n${abortTests}`
);

fs.writeFileSync(filePath, content);
