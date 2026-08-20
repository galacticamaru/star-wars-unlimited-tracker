// @vitest-environment node
//
// G-34-1: proves — or disproves — that the CASE WHEN UPDATE buildCaseUpdate()
// builds in src/lib/sync/prices.ts is accepted by Postgres against the
// integer `price_eur` / `price_usd` columns. This is one of two test files in
// the repo that deliberately does NOT mock '@/db' (the other is
// __tests__/starter-decks-resolve.test.ts): executing the generated SQL
// against a real server is its entire purpose. src/lib/sync/prices.test.ts
// mocks '@/db' at module scope, so it can never observe this defect — see
// .planning/phases/34-card-sync-reliability/34-09-PLAN.md.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { inArray, sql } from 'drizzle-orm';
import { db, pool } from '@/db';
import { cardDefinitions } from '@/db/schema';
import { buildCaseUpdate } from '@/lib/sync/prices';
import { SYNC_CHUNK_SIZE } from '@/lib/sync/chunk';

// Sentinel prefix: no upstream Set-Number pair can produce this — it is not a
// real SWU set code — and it names the gap this guard exists to close so
// anyone who greps the database for it understands why it's there.
const SENTINEL_PREFIX = 'G341-GUARD';

interface ProbeRow {
  swudbId: string;
  priceEur: number | null;
  priceUsd: number | null;
}

/**
 * Runs one probe batch through the exact same three-column assignment shape
 * (`priceEur`, `priceUsd`, `pricesUpdatedAt`) and `inArray` filter the
 * production call site in syncPrices() issues. The type error G-34-1 guards
 * against is raised by the assignment targets, so a guard assigning to
 * different columns would guard nothing.
 */
async function runProbe(rows: ProbeRow[]) {
  return db
    .update(cardDefinitions)
    .set({
      priceEur: buildCaseUpdate(rows, 'priceEur'),
      priceUsd: buildCaseUpdate(rows, 'priceUsd'),
      pricesUpdatedAt: sql`now()`,
    })
    .where(
      inArray(
        cardDefinitions.swudbId,
        rows.map((r) => r.swudbId)
      )
    )
    .returning({ id: cardDefinitions.id });
}

describe('buildCaseUpdate() CASE branch types against real Postgres (G-34-1)', () => {
  beforeAll(async () => {
    // A check that cannot run must go red, never green (T-34-20). An absent
    // DATABASE_URL is a setup failure to fail loudly on, not a reason to
    // skip this suite.
    if (!process.env.DATABASE_URL) {
      throw new Error(
        '__tests__/price-case-update-types.test.ts requires a live database ' +
          "connection (it deliberately does not mock '@/db'). Add DATABASE_URL " +
          "to .env.local — vitest.config.mts's loadEnv(mode, cwd, 'DATABASE_') " +
          'supplies it to the test environment automatically once present.'
      );
    }

    // Prove the sentinel keys match no existing row before relying on
    // zero-rows-returned as the "wrote nothing" signal in every case below.
    const existing = await db
      .select({ swudbId: cardDefinitions.swudbId })
      .from(cardDefinitions)
      .where(inArray(cardDefinitions.swudbId, [`${SENTINEL_PREFIX}-1`, `${SENTINEL_PREFIX}-2`]));
    expect(existing).toEqual([]);
  });

  afterAll(async () => {
    // Closes the WebSocket Pool opened by src/db/index.ts so this Vitest
    // worker exits. Do NOT force-terminate the Node process here — that
    // would abort sibling test files sharing the worker.
    await pool.end();
  });

  it('the production CASE WHEN update parses against the integer price columns and matches zero rows', async () => {
    const rows: ProbeRow[] = [
      { swudbId: `${SENTINEL_PREFIX}-1`, priceEur: 100, priceUsd: 109 },
      { swudbId: `${SENTINEL_PREFIX}-2`, priceEur: null, priceUsd: null },
    ];
    const returned = await runProbe(rows);
    expect(returned).toEqual([]);
  });

  it('an all-NULL price row is accepted against the nullable integer columns', async () => {
    const rows: ProbeRow[] = [{ swudbId: `${SENTINEL_PREFIX}-null`, priceEur: null, priceUsd: null }];
    const returned = await runProbe(rows);
    expect(returned).toEqual([]);
  });

  it('a full SYNC_CHUNK_SIZE batch parses within the bind-parameter ceiling', async () => {
    const rows: ProbeRow[] = Array.from({ length: SYNC_CHUNK_SIZE }, (_, i) => {
      const priced = i % 2 === 0;
      return {
        swudbId: `${SENTINEL_PREFIX}-chunk-${i}`,
        priceEur: priced ? 100 + i : null,
        priceUsd: priced ? 109 + i : null,
      };
    });
    expect(rows.length).toBe(SYNC_CHUNK_SIZE);

    const returned = await runProbe(rows);
    expect(returned).toEqual([]);
  });
});
