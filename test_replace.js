const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.spec.ts';
let content = fs.readFileSync(filePath, 'utf8');

// The error "Cannot use import statement outside a module" points out we can't add an `import` lower in the file after CommonJS-style mocks, or similar issues in Vitest.
// So let's add `import { useConnectionStore } from '../stores/connection.store';` at the very top.

const newContent = `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConnectionStore } from '../stores/connection.store';

// We must mock expo-crypto before importing the service since it fails with rollup/vitest
vi.mock('expo-crypto', () => {
  return {
    digestStringAsync: vi.fn(),
    CryptoDigestAlgorithm: {
      SHA256: 'SHA-256'
    }
  };
});

// We must also mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => {
  return {
    default: {
      getItem: vi.fn(),
      setItem: vi.fn(),
    },
  };
});

vi.mock('../stores/connection.store', () => {
  return {
    useConnectionStore: {
      getState: vi.fn(),
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HighAlertMedicationService } from './HighAlertMedicationService';

describe('HighAlertMedicationService', () => {
  const DUAL_SIGN_OFF_QUEUE_KEY = '@dual_sign_off_queue';

  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  describe('attemptSync', () => {
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

    it('should return immediately if queue is empty (null)', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

      await HighAlertMedicationService.attemptSync();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(DUAL_SIGN_OFF_QUEUE_KEY);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should return immediately if queue is empty (empty array)', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce('[]');

      await HighAlertMedicationService.attemptSync();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(DUAL_SIGN_OFF_QUEUE_KEY);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should fetch endpoint and update queue on successful sync of single item', async () => {
      const mockQueue = [{ primaryUserId: 'user1', medicationName: 'MedA' }];
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQueue));

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await HighAlertMedicationService.attemptSync();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(DUAL_SIGN_OFF_QUEUE_KEY);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://mock-server:3000/high-alert-medications/dual-sign-off',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockQueue[0]),
        })
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(DUAL_SIGN_OFF_QUEUE_KEY, '[]');
    });

    it('should fetch recursively for multiple items in queue until empty', async () => {
      const mockQueue = [
        { primaryUserId: 'user1', medicationName: 'MedA' },
        { primaryUserId: 'user2', medicationName: 'MedB' },
      ];

      // Initial queue
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQueue));
      // Recursively called queue
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([mockQueue[1]]));

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await HighAlertMedicationService.attemptSync();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'http://mock-server:3000/high-alert-medications/dual-sign-off',
        expect.objectContaining({
          body: JSON.stringify(mockQueue[0]),
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'http://mock-server:3000/high-alert-medications/dual-sign-off',
        expect.objectContaining({
          body: JSON.stringify(mockQueue[1]),
        })
      );

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
      expect(AsyncStorage.setItem).toHaveBeenNthCalledWith(
        1,
        DUAL_SIGN_OFF_QUEUE_KEY,
        JSON.stringify([mockQueue[1]])
      );
      expect(AsyncStorage.setItem).toHaveBeenNthCalledWith(
        2,
        DUAL_SIGN_OFF_QUEUE_KEY,
        '[]'
      );
    });

    it('should throw an error and abort sync if fetch fails', async () => {
      const mockQueue = [
        { primaryUserId: 'user1', medicationName: 'MedA' },
        { primaryUserId: 'user2', medicationName: 'MedB' },
      ];
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQueue));

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(HighAlertMedicationService.attemptSync()).rejects.toThrow('Sync failed with status 500');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      // setItem should not be called since sync failed
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
`;

fs.writeFileSync(filePath, newContent);
