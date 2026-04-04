import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('expo-secure-store', () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

vi.mock('expo-file-system', () => ({
  documentDirectory: 'file:///app/documents/',
  getInfoAsync: vi.fn(),
  readDirectoryAsync: vi.fn(),
  deleteAsync: vi.fn(),
}));

vi.mock('jail-monkey', () => ({
  default: {
    isJailBroken: vi.fn().mockReturnValue(false),
  },
}));

vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: vi.fn(),
  isEnrolledAsync: vi.fn(),
  authenticateAsync: vi.fn(),
}));

vi.mock('expo-crypto', () => ({
  getRandomBytes: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  }
}));

import { SecurityManager } from './SecurityManager';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

describe('SecurityManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('wipeData', () => {
    const ENCRYPTION_KEY_STORAGE_KEY = 'DB_ENCRYPTION_KEY';
    const AUTH_ATTEMPTS_STORAGE_KEY = 'AUTH_ATTEMPTS';
    const DB_NAME = 'systeme_sante.db';
    const docDir = 'file:///app/documents/';

    it('should delete secure store items and database files for iOS when they exist', async () => {
      Platform.OS = 'ios';

      const basePath = `${docDir}../Library/Application Support/`;
      const dbPath = `${basePath}${DB_NAME}`;
      const dbPathShm = `${basePath}${DB_NAME}-shm`;
      const dbPathWal = `${basePath}${DB_NAME}-wal`;

      // Mock file existence
      vi.mocked(FileSystem.getInfoAsync).mockImplementation(async (path: string) => {
        return { exists: true, isDirectory: true, uri: path, size: 100 };
      });
      vi.mocked(FileSystem.readDirectoryAsync).mockResolvedValue([
        'systeme_sante.db',
        'systeme_sante-shm',
        'systeme_sante-wal',
        'systeme_sante?key=123.db',
        'other_file.txt'
      ]);

      await SecurityManager.wipeData();

      // Check SecureStore deletions
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(ENCRYPTION_KEY_STORAGE_KEY);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_ATTEMPTS_STORAGE_KEY);

      // Check FileSystem existence checks
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(basePath);
      expect(FileSystem.readDirectoryAsync).toHaveBeenCalledWith(basePath);

      // Check FileSystem deletions
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(dbPath, { idempotent: true });
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(`${basePath}systeme_sante-shm`, { idempotent: true });
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(`${basePath}systeme_sante-wal`, { idempotent: true });
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(`${basePath}systeme_sante?key=123.db`, { idempotent: true });
      expect(FileSystem.deleteAsync).not.toHaveBeenCalledWith(`${basePath}other_file.txt`, { idempotent: true });
    });

    it('should delete secure store items and database files for Android when they exist', async () => {
      Platform.OS = 'android';

      const basePath = `${docDir}../databases/`;
      const dbPath = `${basePath}${DB_NAME}`;
      const dbPathShm = `${basePath}${DB_NAME}-shm`;
      const dbPathWal = `${basePath}${DB_NAME}-wal`;

      // Mock file existence
      vi.mocked(FileSystem.getInfoAsync).mockImplementation(async (path: string) => {
        return { exists: true, isDirectory: true, uri: path, size: 100 };
      });
      vi.mocked(FileSystem.readDirectoryAsync).mockResolvedValue([
        'systeme_sante.db',
        'systeme_sante-shm',
        'systeme_sante-wal',
        'systeme_sante?key=123.db',
        'other_file.txt'
      ]);

      await SecurityManager.wipeData();

      // Check SecureStore deletions
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(ENCRYPTION_KEY_STORAGE_KEY);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_ATTEMPTS_STORAGE_KEY);

      // Check FileSystem existence checks
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(basePath);
      expect(FileSystem.readDirectoryAsync).toHaveBeenCalledWith(basePath);

      // Check FileSystem deletions
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(dbPath, { idempotent: true });
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(`${basePath}systeme_sante-shm`, { idempotent: true });
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(`${basePath}systeme_sante-wal`, { idempotent: true });
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(`${basePath}systeme_sante?key=123.db`, { idempotent: true });
      expect(FileSystem.deleteAsync).not.toHaveBeenCalledWith(`${basePath}other_file.txt`, { idempotent: true });
    });

    it('should not attempt to delete database files if directory does not exist', async () => {
      Platform.OS = 'ios'; // OS doesn't matter much here, just testing non-existence path

      // Mock directory non-existence
      vi.mocked(FileSystem.getInfoAsync).mockImplementation(async (path: string) => {
        return { exists: false, isDirectory: false, uri: path, size: 0 };
      });

      await SecurityManager.wipeData();

      // SecureStore items should still be deleted
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(ENCRYPTION_KEY_STORAGE_KEY);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_ATTEMPTS_STORAGE_KEY);

      // FileSystem existence checks should happen
      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(1);
      expect(FileSystem.readDirectoryAsync).not.toHaveBeenCalled();

      // FileSystem deletions should NOT happen
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it('should not attempt to delete database files if no matching files exist', async () => {
      Platform.OS = 'ios';

      // Mock directory existence but no matching files
      vi.mocked(FileSystem.getInfoAsync).mockImplementation(async (path: string) => {
        return { exists: true, isDirectory: true, uri: path, size: 0 };
      });
      vi.mocked(FileSystem.readDirectoryAsync).mockResolvedValue([
        'other_file.txt',
        'random.db'
      ]);

      await SecurityManager.wipeData();

      // SecureStore items should still be deleted
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(ENCRYPTION_KEY_STORAGE_KEY);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_ATTEMPTS_STORAGE_KEY);

      // FileSystem existence checks should happen
      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(1);
      expect(FileSystem.readDirectoryAsync).toHaveBeenCalledTimes(1);

      // FileSystem deletions should NOT happen
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it('should silently ignore errors during file deletion', async () => {
      Platform.OS = 'ios';

      // Mock directory existence
      vi.mocked(FileSystem.getInfoAsync).mockImplementation(async (path: string) => {
        return { exists: true, isDirectory: true, uri: path, size: 100 };
      });
      vi.mocked(FileSystem.readDirectoryAsync).mockResolvedValue([
        'systeme_sante.db'
      ]);

      // Force an error on delete
      vi.mocked(FileSystem.deleteAsync).mockRejectedValue(new Error('Deletion failed due to permission or lock'));

      // This should not throw an error, it should be caught and ignored silently
      await expect(SecurityManager.wipeData()).resolves.toBeUndefined();

      // FileSystem existence checks should happen
      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(1);

      // Deletion should be attempted and throw, but the test passes because the error is caught
      expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    });
  });
});
