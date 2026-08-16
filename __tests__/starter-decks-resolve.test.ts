// @vitest-environment node
//
// DEBT-05: proves — or disproves — that every collector number referenced by
// every deck in starterDecks[] resolves to a Normal-variant row in
// card_printings. This is the one test file in the repo that does NOT mock
// '@/db': proving the data against the real catalog is its entire purpose.
// Read-only. See .planning/phases/34-card-sync-reliability/34-04-PLAN.md.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { inArray, eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { pool } from '@/db';
import { cardPrintings } from '@/db/schema';
import { starterDecks } from '@/data/starter-decks';
import { chunk, SYNC_CHUNK_SIZE } from '@/lib/sync/chunk';

interface DeckCardPair {
  deckId: string;
  collectorNumber: string;
}

/**
 * Flattens every deck's cards into (deckId, collectorNumber) pairs. A
 * collector number referenced by several decks appears once per referencing
 * deck here — attribution, not deduplication. Deduplication for the query
 * happens separately, over the flattened output.
 */
function flattenPairs(decks: typeof starterDecks): DeckCardPair[] {
  return decks.flatMap((deck) =>
    deck.cards.map((card) => ({ deckId: deck.id, collectorNumber: card.collectorNumber }))
  );
}

/**
 * Mirrors the `variantType = 'Normal'` filter applied by the production
 * quick-add route (src/app/api/collection/starter-deck/route.ts:44-47).
 * Pure so the classification rule is unit-testable without a database round
 * trip: a collector number that exists only as a non-Normal variant (Foil,
 * Hyperspace, Showcase, ...) must never enter the resolved set.
 */
function buildResolvedSet(
  rows: { collectorNumber: string; variantType: string }[]
): Set<string> {
  return new Set(rows.filter((row) => row.variantType === 'Normal').map((row) => row.collectorNumber));
}

/**
 * Reports every (deckId, collectorNumber) pair whose number is absent from
 * the resolved set — a full report, not a first-failure abort. Sorted
 * deterministically by deckId then collectorNumber so a red run's output is
 * stable across executions.
 */
function computeUnresolved(pairs: DeckCardPair[], resolved: Set<string>): DeckCardPair[] {
  return pairs
    .filter((pair) => !resolved.has(pair.collectorNumber))
    .sort((a, b) =>
      a.deckId === b.deckId
        ? a.collectorNumber.localeCompare(b.collectorNumber)
        : a.deckId.localeCompare(b.deckId)
    );
}

describe('starter deck collector-number resolution (DEBT-05)', () => {
  beforeAll(() => {
    // A check that cannot run must go red, never green (T-34-20). An absent
    // DATABASE_URL is a setup failure to fail loudly on, not a reason to
    // skip this suite.
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL is not set. This test requires a live database connection ' +
          "(it deliberately does not mock '@/db'). Add DATABASE_URL to .env.local — " +
          "vitest.config.mts's loadEnv(mode, cwd, 'DATABASE_') supplies it to the " +
          'test environment automatically once present.'
      );
    }
    // Never compare against a fixed count — the CONTEXT figure of 15 is
    // stale; starterDecks[] holds 22 decks / 746 unique collector numbers
    // today and both will keep growing. Assert non-zero instead, so an
    // emptied data file cannot produce a vacuous pass.
    expect(starterDecks.length).toBeGreaterThan(0);
    expect(flattenPairs(starterDecks).length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    // Closes the WebSocket Pool opened by src/db/index.ts so this Vitest
    // worker exits. Do NOT force-terminate the Node process here — that
    // would abort sibling test files sharing the worker (unlike the
    // standalone tsx scripts in scripts/, which own their whole process).
    await pool.end();
  });

  it('resolves every collector number in every starter deck to a Normal printing', async () => {
    const pairs = flattenPairs(starterDecks);
    const uniqueNumbers = [...new Set(pairs.map((pair) => pair.collectorNumber))];
    expect(uniqueNumbers.length).toBeGreaterThan(0);

    const resolved = new Set<string>();
    let totalQueried = 0;
    for (const batch of chunk(uniqueNumbers, SYNC_CHUNK_SIZE)) {
      const rows = await db
        .select({ collectorNumber: cardPrintings.collectorNumber })
        .from(cardPrintings)
        .where(
          and(
            inArray(cardPrintings.collectorNumber, batch),
            eq(cardPrintings.variantType, 'Normal')
          )
        );
      totalQueried += batch.length;
      for (const row of rows) resolved.add(row.collectorNumber);
    }

    // A zero-length query (nothing actually looked up) would let a vacuous
    // pass through even with a non-empty starterDecks[] array.
    expect(totalQueried).toBeGreaterThan(0);

    const unresolved = computeUnresolved(pairs, resolved);

    if (unresolved.length > 0) {
      const report = unresolved
        .map((pair) => `  ${pair.deckId}: ${pair.collectorNumber}`)
        .join('\n');
      throw new Error(
        `${unresolved.length} collector number(s) failed to resolve to a Normal printing:\n${report}`
      );
    }
    expect(unresolved).toEqual([]);
  });

  it('classifies a collector number that exists only as a non-Normal variant as unresolved (no database round trip)', () => {
    const pairs: DeckCardPair[] = [
      { deckId: 'law-jabba-the-hutt', collectorNumber: 'LAW-999' },
      { deckId: 'law-leia-organa', collectorNumber: 'LAW-999' },
      { deckId: 'sor-luke', collectorNumber: 'SOR-005' },
    ];
    // LAW-999 exists in the catalog, but only as a Foil printing — the
    // Normal-only filter must exclude it from the resolved set, exactly as
    // starter-deck/route.ts:44-47 would skip it at runtime.
    const resolved = buildResolvedSet([
      { collectorNumber: 'LAW-999', variantType: 'Foil' },
      { collectorNumber: 'SOR-005', variantType: 'Normal' },
    ]);

    const unresolved = computeUnresolved(pairs, resolved);

    expect(unresolved).toEqual([
      { deckId: 'law-jabba-the-hutt', collectorNumber: 'LAW-999' },
      { deckId: 'law-leia-organa', collectorNumber: 'LAW-999' },
    ]);
  });
});
