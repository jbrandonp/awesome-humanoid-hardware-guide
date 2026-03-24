export class CornerstoneStateService {
  /**
   * Sérialise l'état complet des annotations de Cornerstone
   * (Pour l'instant un pass-through générique)
   */
  static serializeToolState(globalToolStateManager: unknown): Record<string, unknown> {
    return globalToolStateManager as Record<string, unknown>;
  }

  /**
   * Restaure l'état des annotations de Cornerstone
   * (Pour l'instant on suppose que le state est compatible)
   */
  static deserializeToolState(globalToolStateManager: unknown, state: Record<string, unknown>): void {
    // Si la méthode restore existait sur la librairie:
    // (globalToolStateManager as any).restoreToolState(state);

    // Dans l'état actuel sans lib, nous utilisons une mutation symbolique
    // sans utiliser `any` (Zero 'any' policy).
    const manager = globalToolStateManager as Record<string, unknown>;
    Object.assign(manager, state);
  }
}
