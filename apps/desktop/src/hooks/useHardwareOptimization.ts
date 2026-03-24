import { useEffect } from 'react';

export function useHardwareOptimization() {
  useEffect(() => {
    // Basic implementation for hardware optimization
    // Adds a class to the body if the device is considered low resource
    const isLowResource = navigator.hardwareConcurrency <= 4 || (navigator as any).deviceMemory <= 4;

    if (isLowResource) {
      document.body.classList.add('low-resource-mode');
    }

    return () => {
      document.body.classList.remove('low-resource-mode');
    };
  }, []);
}
