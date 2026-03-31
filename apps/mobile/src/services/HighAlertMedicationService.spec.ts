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
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HighAlertMedicationService } from './HighAlertMedicationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

// Mock expo-crypto just in case to prevent import errors in the test environment
vi.mock('expo-crypto', () => ({
  digestStringAsync: vi.fn().mockResolvedValue('mock-hash'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

const DUAL_SIGN_OFF_QUEUE_KEY = '@dual_sign_off_queue';

describe('HighAlertMedicationService - attemptSync', () => {
  let fetchMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // reset internal state manually by re-initializing or manipulating (using any for private prop)
    (HighAlertMedicationService as any).isSyncing = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return early if queue string is null', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

    await HighAlertMedicationService.attemptSync();

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(DUAL_SIGN_OFF_QUEUE_KEY);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should return early if queue is empty', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([]));

    await HighAlertMedicationService.attemptSync();

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(DUAL_SIGN_OFF_QUEUE_KEY);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should prevent concurrent syncing executions', async () => {
    const queue = [{ id: 1, offlineHash: 'hash-1' }];
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue));

    // Make fetch hang to simulate a slow network
    let resolveFetch: any;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    fetchMock.mockReturnValueOnce(fetchPromise);

    // start first sync
    const firstSync = HighAlertMedicationService.attemptSync();

    // verify flag is set
    expect((HighAlertMedicationService as any).isSyncing).toBe(true);

    // start second sync
    await HighAlertMedicationService.attemptSync();

    // fetch should only be called once
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // resolve first sync
    resolveFetch({ ok: true });
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue)); // read current queue
    await firstSync;

    // verify flag is reset
    expect((HighAlertMedicationService as any).isSyncing).toBe(false);
  });

  it('should sync a single item and remove it from the queue safely', async () => {
    const queue = [{ id: 1, offlineHash: 'hash-1' }];

    // First read to get the queue
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue));

    fetchMock.mockResolvedValueOnce({ ok: true });

    // Second read to get current queue before removing synced item
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue));

    await HighAlertMedicationService.attemptSync();

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(DUAL_SIGN_OFF_QUEUE_KEY);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/high-alert-medications/dual-sign-off', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queue[0]),
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(DUAL_SIGN_OFF_QUEUE_KEY, JSON.stringify([]));
  });

  it('should process multiple items sequentially and handle new items added mid-sync', async () => {
    const queue = [{ id: 1, offlineHash: 'hash-1' }, { id: 2, offlineHash: 'hash-2' }];

    // Initial read
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue));

    fetchMock.mockResolvedValue({ ok: true });

    // Read after syncing item 1
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([
      { id: 1, offlineHash: 'hash-1' },
      { id: 2, offlineHash: 'hash-2' },
      { id: 3, offlineHash: 'hash-3' } // added mid-sync
    ]));

    // Read after syncing item 2
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([
      { id: 2, offlineHash: 'hash-2' },
      { id: 3, offlineHash: 'hash-3' }
    ]));

    await HighAlertMedicationService.attemptSync();

    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Check setItem calls
    expect(AsyncStorage.setItem).toHaveBeenNthCalledWith(1, DUAL_SIGN_OFF_QUEUE_KEY, JSON.stringify([
        { id: 2, offlineHash: 'hash-2' },
        { id: 3, offlineHash: 'hash-3' }
    ]));

    expect(AsyncStorage.setItem).toHaveBeenNthCalledWith(2, DUAL_SIGN_OFF_QUEUE_KEY, JSON.stringify([
        { id: 3, offlineHash: 'hash-3' }
    ]));
  });

  it('should throw an error and stop processing if response is not ok', async () => {
    const queue = [{ id: 1, offlineHash: 'hash-1' }, { id: 2, offlineHash: 'hash-2' }];
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue));

    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(HighAlertMedicationService.attemptSync()).rejects.toThrow('Sync failed with status 500');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect((HighAlertMedicationService as any).isSyncing).toBe(false);
  });

  it('should throw an error and stop processing if fetch fails (network error)', async () => {
    const queue = [{ id: 1, offlineHash: 'hash-1' }];
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue));

    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    await expect(HighAlertMedicationService.attemptSync()).rejects.toThrow('Network error');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect((HighAlertMedicationService as any).isSyncing).toBe(false);
  });
});
