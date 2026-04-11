/**
 * Service for serializing and deserializing Cornerstone tool state.
 * Uses Cornerstone Tools API if available, otherwise falls back to generic object assignment.
 */
export class CornerstoneStateService {
  /**
   * Serialize tool state from a tool group manager or tool state manager.
   * If cornerstoneTools is available, uses ToolGroupManager.getToolGroup to retrieve state.
   * Otherwise, returns the manager as-is.
   */
  static serializeToolState(toolStateManager: unknown): Record<string, unknown> {
    // Try to use Cornerstone Tools API if available
    try {
      const cornerstoneTools = (window as any).cornerstoneTools;
      if (cornerstoneTools && cornerstoneTools.ToolGroupManager) {
        // Assuming toolStateManager is a toolGroupId string
        if (typeof toolStateManager === 'string') {
          const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolStateManager);
          if (toolGroup) {
            // Get tool state for all tools in the tool group
            const toolState: Record<string, unknown> = {};
            const tools = toolGroup._toolInstances;
            if (tools) {
              Object.keys(tools).forEach(toolName => {
                const tool = tools[toolName];
                // Each tool may have its own state; we can store it generically
                toolState[toolName] = tool ? (tool as any).configuration || {} : {};
              });
            }
            return toolState;
          }
        }
      }
    } catch (e) {
      console.warn('Cornerstone Tools not available, using generic serialization', e);
    }
    // Fallback: treat manager as a plain object
    return toolStateManager as Record<string, unknown>;
  }

  /**
   * Deserialize tool state into a tool group manager.
   * If cornerstoneTools is available, attempts to restore state.
   */
  static deserializeToolState(toolStateManager: unknown, state: Record<string, unknown>): void {
    try {
      const cornerstoneTools = (window as any).cornerstoneTools;
      if (cornerstoneTools && cornerstoneTools.ToolGroupManager && typeof toolStateManager === 'string') {
        const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolStateManager);
        if (toolGroup) {
          // Apply configuration to each tool
          Object.keys(state).forEach(toolName => {
            const tool = toolGroup._toolInstances?.[toolName];
            if (tool && (tool as any).configuration) {
              Object.assign((tool as any).configuration, state[toolName]);
            }
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Cornerstone Tools not available, using generic deserialization', e);
    }
    // Generic fallback
    const manager = toolStateManager as Record<string, unknown>;
    Object.assign(manager, state);
  }

  /**
   * Alternative: serialize using cornerstoneTools' global tool state manager.
   * This captures annotation data (e.g., measurements).
   */
  static serializeAnnotationState(): Record<string, unknown> {
    try {
      const cornerstoneTools = (window as any).cornerstoneTools;
      if (cornerstoneTools && cornerstoneTools.globalToolStateManager) {
        return cornerstoneTools.globalToolStateManager.saveToolState();
      }
    } catch (e) {
      console.warn('Could not serialize annotation state', e);
    }
    return {};
  }

  /**
   * Restore annotation state.
   */
  static deserializeAnnotationState(state: Record<string, unknown>): void {
    try {
      const cornerstoneTools = (window as any).cornerstoneTools;
      if (cornerstoneTools && cornerstoneTools.globalToolStateManager) {
        cornerstoneTools.globalToolStateManager.restoreToolState(state);
        return;
      }
    } catch (e) {
      console.warn('Could not deserialize annotation state', e);
    }
  }
}
