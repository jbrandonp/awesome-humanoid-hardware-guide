export class CornerstoneStateService {
  /**
   * Sérialise l'état complet des annotations de Cornerstone
   * (Pour l'instant un pass-through générique)
   */
  static serializeToolState(
    globalToolStateManager: unknown,
  ): Record<string, unknown> {
    return globalToolStateManager as Record<string, unknown>;
  }

  /**
   * Restaure l'état des annotations de Cornerstone de manière sécurisée
   */
  static deserializeToolState(
    globalToolStateManager: unknown,
    state: Record<string, unknown>,
  ): void {
    if (
      !globalToolStateManager ||
      typeof globalToolStateManager !== 'object' ||
      Array.isArray(globalToolStateManager)
    ) {
      throw new Error(
        'globalToolStateManager doit être un objet valide non-null',
      );
    }

    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return; // Rien à désérialiser ou état invalide
    }

    const manager = globalToolStateManager as Record<string, unknown>;

    // Blacklist de propriétés dangereuses
    const blacklistedKeys = ['__proto__', 'constructor', 'prototype'];

    for (const key of Object.keys(state)) {
      if (blacklistedKeys.includes(key)) {
        continue;
      }

      // Ne pas écraser les méthodes existantes du manager
      if (typeof manager[key] === 'function') {
        continue;
      }

      manager[key] = state[key];
    }
  }
}
