const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.spec.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add mock at the top level
const headerAdditions = `
vi.mock('../stores/connection.store', () => {
  return {
    useConnectionStore: {
      getState: vi.fn(),
    },
  };
});
import { useConnectionStore } from '../stores/connection.store';
`;

content = content.replace(
  "import { HighAlertMedicationService } from './HighAlertMedicationService';",
  `import { HighAlertMedicationService } from './HighAlertMedicationService';\n${headerAdditions}`
);

// 2. Setup mock state in beforeEach
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

// 3. Update localhost:3000 -> mock-server:3000
content = content.replace(/http:\/\/localhost:3000/g, 'http://mock-server:3000');

// 4. Add the new tests inside 'attemptSync' block
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

// Remove the `import { useConnectionStore } from '../stores/connection.store';` if it was already there lower down
content = content.replace(/import \{ useConnectionStore \} from '\.\.\/stores\/connection\.store';/g, '');
// And put it back once at the top
content = content.replace("import { HighAlertMedicationService } from './HighAlertMedicationService';", "import { useConnectionStore } from '../stores/connection.store';\nimport { HighAlertMedicationService } from './HighAlertMedicationService';")


fs.writeFileSync(filePath, content);
