# Phase 34: Card Sync Reliability - Pattern Map

**Mapped:** 2026-08-16
**Files analyzed:** 9
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/lib/sync/upsert-cards.ts` | service | CRUD (batch write) | `src/db/queries/collection.ts:298-360` (`batchIncrementVariantCounts`, `batchUpsertVariantCounts`) | exact — same `onConflictDoUpdate` shape, same codebase |
| `src/lib/sync/prices.ts` | service | CRUD (batch write) | `src/db/queries/collection.ts:298-360` (chunk-and-guard shape) + Drizzle's documented `CASE WHEN` bulk-update pattern (no in-repo analog for multi-value update) | role-match (write shape); no exact in-repo analog for the CASE-WHEN update |
| `src/lib/sync/set-list.ts` (new, recommended) | utility | transform | `src/lib/sync/upsert-cards.ts:62`, `:195` (the two existing token-filter sites being collapsed) | exact — this is a pure extraction, not a new pattern |
| `src/lib/sync/chunk.ts` (new, recommended) | utility | transform | none in-repo (RESEARCH confirms no existing `chunk()` helper) | no analog — new utility, trivial |
| `src/app/api/cron/sync-cards/route.ts` | route | request-response | itself (existing shape kept, verdict logic added) | exact — modify in place |
| `src/app/api/cron/sync-status/route.ts` (new) | route | request-response | `src/app/api/cron/sync-cards/route.ts:1-14` (auth guard) + `src/app/api/collection/starter-deck/route.ts:33-51` (batch-read query shape) | role-match — composed from two analogs |
| `src/app/api/collection/starter-deck/route.ts` | route | request-response | itself (modify in place — silent skip becomes reported skip) | exact |
| `src/data/starter-decks.ts` | model/data | CRUD (static data) | itself; verification pattern from `scripts/validate-spotlight-numbers.ts` | exact for data shape; the verification script is the closest analog for the *check*, not the data file |
| `__tests__/starter-decks-resolve.test.ts` (new) | test | request-response (DB read) | `scripts/validate-spotlight-numbers.ts` (only real-DB-access precedent) + `__tests__/cron-route.test.ts` (Vitest test file shape/imports) | role-match — no existing DB-backed Vitest test exists; this establishes a new path |

## Pattern Assignments

### `src/lib/sync/upsert-cards.ts` (service, batch CRUD)

**Analog:** `src/db/queries/collection.ts:298-317` (`batchIncrementVariantCounts`)

**Imports pattern** (`collection.ts:1-4`):
```typescript
import { db } from '@/db';
import { userCollections, userPrintingCollections, cardPrintings, cardDefinitions, userTradeOfferings } from '@/db/schema';
import { sql, eq, and, gt, inArray, asc, notIlike } from 'drizzle-orm';
```
`upsert-cards.ts` already imports `db`, `cardDefinitions`, `cardPrintings`, `sql` — no new import shape needed, just add `chunk` from the new `chunk.ts` helper.

**Core batch-upsert pattern** (`collection.ts:298-317`, to replace `upsert-cards.ts:96-138` and `:144-171`):
```typescript
export async function batchIncrementVariantCounts(
  items: Array<{ cardPrintingId: number; qtyToAdd: number }>,
  userId: number
) {
  if (items.length === 0) return;
  return db
    .insert(userPrintingCollections)
    .values(items.map(({ cardPrintingId, qtyToAdd }) => ({
      userId,
      cardPrintingId,
      count: qtyToAdd,
    })))
    .onConflictDoUpdate({
      target: [userPrintingCollections.userId, userPrintingCollections.cardPrintingId],
      set: {
        count: sql`${userPrintingCollections.count} + EXCLUDED.count`,
        updatedAt: new Date(),
      },
    });
}
```
**Empty-array guard is mandatory** — copy `if (items.length === 0) return;` verbatim at every new chunk call site (Drizzle throws on `.values([])`).

**Existing single-row shape being replaced** (`upsert-cards.ts:96-138`, definitions — keep the exact `target`/`set` field list, only wrap `.values({...})` → `.values([...chunk])`):
```typescript
const [def] = await db
  .insert(cardDefinitions)
  .values({ swudbId: anchorCollectorNumber, name: anchor.Name, /* ...17 fields... */ updatedAt: sql`now()` })
  .onConflictDoUpdate({
    target: cardDefinitions.swudbId,
    set: { name: sql`excluded.name`, /* ...same fields... */ updatedAt: sql`now()` },
  })
  .returning({ id: cardDefinitions.id });
```
Note: this single-row form uses `.returning({ id })` because the printing insert loop needs `def.id` per group. Batching definitions breaks that 1:1 `def.id` → printings link — the plan must collect all definition rows for a set, batch-upsert with `.returning({ id, swudbId })`, then build a `swudbId → id` map before batching printings. This is a **semantics-preserving but structurally different** batching than `collection.ts`'s fire-and-forget batch helpers (which don't need the inserted ids back). Flag this for the planner: it's the one place this phase's batching isn't a pure copy-paste of the `collection.ts` shape.

**Printings upsert being replaced** (`upsert-cards.ts:146-170`) — same `onConflictDoUpdate` shape, `target: [cardPrintings.setCode, cardPrintings.collectorNumber]`, batch identically.

**Token-set filter to extract** (`upsert-cards.ts:62`, canonical — card-type-level check, stays in `upsertCards()`; `upsert-cards.ts:195`, set-list-level check, moves to `set-list.ts`):
```typescript
// upsert-cards.ts:62 — stays here (different filter: card.Type, not set.setId)
if (setId.startsWith('T') && setId.length > 3 && !setId.match(/^TS\d{2}$/)) return 0;

// upsert-cards.ts:195 — this regex logic moves to src/lib/sync/set-list.ts
const nonTokenSets = sets.filter((s) => !(s.setId.startsWith('T') && s.setId.length > 3 && !s.setId.match(/^TS\d{2}$/)));
```

**Sync result / failure tracking** (`upsert-cards.ts:38-42`, `197-212`) — `SyncResult` interface and `setsSucceeded` counter already exist; SYNC-03 needs no new plumbing here per RESEARCH, only the *caller* (`route.ts`) comparing `setsProcessed` vs `setsTotal`.

---

### `src/lib/sync/prices.ts` (service, batch CRUD)

**Analog for batch guard/shape:** `src/db/queries/collection.ts:298-317` (empty-array guard, chunk-map-then-write shape)

**Analog for the CASE-WHEN write (no in-repo precedent — Drizzle official docs, per RESEARCH):**
```typescript
import { SQL, inArray, sql } from 'drizzle-orm';

function buildCaseUpdate(column: PgColumn, rows: Array<{ swudbId: string; value: unknown }>): SQL {
  const chunks: SQL[] = [sql`(case`];
  for (const row of rows) {
    chunks.push(sql`when ${cardDefinitions.swudbId} = ${row.swudbId} then ${row.value}`);
  }
  chunks.push(sql`end)`);
  return sql.join(chunks, sql.raw(' '));
}
```
`sql.join`'s separator argument must be `sql.raw(' ')`, not a plain string (Pitfall 4 in RESEARCH).

**Current per-card write being replaced** (`prices.ts:78-89`):
```typescript
const result = await db.update(cardDefinitions)
  .set({ priceEur, priceUsd, pricesUpdatedAt: now })
  .where(eq(cardDefinitions.swudbId, swudbId))
  .returning({ id: cardDefinitions.id });
if (result.length > 0) setUpdated++;
```
Batched form counts `chunk.length` (or `.returning()` row count per chunk) instead of per-row increments.

**Hardcoded set list to remove** (`prices.ts:59`):
```typescript
const activeSets = ['SOR', 'SHD', 'TWI', 'JTL', 'SEC', 'LAW', 'IBH'];
```
Replace with the same `getNonTokenSets()` (or equivalent) call `syncAllCards()` uses — see `set-list.ts` below.

**Swallowed per-set catch to fix** (`prices.ts:101-103`):
```typescript
} catch (error) {
  console.error(`Error syncing prices for set ${setCode}:`, error);
}
```
Per D-07, this must now surface into a `setsProcessed`/`setsTotal` total returned from `syncPrices()`, mirroring `SyncResult` in `upsert-cards.ts:38-42` (same interface shape, don't invent a new one).

**Sleep to remove verbatim** (`prices.ts:96-100`):
```typescript
if (setCode !== activeSets[activeSets.length - 1]) {
  console.log('Waiting 1s for rate limit...');
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

---

### `src/lib/sync/set-list.ts` (new utility)

**Analog:** the two existing filter sites being collapsed — `upsert-cards.ts:195` (regex) reused verbatim as the extraction target; `upsert-cards.ts:186-190` (the `/sets` fetch + error-check shape) is the fetch pattern to preserve:
```typescript
const setsResponse = await fetch('https://api.swu-db.com/sets');
if (!setsResponse.ok) {
  throw new Error(`Failed to fetch sets: ${setsResponse.status}`);
}
const sets: SWUSet[] = await setsResponse.json();
```
Export `SWUSet` interface (`upsert-cards.ts:32-36`) from here or re-export from `upsert-cards.ts` — planner's call per RESEARCH Open Question 2.

---

### `src/app/api/cron/sync-cards/route.ts` (route, request-response)

**Analog:** itself — existing shape is correct, only the verdict logic and `maxDuration` are new.

**Auth guard to keep unchanged** (`route.ts:6-14`):
```typescript
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Guard: cronSecret must be set AND header must match exactly
  // Checking !cronSecret first prevents empty-string bypass
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }
```

**maxDuration export (new — Next.js 16.2.4, confirmed against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md` per RESEARCH):**
```typescript
export const maxDuration = 300; // Hobby + Fluid Compute ceiling
```

**revalidateTag call to keep, fire unconditionally** (`route.ts:26`):
```typescript
revalidateTag('cards', 'max');
```
Per CONTEXT's Claude's Discretion note, this must fire even on a partial-failure verdict — move it so it executes regardless of the `success` computation, not inside a conditional branch.

**Response shape to replace** (`route.ts:30-35`, the `success: true` bug):
```typescript
return Response.json({
  success: true,
  cards: cardResult,
  prices: priceResult,
  duration: `${duration}s`
});
```
New verdict logic compares `cardResult.setsProcessed`/`setsTotal` and the new `priceResult.setsProcessed`/`setsTotal`, sets `status: success ? 200 : 500`.

**Error response to keep unchanged** (`route.ts:37-39`, generic message — matches Security Domain guidance against leaking internals):
```typescript
} catch (error) {
  console.error('Sync failed:', error);
  return new Response('Sync failed', { status: 500 });
}
```

---

### `src/app/api/cron/sync-status/route.ts` (new route)

**Analog 1 — auth guard, reuse verbatim:** `src/app/api/cron/sync-cards/route.ts:6-14` (block quoted above).

**Analog 2 — batch-read/aggregate query shape:** `src/app/api/collection/starter-deck/route.ts:36-51`:
```typescript
const printings = await db
  .select({
    id: cardPrintings.id,
    collectorNumber: cardPrintings.collectorNumber,
    cardDefinitionId: cardPrintings.cardDefinitionId,
  })
  .from(cardPrintings)
  .where(
    and(
      inArray(cardPrintings.collectorNumber, collectorNumbers),
      eq(cardPrintings.variantType, 'Normal')
    )
  );

const printingByNumber = new Map(printings.map((p) => [p.collectorNumber, p]));
```
The status route's `MAX(updated_at) GROUP BY set_code` aggregate is the same "one query, no per-row round trip" shape, adapted to `sql<string>\`max(...)\`` + `.groupBy()` (no existing `groupBy` analog in-repo — this is a small, low-risk Drizzle-native extension per RESEARCH Code Examples).

**Response shape convention** — no existing `GET` route in `src/app/api/` returns a "verdict + detail array" JSON shape; closest is the sync-cards route's flat `{ success, cards, prices, duration }` object (`route.ts:30-35`) as the general "plain `Response.json`, no wrapper envelope" convention to follow. Error path should reuse the generic-message convention from `route.ts:37-39` (no raw error objects — Security Domain guidance).

---

### `src/app/api/collection/starter-deck/route.ts` (route, request-response — modify in place)

**Analog:** itself. The batch-read shape at `route.ts:33-51` (quoted above) is already correct and stays unchanged.

**Silent skip to replace** (`route.ts:58-63`):
```typescript
for (const card of deck.cards) {
  const printing = printingByNumber.get(card.collectorNumber);
  if (!printing) {
    // Card not found in DB — skip silently (could be a data gap)
    continue;
  }
  batchItems.push({ cardPrintingId: printing.id, qtyToAdd: card.qty });
  affectedDefinitionIds.add(printing.cardDefinitionId);
  cardsAdded += card.qty;
}
```
Per D-16, collect skipped `collectorNumber`s into an array alongside the existing loop and include it in the response.

**Response shape to extend** (`route.ts:73`):
```typescript
return Response.json({ cardsAdded });
```
→ becomes `{ cardsAdded, skipped: string[] }` (or similar) — additive, does not change existing success path shape for callers that only read `cardsAdded`.

---

### `__tests__/starter-decks-resolve.test.ts` (new — D-15 DB-backed test)

**Analog 1 — only real-DB-access precedent in the repo:** `scripts/validate-spotlight-numbers.ts` (full file quoted above). Key pattern to port: `db.select({ collectorNumber }).from(cardPrintings).where(inArray(cardPrintings.collectorNumber, allNumbers))`, then `new Set(rows.map(...))` diff against the input list.

**Analog 2 — Vitest test file shape/imports:** `__tests__/cron-route.test.ts:1-9`:
```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
```
No `vi.mock('@/db', ...)` here — this is the one test that must NOT mock `@/db` (that's the entire point of D-15). Confirmed: every other test file in the repo (`prices.test.ts`, `upsert-cards.test.ts`, `cron-route.test.ts`) mocks `@/db` or the sync functions; none establish a real-DB Vitest path today.

**Teardown — critical, no existing Vitest analog, must be new:** per RESEARCH Pitfall 6, use `afterAll(() => pool.end())` (or the equivalent close call on the `db`/`Pool` client from `src/db/index.ts`), NOT `process.exit(0)` (that pattern belongs only to standalone `tsx` scripts like `validate-spotlight-numbers.ts:53,58`, and would kill other tests sharing the Vitest worker).

**Config change required (no analog — new):** `vitest.config.mts` needs `test.env: loadEnv(mode, process.cwd(), '')` added so `DATABASE_URL` reaches `process.env` inside the test the same way `src/db/index.ts` reads it at runtime. Current config (full file, 12 lines):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true,
  },
});
```

**Scope — do not hardcode a deck count** (RESEARCH Pitfall 7): iterate `starterDecks.flatMap(d => d.cards)`, not a fixed-length assertion; the CONTEXT's "15 decks" figure is stale (actual: 22).

---

## Shared Patterns

### CRON_SECRET Bearer guard
**Source:** `src/app/api/cron/sync-cards/route.ts:6-14`
**Apply to:** `sync-cards/route.ts` (unchanged), `sync-status/route.ts` (new — copy verbatim, including the `!cronSecret` empty-string-bypass check ordering)
```typescript
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Batch upsert / empty-array guard
**Source:** `src/db/queries/collection.ts:298-317` (Phase 25 / PERF-04)
**Apply to:** `upsert-cards.ts` (definitions + printings chunks), `prices.ts` (price-update chunks)
```typescript
if (items.length === 0) return;
return db.insert(table).values(items.map(...)).onConflictDoUpdate({
  target: ...,
  set: { col: sql`${table.col} + EXCLUDED.col` /* or sql`excluded.col` for overwrite */, updatedAt: new Date() },
});
```

### Generic error response (no internal detail leakage)
**Source:** `src/app/api/cron/sync-cards/route.ts:36-39`
**Apply to:** `sync-status/route.ts`, `starter-deck/route.ts` (already follows this)
```typescript
} catch (error) {
  console.error('<Context> failed:', error);
  return new Response('<Context> failed', { status: 500 });
}
```

### Batch-read collect-ids → single inArray query → Map lookup
**Source:** `src/app/api/collection/starter-deck/route.ts:33-51`
**Apply to:** `sync-status/route.ts`'s per-set aggregate query, any future batch-read in this phase
```typescript
const rows = await db.select({...}).from(table).where(inArray(table.col, ids));
const byKey = new Map(rows.map((r) => [r.key, r]));
```

### Post-sync cache invalidation
**Source:** `src/app/api/cron/sync-cards/route.ts:26`
**Apply to:** `sync-cards/route.ts` only — must fire unconditionally (Claude's Discretion), not gated behind the new verdict computation
```typescript
revalidateTag('cards', 'max');
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/sync/chunk.ts` | utility | transform | RESEARCH confirms no existing `chunk<T>()` helper anywhere in the codebase; trivial new utility, no pattern to copy |
| CASE-WHEN bulk update in `prices.ts` | service | CRUD (batch write) | No in-repo precedent for "update N rows, each with different values, in one round trip" — every existing write is single-row `.set()` or the additive/overwrite `onConflictDoUpdate` shape in `collection.ts`, which doesn't fit an UPDATE with per-row differing values. Use Drizzle's official documented pattern instead (quoted above) |
| `vitest.config.mts` `loadEnv` change | config | — | No existing test in the suite reads real env vars; this is genuinely new infrastructure, not a pattern extension |
| `sync-status/route.ts`'s `GROUP BY` aggregate query | route/query | request-response | No existing route or query file in `src/db/queries/` uses `.groupBy()` with a `MAX()` aggregate; closest shape is the flat `inArray` select in `starter-deck/route.ts`, but the aggregate itself has no analog |

## Metadata

**Analog search scope:** `src/lib/sync/`, `src/db/queries/`, `src/app/api/cron/`, `src/app/api/collection/`, `__tests__/`, `scripts/`
**Files scanned:** `upsert-cards.ts`, `prices.ts`, `prices.test.ts`, `sync-cards/route.ts`, `starter-deck/route.ts`, `collection.ts` (queries), `cron-route.test.ts`, `upsert-cards.test.ts`, `validate-spotlight-numbers.ts`, `vitest.config.mts`
**Pattern extraction date:** 2026-08-16
