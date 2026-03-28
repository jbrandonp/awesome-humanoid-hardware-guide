import { Injectable } from '@nestjs/common';
import * as Y from 'yjs';

@Injectable()
export class CrdtService {
  /**
   * Computes the State Vector for a given document buffer.
   * This vector represents the current state (clock) of the document.
   *
   * @param docBuffer The binary state of the Yjs document (Uint8Array or Buffer)
   * @returns The state vector as a Uint8Array
   */
  getStateVector(docBuffer: Uint8Array | Buffer | null): Uint8Array {
    const doc = new Y.Doc();
    if (docBuffer) {
      Y.applyUpdate(doc, docBuffer);
    }
    return Y.encodeStateVector(doc);
  }

  /**
   * Computes the differences (delta) between the current document and a target state vector.
   * This ensures only missing updates are sent over the network.
   *
   * @param docBuffer The binary state of the current Yjs document
   * @param targetStateVector The state vector of the remote client/server
   * @returns The state update (delta) as a Uint8Array
   */
  getDelta(docBuffer: Uint8Array | Buffer | null, targetStateVector: Uint8Array | Buffer | null): Uint8Array {
    const doc = new Y.Doc();
    if (docBuffer) {
      Y.applyUpdate(doc, docBuffer);
    }
    const stateVector = targetStateVector ? new Uint8Array(targetStateVector) : undefined;
    return Y.encodeStateAsUpdate(doc, stateVector);
  }

  /**
   * Merges a delta (update) into the given document state and returns the new state.
   *
   * @param docBuffer The binary state of the current Yjs document
   * @param delta The update to apply
   * @returns The updated binary state of the Yjs document
   */
  mergeDelta(docBuffer: Uint8Array | Buffer | null, delta: Uint8Array | Buffer): Uint8Array {
    const doc = new Y.Doc();
    if (docBuffer) {
      Y.applyUpdate(doc, docBuffer);
    }
    Y.applyUpdate(doc, delta);
    return Y.encodeStateAsUpdate(doc);
  }
}
