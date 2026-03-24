import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { DualSignOff } from '@systeme-sante/models';

const DUAL_SIGN_OFF_QUEUE_KEY = '@dual_sign_off_queue';

export class HighAlertMedicationService {
  /**
   * Hashes the dual sign-off event securely using SHA-256 for offline auditing.
   */
  private static async generateOfflineHash(payload: Omit<DualSignOff, 'offlineHash'>): Promise<string> {
    // Generate a determinist hash based on the payload stringified properties
    // In a real app, this might include a local secret key or salt
    const dataString = `${payload.primaryUserId}-${payload.secondaryPin || payload.secondaryBadgeId}-${payload.medicationName}-${payload.timestamp}`;
    const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, dataString);
    return digest;
  }

  /**
   * Records a dual sign-off event. It immediately queues it to the offline
   * fallback queue and attempts to sync it in the background.
   */
  public static async recordDualSignOff(payload: Omit<DualSignOff, 'offlineHash'>): Promise<void> {
    try {
      const offlineHash = await this.generateOfflineHash(payload);
      const securePayload = { ...payload, offlineHash };

      // 1. Queue it locally for background fetch/task manager (CRITICAL priority)
      await this.queueForSync(securePayload);

      // 2. We trigger a background sync attempt asynchronously without blocking the UI
      this.attemptSync().catch((err) => {
        // Silently fail as the task manager will handle it later. Zero-logs policy for production.
        // We can use console.warn for development/diagnostics.
        console.warn('Immediate sync failed, queued for background sync.');
      });
    } catch (error) {
      console.warn('Failed to record dual sign-off securely', error);
      throw error;
    }
  }

  private static async queueForSync(payload: any): Promise<void> {
    try {
      const existingQueueStr = await AsyncStorage.getItem(DUAL_SIGN_OFF_QUEUE_KEY);
      const queue: any[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];
      queue.push(payload);
      await AsyncStorage.setItem(DUAL_SIGN_OFF_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.warn('Error saving to offline queue', error);
    }
  }

  /**
   * Attempts to sync the queued dual sign-offs to the backend API.
   * This would typically be called by expo-background-fetch / expo-task-manager.
   */
  public static async attemptSync(): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem(DUAL_SIGN_OFF_QUEUE_KEY);
      if (!queueStr) return;

      const queue: any[] = JSON.parse(queueStr);
      if (queue.length === 0) return;

      // 3. Make a request to the NestJS API endpoint (assuming local proxy/DNS routes appropriately)
      const response = await fetch('http://localhost:3000/high-alert-medications/dual-sign-off', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Typically would include a JWT Token from auth context here
            // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(queue[0])
      });

      if (!response.ok) {
          throw new Error('Sync failed with status ' + response.status);
      }

      // 4. If successful, remove it from the queue
      const newQueue = queue.slice(1);
      await AsyncStorage.setItem(DUAL_SIGN_OFF_QUEUE_KEY, JSON.stringify(newQueue));

      // Attempt to sync the rest
      if (newQueue.length > 0) {
        await this.attemptSync();
      }
    } catch (error) {
      // Re-throw to be caught by the caller or task manager
      throw error;
    }
  }
}
