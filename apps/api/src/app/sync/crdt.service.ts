import { Injectable, Logger } from '@nestjs/common';
import * as Y from 'yjs';

@Injectable()
export class CrdtService {
  private readonly logger = new Logger(CrdtService.name);

  /**
   * Computes the State Vector for a given document buffer.
   */
  getStateVector(docBuffer: Uint8Array | Buffer | null): Uint8Array {
    try {
      const doc = new Y.Doc();
      if (docBuffer) {
        Y.applyUpdate(doc, new Uint8Array(docBuffer));
      }
      return Y.encodeStateVector(doc);
    } catch (e) {
      this.logger.error('Failed to compute state vector: Corrupted buffer', e);
      return new Uint8Array();
    }
  }

  /**
   * Computes the differences (delta) between the current document and a target state vector.
   */
  getDelta(docBuffer: Uint8Array | Buffer | null, targetStateVector: Uint8Array | Buffer | null): Uint8Array {
    try {
      const doc = new Y.Doc();
      if (docBuffer) {
        Y.applyUpdate(doc, new Uint8Array(docBuffer));
      }
      const stateVector = targetStateVector ? new Uint8Array(targetStateVector) : undefined;
      return Y.encodeStateAsUpdate(doc, stateVector);
    } catch (e) {
      this.logger.error('Failed to compute delta: Corrupted buffer or state vector', e);
      return new Uint8Array();
    }
  }

  /**
   * Merges a delta (update) into the given document state and returns the new state.
   * PERFORMANCE FIX: Uses Y.mergeUpdates directly instead of instantiating Y.Doc.
   */
  mergeDelta(docBuffer: Uint8Array | Buffer | null, delta: Uint8Array | Buffer): Uint8Array {
    try {
      if (!docBuffer) return new Uint8Array(delta);
      
      // Efficiently merge binary updates without full document reconstruction
      return Y.mergeUpdates([new Uint8Array(docBuffer), new Uint8Array(delta)]);
    } catch (e) {
      this.logger.error('CRITICAL: CRDT Merge failed. Falling back to latest delta to avoid sync blockage.', e);
      return new Uint8Array(delta);
    }
  }
}
