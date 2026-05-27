// @vitest-environment node
// Wave 0 stub — covers PERF-04 batch helper behavior
// These tests require a live DB connection; mark as todo for CI
// Full integration validation: manual smoke test after Wave 1 deployment
// Requirement: PERF-04 (batch upsert for Quick Add and CSV Import)
import { describe, it } from 'vitest';

describe('batchIncrementVariantCounts()', () => {
  it.todo('batchIncrementVariantCounts increments existing count additively (count + EXCLUDED.count) on conflict');
  it.todo('batchIncrementVariantCounts inserts new row with given count when no conflict');
  it.todo('batchIncrementVariantCounts returns early without throwing when items array is empty');
});

describe('batchUpsertVariantCounts()', () => {
  it.todo('batchUpsertVariantCounts overwrites existing count (EXCLUDED.count) on conflict');
  it.todo('batchUpsertVariantCounts returns early without throwing when items array is empty');
});

describe('batchRecomputeTotals()', () => {
  it.todo('batchRecomputeTotals computes SUM per cardDefinitionId across multiple definitions in one query and upserts user_collections');
  it.todo('batchRecomputeTotals returns early without throwing when cardDefinitionIds array is empty');
});
