import * as Y from 'yjs';
import { CrdtService } from './crdt.service';

describe('CRDT Merging Strategy (Yjs Deltas)', () => {
  let crdtService: CrdtService;

  beforeEach(() => {
    crdtService = new CrdtService();
  });

  it('should successfully merge concurrent offline changes using State Vectors and Deltas', () => {
    // 1. Initialize Server State
    const serverDoc = new Y.Doc();
    const serverText = serverDoc.getText('notes');
    serverText.insert(0, 'Patient presents with mild fever.\n');

    const serverVitals = serverDoc.getArray('vitals');
    serverVitals.push(['Temp: 38C']);

    let serverStateBuffer = Y.encodeStateAsUpdate(serverDoc);

    // 2. Client A and Client B pull the initial state
    const clientADoc = new Y.Doc();
    Y.applyUpdate(clientADoc, serverStateBuffer);
    const clientAText = clientADoc.getText('notes');
    const clientAVitals = clientADoc.getArray('vitals');

    const clientBDoc = new Y.Doc();
    Y.applyUpdate(clientBDoc, serverStateBuffer);
    const clientBText = clientBDoc.getText('notes');
    const clientBVitals = clientBDoc.getArray('vitals');

    // 3. Both doctors edit offline at the same time
    clientAText.insert(clientAText.length, 'Doctor A: Prescribed Paracetamol.\n');
    clientAVitals.push(['HR: 90bpm']);

    clientBText.insert(clientBText.length, 'Doctor B: Ordered Blood Test.\n');
    clientBVitals.push(['BP: 120/80']);

    // 4. Syncing Phase: Client A pushes changes
    // Client A sends its state vector to the server (or server computes it)
    const serverStateVectorForA = crdtService.getStateVector(serverStateBuffer);

    // Client A computes the delta (only the new changes) based on server's state vector
    const clientABuffer = Y.encodeStateAsUpdate(clientADoc);
    const deltaA = crdtService.getDelta(clientABuffer, serverStateVectorForA);

    // Server merges Delta A
    serverStateBuffer = crdtService.mergeDelta(serverStateBuffer, deltaA);

    // 5. Syncing Phase: Client B pushes changes
    // Client B sends its state vector to the server (or server computes it)
    const serverStateVectorForB = crdtService.getStateVector(serverStateBuffer);

    // Client B computes the delta based on server's *updated* state vector
    const clientBBuffer = Y.encodeStateAsUpdate(clientBDoc);
    const deltaB = crdtService.getDelta(clientBBuffer, serverStateVectorForB);

    // Server merges Delta B
    serverStateBuffer = crdtService.mergeDelta(serverStateBuffer, deltaB);

    // 6. Assertions: Check final merged state on the server
    const finalServerDoc = new Y.Doc();
    Y.applyUpdate(finalServerDoc, serverStateBuffer);

    const finalNotes = finalServerDoc.getText('notes').toString();
    expect(finalNotes).toContain('Patient presents with mild fever.');
    expect(finalNotes).toContain('Doctor A: Prescribed Paracetamol.');
    expect(finalNotes).toContain('Doctor B: Ordered Blood Test.');

    const finalVitals = finalServerDoc.getArray('vitals').toArray();
    expect(finalVitals).toContain('Temp: 38C');
    expect(finalVitals).toContain('HR: 90bpm');
    expect(finalVitals).toContain('BP: 120/80');
    expect(finalVitals.length).toBe(3);
  });
});
