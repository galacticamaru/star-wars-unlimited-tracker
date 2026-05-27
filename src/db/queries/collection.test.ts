// @vitest-environment node
// Wave 0 stub — covers PERF-04 batch helper behavior
// Tests #1-#4 require a live DB connection; kept as it.todo for CI.
// Tests #5-#7 (empty-array guards) are real tests that mock db to assert no DB call is made.
// Full integration validation: manual smoke test after Wave 1 deployment
// Requirement: PERF-04 (batch upsert for Quick Add and CSV Import)
import { describe, it, vi, expect, beforeEach } from 'vitest';
import { batchIncrementVariantCounts, batchUpsertVariantCounts, batchRecomputeTotals } from './collection';

// ---------------------------------------------------------------------------
// Mock the db module so these tests run without a live Neon connection.
// If any test triggers db.insert or db.select, it will throw — confirming
// the empty-array guards prevent any DB call.
// ---------------------------------------------------------------------------
vi.mock('@/db', () => {
  const throwIfCalled = () => {
    throw new Error('db was called unexpectedly — empty-array guard failed');
  };
  return {
    db: {
      insert: throwIfCalled,
      select: throwIfCalled,
      execute: throwIfCalled,
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('batchIncrementVariantCounts()', () => {
  it.todo('batchIncrementVariantCounts increments existing count additively (count + EXCLUDED.count) on conflict');
  it.todo('batchIncrementVariantCounts inserts new row with given count when no conflict');

  it('returns early without throwing when items array is empty', async () => {
    // Should complete without throwing (guard returns before any db call)
    await expect(batchIncrementVariantCounts([], 1)).resolves.toBeUndefined();
  });
});

describe('batchUpsertVariantCounts()', () => {
  it.todo('batchUpsertVariantCounts overwrites existing count (EXCLUDED.count) on conflict');

  it('returns early without throwing when items array is empty', async () => {
    await expect(batchUpsertVariantCounts([], 1)).resolves.toBeUndefined();
  });
});

describe('batchRecomputeTotals()', () => {
  it.todo('batchRecomputeTotals computes SUM per cardDefinitionId across multiple definitions in one query and upserts user_collections');

  it('returns early without throwing when cardDefinitionIds array is empty', async () => {
    await expect(batchRecomputeTotals([], 1)).resolves.toBeUndefined();
  });
});
