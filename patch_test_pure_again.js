const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.spec.ts';
let content = fs.readFileSync(filePath, 'utf8');

// The original file has import at the very top, but then vi.mock BEFORE importing the service
// We will do it in a way that respects that file structure.

content = content.replace(
  "import { HighAlertMedicationService } from './HighAlertMedicationService';",
  "import { useConnectionStore } from '../stores/connection.store';\nimport { HighAlertMedicationService } from './HighAlertMedicationService';"
);

// We need to add the mock before the describe block
content = content.replace(
  "describe('HighAlertMedicationService', () => {",
  `vi.mock('../stores/connection.store', () => {
  return {
    useConnectionStore: {
      getState: vi.fn(),
    },
  };
});

describe('HighAlertMedicationService', () => {`
);

// We need to setup the mock inside the first beforeEach
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

// Replace URLs
content = content.replace(/http:\/\/localhost:3000/g, 'http://mock-server:3000');

// Add tests
const abortTestsToAdd = `
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
  "    it('should return immediately if queue is empty (null)', async () => {",
  `${abortTestsToAdd}\n    it('should return immediately if queue is empty (null)', async () => {`
);

fs.writeFileSync(filePath, content);
