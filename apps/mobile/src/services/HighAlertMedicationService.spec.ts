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
  digestStringAsync: vi.fn(),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

const DUAL_SIGN_OFF_QUEUE_KEY = '@dual_sign_off_queue';

describe('HighAlertMedicationService - attemptSync', () => {
  let fetchMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
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

  it('should sync a single item and remove it from the queue', async () => {
    const queue = [{ id: 1 }];
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue));

    fetchMock.mockResolvedValueOnce({ ok: true });

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

  it('should recursively sync multiple items', async () => {
    const queue = [{ id: 1 }, { id: 2 }, { id: 3 }];

    // First call: [1, 2, 3]
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue));
    // Second call (recursive): [2, 3]
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([{ id: 2 }, { id: 3 }]));
    // Third call (recursive): [3]
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([{ id: 3 }]));

    fetchMock.mockResolvedValue({ ok: true });

    await HighAlertMedicationService.attemptSync();

    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Check setItem calls
    expect(AsyncStorage.setItem).toHaveBeenNthCalledWith(1, DUAL_SIGN_OFF_QUEUE_KEY, JSON.stringify([{ id: 2 }, { id: 3 }]));
    expect(AsyncStorage.setItem).toHaveBeenNthCalledWith(2, DUAL_SIGN_OFF_QUEUE_KEY, JSON.stringify([{ id: 3 }]));
    expect(AsyncStorage.setItem).toHaveBeenNthCalledWith(3, DUAL_SIGN_OFF_QUEUE_KEY, JSON.stringify([]));
  });

  it('should throw an error and stop processing if response is not ok', async () => {
    const queue = [{ id: 1 }, { id: 2 }];
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue));

    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(HighAlertMedicationService.attemptSync()).rejects.toThrow('Sync failed with status 500');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('should throw an error and stop processing if fetch fails (network error)', async () => {
    const queue = [{ id: 1 }];
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queue));

    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    await expect(HighAlertMedicationService.attemptSync()).rejects.toThrow('Network error');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
