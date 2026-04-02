import { SyncService } from './sync.service';

const MOCK_LATENCY_MS = 10;

class MockPrismaService {
  public patient = {
    update: async () => new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS)),
    createMany: async () => new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS)),
  };
  public visit = {
    update: async () => new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS)),
    findUnique: async () => new Promise(resolve => setTimeout(() => resolve(null), MOCK_LATENCY_MS)),
    createMany: async () => new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS)),
  };
  public prescription = {
    update: async () => new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS)),
    findUnique: async () => new Promise(resolve => setTimeout(() => resolve(null), MOCK_LATENCY_MS)),
    createMany: async () => new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS)),
  };
  public vital = {
    update: async () => new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS)),
    createMany: async () => new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS)),
  };
  public clinicalIncident = {
    create: async () => new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS)),
  };

  public async $transaction(promises: any[]) {
    // In a real Prisma transaction, they are executed in a batch.
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
    return Promise.all(promises);
  }
}

async function runBenchmark() {
  const prisma = new MockPrismaService();

  const syncService = new SyncService(prisma as any);

  const NUM_UPDATES = 100;

  const mockChanges = {
    patients: { created: [], updated: [], deleted: [] },
    visits: { created: [], updated: [], deleted: [] },
    prescriptions: { created: [], updated: [], deleted: [] },
    vitals: {
      created: [],
      updated: Array.from({ length: NUM_UPDATES }).map((_, i) => ({
        id: `vital-${i}`,
        patient_id: `patient-${i}`,
        blood_pressure: "120/80",
        heart_rate: 80,
        recorded_at: new Date().toISOString()
      })),
      deleted: []
    }
  };

  console.log(`Starting benchmark for ${NUM_UPDATES} vital updates...`);

  const start = performance.now();
  await syncService.pushChanges(mockChanges);
  const end = performance.now();

  console.log(`Execution time: ${(end - start).toFixed(2)} ms`);
}

runBenchmark().catch(console.error);
