const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.spec.ts';
let content = fs.readFileSync(filePath, 'utf8');

// The original file is structured like this:
// import { describe, ...
// vi.mock('expo-crypto'...
// vi.mock('@react-native-async-storage/async-storage'...
// import AsyncStorage ...
// import { HighAlertMedicationService } ...
// describe('HighAlertMedicationService', () => {

const newImports = `
import { useConnectionStore } from '../stores/connection.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
`;

content = content.replace(
  "import AsyncStorage from '@react-native-async-storage/async-storage';",
  newImports
);

const newMocks = `
vi.mock('../stores/connection.store', () => {
  return {
    useConnectionStore: {
      getState: vi.fn(),
    },
  };
});
`;

content = content.replace(
  "describe('HighAlertMedicationService', () => {",
  `${newMocks}\ndescribe('HighAlertMedicationService', () => {`
);

const newSetup = `
    global.fetch = vi.fn();

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
  newSetup
);

const newTests = `
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
  `${newTests}\n    it('should return immediately if queue is empty (null)', async () => {`
);

content = content.replace(/http:\/\/localhost:3000/g, 'http://mock-server:3000');

fs.writeFileSync(filePath, content);
