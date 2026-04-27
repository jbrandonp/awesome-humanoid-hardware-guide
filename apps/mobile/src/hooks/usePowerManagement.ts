import { useEffect, useState } from 'react';
import * as Battery from 'expo-battery';

interface PowerManagementState {
  batteryLevel: number;
  syncIntervalMs: number;
  disableAnimations: boolean;
  disableHeavyAI: boolean;
  isLowPowerMode: boolean;
}

export function usePowerManagement(): PowerManagementState {
  const [batteryLevel, setBatteryLevel] = useState<number>(1);
  const [powerState, setPowerState] = useState<PowerManagementState>({
    batteryLevel: 1,
    syncIntervalMs: 1000, // Par défaut 1 sec
    disableAnimations: false,
    disableHeavyAI: false,
    isLowPowerMode: false,
  });

  useEffect(() => {
    let subscription: Battery.Subscription | null = null;

    async function initBattery() {
      const level = await Battery.getBatteryLevelAsync();
      updatePowerState(level);

      subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        updatePowerState(batteryLevel);
      });
    }

    initBattery();

    return () => {
      subscription?.remove();
    };
  }, []);

  const updatePowerState = (level: number) => {
    setBatteryLevel(level);

    if (level < 0.15) {
      // Survie extrême (< 15%)
      console.warn(
        '[PowerManagement] Batterie critique < 15%. Passage en mode Survie Extrême.',
      );
      setPowerState({
        batteryLevel: level,
        syncIntervalMs: 60000, // Réduction drastique de la sync mDNS/CRDT à 60s
        disableAnimations: true,
        disableHeavyAI: true,
        isLowPowerMode: true,
      });
    } else if (level < 0.3) {
      // Batterie faible (< 30%)
      setPowerState({
        batteryLevel: level,
        syncIntervalMs: 15000, // Sync toutes les 15s
        disableAnimations: true,
        disableHeavyAI: false,
        isLowPowerMode: true,
      });
    } else {
      // Normal
      setPowerState({
        batteryLevel: level,
        syncIntervalMs: 1000, // 1s sync rapide
        disableAnimations: false,
        disableHeavyAI: false,
        isLowPowerMode: false,
      });
    }
  };

  return powerState;
}
