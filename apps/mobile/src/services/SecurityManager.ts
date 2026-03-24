import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import JailMonkey from 'jail-monkey';
import { Platform } from 'react-native';

const ENCRYPTION_KEY_STORAGE_KEY = 'DB_ENCRYPTION_KEY';
const AUTH_ATTEMPTS_STORAGE_KEY = 'AUTH_ATTEMPTS';
const MAX_AUTH_ATTEMPTS = 10;
const DB_NAME = 'systeme_sante.db';

export class SecurityManager {
  private static async getAuthAttempts(): Promise<number> {
    const attempts = await SecureStore.getItemAsync(AUTH_ATTEMPTS_STORAGE_KEY);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  private static async incrementAuthAttempts(): Promise<number> {
    const attempts = await this.getAuthAttempts();
    const newAttempts = attempts + 1;
    await SecureStore.setItemAsync(AUTH_ATTEMPTS_STORAGE_KEY, newAttempts.toString());
    return newAttempts;
  }

  private static async resetAuthAttempts(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_ATTEMPTS_STORAGE_KEY);
  }

  public static async wipeData(): Promise<void> {
    // 1. Destroy the key
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
    await this.resetAuthAttempts();

    // 2. Destroy the local SQLite database file
    // Handle OS-specific WatermelonDB database paths
    const basePath = Platform.OS === 'android'
        ? `${(FileSystem as any).documentDirectory}../databases/`
        : `${(FileSystem as any).documentDirectory}../Library/Application Support/`;

    const dbPath = `${basePath}${DB_NAME}`;
    const dbPathShm = `${basePath}${DB_NAME}-shm`;
    const dbPathWal = `${basePath}${DB_NAME}-wal`;

    try {
        const fileInfo = await FileSystem.getInfoAsync(dbPath);
        if (fileInfo.exists) {
            await FileSystem.deleteAsync(dbPath, { idempotent: true });
        }

        const fileInfoShm = await FileSystem.getInfoAsync(dbPathShm);
        if (fileInfoShm.exists) {
            await FileSystem.deleteAsync(dbPathShm, { idempotent: true });
        }

        const fileInfoWal = await FileSystem.getInfoAsync(dbPathWal);
        if (fileInfoWal.exists) {
            await FileSystem.deleteAsync(dbPathWal, { idempotent: true });
        }
    } catch (e) {
      // Ignore errors silently as per zero-logs rule
    }
  }

  public static async checkDeviceSecurity(): Promise<void> {
    if (JailMonkey.isJailBroken()) {
      throw new Error('Device is compromised (Jailbreak/Root detected)');
    }
  }

  public static async authenticateBiometrics(): Promise<void> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication is not available or not configured');
    }

    const authAttempts = await this.getAuthAttempts();
    if (authAttempts >= MAX_AUTH_ATTEMPTS) {
        await this.wipeData();
        throw new Error('Maximum authentication attempts reached. Data wiped.');
    }

    const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access the medical database',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel'
    });

    if (!authResult.success) {
        const newAttempts = await this.incrementAuthAttempts();
        if (newAttempts >= MAX_AUTH_ATTEMPTS) {
            await this.wipeData();
            throw new Error('Maximum authentication attempts reached. Data wiped.');
        }
        throw new Error('Biometric authentication failed');
    }

    await this.resetAuthAttempts();
  }

  public static async getEncryptionKey(): Promise<string> {
    await this.checkDeviceSecurity();
    await this.authenticateBiometrics();

    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);

    if (!key) {
        // Generate a strong cryptographic key (256 bits = 32 bytes)
        // expo-crypto generates random bytes synchronously but returns a Uint8Array
        const randomBytes = Crypto.getRandomBytes(32);

        // Convert the Uint8Array to a hex string to avoid base64 custom polyfill brittleness
        key = Array.from(randomBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, key);
    }

    return key;
  }
}
