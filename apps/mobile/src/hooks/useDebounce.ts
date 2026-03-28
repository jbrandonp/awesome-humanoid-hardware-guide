import { useState, useEffect } from 'react';

/**
 * Custom Hook: useDebounce
 * Empêche l'exécution répétitive d'une requête (ex: SQL) à chaque lettre tapée.
 * Attend que l'utilisateur ait terminé de taper pendant un délai donné (ex: 300ms)
 * avant de retourner la nouvelle valeur.
 * Indispensable pour ne pas saturer le CPU/Disque avec des requêtes SQL partielles.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
