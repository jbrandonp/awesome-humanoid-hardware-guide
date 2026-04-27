import { SyncService } from './sync.service';

const MOCK_IDS_COUNT = 5000;
const deletedIds = Array.from({ length: MOCK_IDS_COUNT }, (_, i) => `id-${i}`);

const mockPrismaService = {
  prescription: {
    update: async (args: any) => {
      return new Promise((resolve) => setTimeout(resolve, 1));
    },
    updateMany: async (args: any) => {
      return new Promise((resolve) => setTimeout(resolve, 5));
    }
  }
} as any;

const syncService = new SyncService(mockPrismaService);

async function runBenchmark() {
  const changes = {
    prescriptions: {
      created: [],
      updated: [],
      deleted: deletedIds
    }
  };

  console.log(`Starting benchmark for ${MOCK_IDS_COUNT} deletions...`);

  const start = Date.now();
  await syncService.pushChanges(changes);
  const end = Date.now();

  console.log(`Time taken: ${(end - start).toFixed(2)}ms`);
}

describe('Sync Benchmark', () => {
  it('should run benchmark', async () => {
    await runBenchmark();
  }, 30000);
});
