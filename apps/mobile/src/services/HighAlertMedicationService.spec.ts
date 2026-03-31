import { describe, it, expect, beforeEach, vi } from 'vitest';

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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HighAlertMedicationService } from './HighAlertMedicationService';

describe('HighAlertMedicationService', () => {
  const DUAL_SIGN_OFF_QUEUE_KEY = '@dual_sign_off_queue';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('attemptSync', () => {
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
        'http://localhost:3000/high-alert-medications/dual-sign-off',
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
        'http://localhost:3000/high-alert-medications/dual-sign-off',
        expect.objectContaining({
          body: JSON.stringify(mockQueue[0]),
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3000/high-alert-medications/dual-sign-off',
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
