const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.spec.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add connection store import at the top level
const importToAdd = `import { useConnectionStore } from '../stores/connection.store';\n`;
content = content.replace(
  "import { HighAlertMedicationService } from './HighAlertMedicationService';",
  `${importToAdd}import { HighAlertMedicationService } from './HighAlertMedicationService';`
);

// 2. Add connection store mock at the top level
const mockToAdd = `
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
  `${mockToAdd}\nvi.mock('@react-native-async-storage/async-storage', () => {`
);

// 3. Update the beforeEach hook to setup the default mock
const setupToAdd = `
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
  "global.fetch = vi.fn();",
  `global.fetch = vi.fn();${setupToAdd}`
);

// 4. Update the test assertions from localhost to mock-server
content = content.replace(/http:\/\/localhost:3000/g, 'http://mock-server:3000');

// 5. Add the abort tests inside the 'attemptSync' describe block
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
