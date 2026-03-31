// Define __DEV__ to fix expo/src/async-require/setup.ts missing __DEV__ issue
if (typeof global.__DEV__ === 'undefined') {
  (global as any).__DEV__ = true;
}

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
vi.mock('expo-background-fetch', () => ({
  registerTaskAsync: vi.fn(),
}));
vi.mock('expo-task-manager', () => ({
  defineTask: vi.fn(),
  isTaskRegisteredAsync: vi.fn(),
}));

import { BackgroundSyncService, BackgroundSyncTask } from './background-sync.service';

// Provide a mock for Buffer since we might be in an environment where it's not global
import { Buffer } from 'buffer';
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// 1. Manual mock for AsyncStorage
const mockGetItem = vi.fn();
const mockSetItem = vi.fn();

vi.mock('@react-native-async-storage/async-storage', () => {
  return {
    default: {
      getItem: (...args: any[]) => mockGetItem(...args),
      setItem: (...args: any[]) => mockSetItem(...args),
    },
  };
});

const QUEUE_STORAGE_KEY = '@resilient_health_sync_queue';

describe('BackgroundSyncService.enqueueTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 2. Mock Date.now() and Math.random() for deterministic transaction IDs
    // We will use standard mock implementations to ensure predictability.
    const fixedTime = new Date('2023-01-01T12:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(fixedTime);
    vi.useFakeTimers();
    vi.setSystemTime(fixedTime);

    // Math.random() returns something predictable
    // Math.random().toString(36).substring(7) -> we need enough characters so substring(7) returns something
    // let's use a number like 0.1234567890123456
    vi.spyOn(Math, 'random').mockReturnValue(0.1234567890123456);

    // Suppress console.error in tests to avoid cluttering output when testing error branches
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should enqueue a new task when the queue is empty', async () => {
    mockGetItem.mockResolvedValueOnce(null);

    const payload = { test: 'data' };
    await BackgroundSyncService.enqueueTransaction('CRITICAL', '/api/sync', payload);

    expect(mockGetItem).toHaveBeenCalledWith(QUEUE_STORAGE_KEY);
    expect(mockSetItem).toHaveBeenCalledTimes(1);

    // Verify the data that was stored
    const setItemArgs = mockSetItem.mock.calls[0];
    expect(setItemArgs[0]).toBe(QUEUE_STORAGE_KEY);

    const savedQueue: BackgroundSyncTask[] = JSON.parse(setItemArgs[1]);
    expect(savedQueue).toHaveLength(1);

    const task = savedQueue[0];
    expect(task.priority).toBe('CRITICAL');
    expect(task.endpoint).toBe('/api/sync');
    expect(task.retryCount).toBe(0);
    expect(task.queuedAtIso).toBe('2023-01-01T12:00:00.000Z');

    // Check Base64 serialization
    const payloadString = JSON.stringify(payload);
    const expectedBase64 = Buffer.from(payloadString, 'utf-8').toString('base64');
    expect(task.payloadBase64).toBe(expectedBase64);

    // Check Transaction ID format
    // SYNC-TXN-timestamp-randomString
    expect(task.transactionId).toMatch(/^SYNC-TXN-1672574400000-[a-z0-9]+$/);
  });

  it('should append a task to an existing queue', async () => {
    const existingQueue: BackgroundSyncTask[] = [
      {
        transactionId: 'SYNC-TXN-OLD-123',
        priority: 'LOW',
        endpoint: '/api/old',
        payloadBase64: 'e30=',
        queuedAtIso: '2022-12-31T12:00:00.000Z',
        retryCount: 1,
      }
    ];
    mockGetItem.mockResolvedValueOnce(JSON.stringify(existingQueue));

    await BackgroundSyncService.enqueueTransaction('HIGH', '/api/new', { new: 'data' });

    expect(mockGetItem).toHaveBeenCalledWith(QUEUE_STORAGE_KEY);
    expect(mockSetItem).toHaveBeenCalledTimes(1);

    const savedQueue: BackgroundSyncTask[] = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(savedQueue).toHaveLength(2);
    expect(savedQueue[0].transactionId).toBe('SYNC-TXN-OLD-123');
    expect(savedQueue[1].priority).toBe('HIGH');
  });

  it('should not enqueue a transaction if its ID already exists (idempotency)', async () => {
    // We mock Math.random and Date.now so the generated transactionId will be exactly
    // "SYNC-TXN-1672574400000-" + (0.1234567890123456).toString(36).substring(7)
    const mockTransactionId = `SYNC-TXN-1672574400000-${(0.1234567890123456).toString(36).substring(7)}`;

    const existingQueue: BackgroundSyncTask[] = [
      {
        transactionId: mockTransactionId,
        priority: 'CRITICAL',
        endpoint: '/api/duplicate',
        payloadBase64: 'e30=',
        queuedAtIso: '2023-01-01T12:00:00.000Z',
        retryCount: 0,
      }
    ];
    mockGetItem.mockResolvedValueOnce(JSON.stringify(existingQueue));

    // Calling enqueueTransaction, which should generate the same transactionId
    await BackgroundSyncService.enqueueTransaction('LOW', '/api/another', { data: 'test' });

    // It should check the queue, find the duplicate, and NOT call setItem
    expect(mockGetItem).toHaveBeenCalledWith(QUEUE_STORAGE_KEY);
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('should handle storage errors gracefully and log them', async () => {
    const error = new Error('Disk Full');
    mockGetItem.mockRejectedValueOnce(error);

    // This should not throw an unhandled promise rejection
    await expect(
      BackgroundSyncService.enqueueTransaction('LOW', '/api/fail', {})
    ).resolves.toBeUndefined();

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      `[CRITICAL] Impossible d'écrire dans la file d'attente (Disque plein ?).`,
      error
    );
  });
});
