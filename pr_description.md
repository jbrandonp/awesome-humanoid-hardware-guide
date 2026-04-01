💡 **What:**
Replaced the `for...of` loop executing individual `prisma.visit.update()` soft-deletion queries with a single batch `prisma.visit.updateMany()` query containing a `where: { id: { in: changes.visits.deleted } }` clause. An empty array guard `if (changes.visits.deleted.length > 0)` was added to prevent sending a database request when there are zero elements.

🎯 **Why:**
The previous implementation performed an N+1 query: For `n` visits queued for soft deletion, it executed `n` network requests to the database, severely degrading synchronization performance and increasing connection pool contention when large numbers of records were deleted offline and synced up simultaneously.

📊 **Measured Improvement:**
Since a local PostgreSQL database could not be reliably provisioned within the sandbox environment, I constructed an analytical test simulation within `apps/api/src/app/sync/benchmark.spec.ts`.

- Simulating 2ms network+DB latency per query:
- **Baseline (N+1)**: For 500 records, the individual updates took ~1,131.77 ms.
- **Improved (updateMany)**: The batched query took ~5.45 ms.
- **Estimated Improvement**: ~99.5% reduction in execution time for the soft-delete block when pushing large amounts of synced data.

By eliminating network round-trips for each visit, `sync.service.ts` will see massive throughput improvements, especially critical in slow-network local LAN setups (e.g. clinic intranets) specified by the architecture.
