import * as Y from 'yjs';

describe('CRDT Merging Strategy (Yjs)', () => {
  it('should successfully merge concurrent offline changes from two different doctors', () => {
    // Server Initial State
    const serverDoc = new Y.Doc();
    const serverText = serverDoc.getText('notes');
    serverText.insert(0, 'Patient presents with mild fever.\n');

    // Simulate Client A pulling the state
    const clientADoc = new Y.Doc();
    Y.applyUpdate(clientADoc, Y.encodeStateAsUpdate(serverDoc));
    const clientAText = clientADoc.getText('notes');

    // Simulate Client B pulling the state
    const clientBDoc = new Y.Doc();
    Y.applyUpdate(clientBDoc, Y.encodeStateAsUpdate(serverDoc));
    const clientBText = clientBDoc.getText('notes');

    // Both doctors edit offline at the same time
    clientAText.insert(
      clientAText.length,
      'Doctor A: Prescribed Paracetamol.\n',
    );
    clientBText.insert(clientBText.length, 'Doctor B: Ordered Blood Test.\n');

    // Syncing Phase: Server receives Client A's update
    const updateFromA = Y.encodeStateAsUpdate(clientADoc);
    Y.applyUpdate(serverDoc, updateFromA);

    // Syncing Phase: Server receives Client B's update
    const updateFromB = Y.encodeStateAsUpdate(clientBDoc);
    Y.applyUpdate(serverDoc, updateFromB);

    // Assert that no data was lost and CRDT successfully resolved the conflict
    const finalNotes = serverDoc.getText('notes').toString();
    expect(finalNotes).toContain('Patient presents with mild fever.');
    expect(finalNotes).toContain('Doctor A: Prescribed Paracetamol.');
    expect(finalNotes).toContain('Doctor B: Ordered Blood Test.');
  });
});
