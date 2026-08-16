# Phase 34: Card Sync Reliability - Research

**Researched:** 2026-08-16
**Domain:** Vercel serverless cron reliability, Postgres/Drizzle batch upserts, Next.js route-segment config, Vitest DB-backed testing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Freshness surface (SYNC-04)**
- **D-01:** Freshness is a secret-guarded JSON `GET` route behind the same `Bearer ${CRON_SECRET}` guard at `src/app/api/cron/sync-cards/route.ts:12`. No in-app admin page.
- **D-02:** "Last synced" is derived from existing data — `MAX(updated_at) GROUP BY set_code` over `card_printings`. No new table, no migration.
- **D-03:** The route returns a verdict plus per-set detail: top-level `fresh` boolean (24h window) plus per-set `{ setCode, lastSyncedAt, ageHours, stale }`.
- **D-04:** The route is DB-only. It must not fetch swu-db.

**Failure semantics (SYNC-03)**
- **D-05:** A set that fails to fetch does not abort the run. Keep `continue` at `upsert-cards.ts:202-205`; the run ends non-2xx whenever `setsProcessed < setsTotal`. No "mostly succeeded" success threshold.
- **D-06:** Failure detection is pull, not push. No Discord/Slack/email. The status route is the notification substrate.
- **D-07:** One verdict covers cards and prices. Response carries `cards { processed, total }` and `prices { processed, total }`; a shortfall in either makes the run non-2xx. Requires `prices.ts:101-103` to stop swallowing per-set errors and report a total.
- **D-08:** A soft deadline guards against a silent kill. Track elapsed time; at ~80% of `maxDuration`, stop starting new sets and return the non-2xx partial-failure report. Reports and stops — does not resume (SYNC-05 territory).
- **D-09:** `maxDuration` must be set explicitly on the cron route (no export today). Confirm the Hobby ceiling and whether Fluid Compute changes it before picking a number.

**Price sync (in scope)**
- **D-10:** The hardcoded `activeSets` array at `prices.ts:59` is replaced by the same non-token set list the card sync already fetches (currently omits ASH, LOF, TS26).
- **D-11:** Price writes are batched too. `prices.ts:78-85` issues one `UPDATE` per card by `swudbId`. Collapse to a single multi-row update per set.
- **D-12:** The hardcoded 1s inter-set sleep at `prices.ts:96-100` is removed (unverified guess, not a documented requirement; `upsert-cards.ts:201` hits the same host with no delay).

**DEBT-05 — quick-add deck data**
- **D-13:** DEBT-05 is verify-and-close, not rework. The 9 "unknowns" were `LAW-???` placeholders filled in by commit `eeb1b6b` (2026-05-23). What was never done is proving the substituted numbers resolve. Query the catalog, confirm, correct only what fails.
- **D-14:** Verification covers all quick-add decks in `starterDecks[]`, not just the two LAW ones (CONTEXT.md text says "all 15" — **research found this count is stale; see Assumptions Log A1**).
- **D-15:** The check is a committed test in the existing Vitest suite that walks `starterDecks[]` and asserts every `collectorNumber` resolves against `card_printings` — not a one-off script. Known cost: this needs a DB-backed test path, and the suite may not have one today. Flag if disproportionate.
- **D-16:** The runtime silent skip is replaced by a reported skip — return the skipped collector numbers so the UI can report "added 47 of 50, 3 unavailable."

### Claude's Discretion
- `revalidateTag('cards')` on a partial run — should still fire even when the run's verdict is failure (recorded as an assumption, not put to the user).
- Correcting `CONCERNS.md:112` (the DEBT-05 entry is wrong on three counts) — update it to match D-13 as part of this phase.
- Batch sizing for the multi-row upserts (Neon/Postgres parameter limits, chunking strategy) is an implementation choice for the planner — **this research provides concrete numbers below.**

### Deferred Ideas (OUT OF SCOPE)
- Incremental/resumable sync — per-set checkpointing, re-sync only changed sets, splitting cards/prices into separate invocations (SYNC-05)
- A second cron job (Vercel Hobby allows 1/day)
- Fetch timeouts and retry/backoff against swu-db (`CONCERNS.md:142-147`)
- Push notification on sync failure (Discord/Slack/email)
- A sync-run history table
- Upstream count verification (comparing DB count to API's `numberCards`)
- Retry-on-429 replacing the removed sleep
- The `Normal`-variant-only price filter and the fixed 0.92 USD→EUR proxy
- Structured logging / error tracking
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SYNC-01 | Nightly sync processes every non-token set within its execution budget via batched multi-row upserts | Postgres param-limit math + chunk sizes (below), reuse of `src/lib/collection.ts` batch-upsert pattern, `maxDuration=300` ceiling |
| SYNC-02 | Every set reflects upstream data within 24h of a successful run | D-10 set-list unification closes the ASH/LOF/TS26 gap; batching keeps the run inside budget so "successful run" actually happens nightly |
| SYNC-03 | A run that doesn't process every set reports failure, not success | `route.ts:30-35` fix — compare `setsProcessed` vs `setsTotal` (cards) and processed vs total (prices), non-2xx on shortfall |
| SYNC-04 | Operator can see per-set freshness without querying Neon by hand | `MAX(updated_at) GROUP BY set_code` query design (below), reuse of `CRON_SECRET` Bearer guard |
| DEBT-05 | LAW's 9 previously-unresolved cards re-matched; deck list corrected | `starterDecks[]` structure enumerated (below); actual deck count is 22, not 15 — see Assumptions Log A1; DB-backed Vitest path researched for D-15 |
</phase_requirements>

## Summary

This phase touches four small, well-scoped files (`upsert-cards.ts`, `prices.ts`, the cron `route.ts`, `starter-decks.ts`) and adds two new artifacts (a status route, a Vitest resolution test). None of it requires a new package — Drizzle 0.45.2, `@neondatabase/serverless` 1.1.0, and Vitest 4.1.5 are already installed and already do everything this phase needs. The core technical unlock is **batching**: `upsertCards()` currently awaits ~8,400 sequential `INSERT ... ON CONFLICT` round trips (one per card definition, one per printing), which is the entire cause of the timeout. Phase 25 already solved this exact problem for the collection write path (`src/lib/collection.ts` — `batchIncrementVariantCounts`, `batchUpsertVariantCounts`, `batchRecomputeTotals`), and that pattern — `.values([...]).onConflictDoUpdate({ set: { col: sql`excluded.col` } })` — extends directly to `upsert-cards.ts` with no new Drizzle capability required.

Vercel's Hobby tier, with Fluid Compute (default-on platform-wide since April 2025), gives a hard **300-second** ceiling on `maxDuration` — this is both the default *and* the maximum on Hobby, so `export const maxDuration = 300` is the correct, final number; there is no higher tier to request on this plan. Postgres's 65,535 bind-parameter ceiling translates to roughly 3,855 rows/statement for `card_definitions` (17 columns) and 7,281 rows/statement for `card_printings` (9 columns) — comfortably above any single set's card count (measured average: ~79 definitions and ~254 printings per set across 33 sets), so a flat 500-row chunk size is a safe, simple, reusable constant for both tables and for the price `UPDATE`.

The price-sync batching (D-11) is best done with Drizzle's officially documented `CASE WHEN` bulk-update pattern (`sql.join` + `.update().set({ col: caseExpr })`), not a hand-rolled `UPDATE ... FROM (VALUES ...)` — it stays inside the query builder (matching this codebase's zero use of raw `db.execute()`) and avoids the explicit-cast pitfalls a VALUES list has with nullable integer columns.

DEBT-05's investigation surfaced one correction to the locked CONTEXT: `starterDecks[]` actually contains **22 decks** (746 unique collector numbers), not the "15" cited in D-14 — all 22 need to be in the verification's scope regardless, since the check is cheap once it exists. The DB-backed Vitest path D-15 asks for does not exist today (every existing test mocks `@/db`); the codebase's one precedent for touching a real DB is a standalone `tsx` script with `process.exit(0)` (`scripts/validate-spotlight-numbers.ts` — coincidentally *already* the Phase 33 script this exact pattern should generalize). Establishing a DB-backed Vitest path is real but bounded work (one `vitest.config.mts` change using Vite's `loadEnv`), not disproportionate.

**Primary recommendation:** Reuse the `src/lib/collection.ts` batch-upsert pattern verbatim for `upsert-cards.ts`, chunk at 500 rows for both `card_definitions` and `card_printings`, set `maxDuration = 300`, derive a shared non-token set list once and feed it to both `syncAllCards()` and `syncPrices()`, and use Drizzle's `CASE WHEN` bulk-update pattern for price writes.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Card/printing batch upsert (SYNC-01) | API / Backend (cron route + `src/lib/sync/`) | Database (Postgres bulk INSERT ... ON CONFLICT) | Sync logic and chunking live in the Node runtime; the actual multi-row write is executed as a single Postgres statement per chunk |
| Price batch update (D-11) | API / Backend (`src/lib/sync/prices.ts`) | Database (Postgres bulk UPDATE) | Same split — Node builds the CASE expression, Postgres executes it in one round trip |
| Loud-failure verdict (SYNC-03) | API / Backend (cron route) | — | Pure response-shaping logic; no other tier is involved |
| Freshness status (SYNC-04) | API / Backend (new route) | Database (read-only aggregate query) | DB-only per D-04 — no swu-db fetch, no client-side computation |
| DEBT-05 deck resolution check | API / Backend (Vitest, Node runtime) | Database (read-only `inArray` query) | A build/test-time check against real data, not a runtime user-facing surface |
| Quick-add reported skip (D-16) | API / Backend (`starter-deck/route.ts`) | Browser/Client (UI copy consuming the response) | The response contract is this phase's requirement; UI copy is a thin follow-through only |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `drizzle-orm` | 0.45.2 (installed) | Multi-row `INSERT ... ON CONFLICT DO UPDATE`, `UPDATE ... SET col = CASE WHEN ...` | Already the project's ORM; both patterns needed by this phase are natively supported without new packages |
| `@neondatabase/serverless` | 1.1.0 (installed) | Postgres driver — `drizzle-orm/neon-serverless` `Pool` over WebSocket (see `src/db/index.ts`) | Already in use; supports `db.transaction()`, unlike the HTTP driver |
| `next` | 16.2.4 (installed) | Route Segment Config (`export const maxDuration`) | Already in use; `maxDuration` syntax confirmed unchanged in this Next.js version |
| `vitest` | 4.1.5 (installed) | DB-backed resolution test (D-15) | Already the project's test runner; `loadEnv` env-loading is a documented Vitest/Vite capability, not a new dependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tsx` | 4.21.0 (installed) | Pattern precedent only — `scripts/validate-spotlight-numbers.ts` shows the "connect to real DB, `process.exit(0)`" shape | Reference for how this codebase already talks to a live DB outside Next.js; not needed as a new dependency for the Vitest path |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `CASE WHEN` bulk update (Drizzle-native, query builder) | Raw `UPDATE ... FROM (VALUES ...)` via `db.execute(sql...)` | The VALUES-list form is idiomatic Postgres and slightly more compact SQL text for very large row counts, but requires explicit `::type` casts on every VALUES column (nullable `price_eur`/`price_usd` would otherwise infer as `text` and fail), and this codebase has zero existing `db.execute()` calls — CASE WHEN stays inside `.update().set().where()`, consistent with every other query in the codebase |
| DB-backed Vitest test (D-15's requirement) | Standalone `tsx` script (existing pattern, e.g. `validate-spotlight-numbers.ts`) | A script is faster to write and matches existing precedent, but is not run automatically and doesn't prevent regression the way a committed test does — D-15 explicitly asks for the committed-test property, so the script alternative doesn't satisfy the locked decision even though it's the path of least resistance |

**Installation:**
```bash
# No new packages required for this phase.
```

**Version verification:**
```bash
npm view drizzle-orm version           # confirmed 0.45.x range matches package.json (^0.45.2)
npm view @neondatabase/serverless version   # confirmed 1.x range matches package.json (^1.1.0)
npm view next version                  # confirmed 16.x matches package.json (16.2.4)
```
All four core libraries are already `npm install`ed in this repo (see `package.json`); no registry lookup for a *new* dependency is needed.

## Package Legitimacy Audit

**No new packages are introduced by this phase.** Every capability required (multi-row upsert, multi-row update, route-segment `maxDuration`, Vitest env loading) is available in libraries already present in `package.json`. The Package Legitimacy Gate is not applicable — there is nothing to run `gsd-tools query package-legitimacy check` against.

**Packages removed due to [SLOP] verdict:** none — no packages were proposed.
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
Vercel Cron (06:00 daily, 1 job/day — Hobby limit)
        │
        ▼
GET /api/cron/sync-cards  (maxDuration = 300)
  │  Bearer CRON_SECRET guard (existing, reused verbatim)
  │
  ├─▶ getNonTokenSets()  ──▶ GET https://api.swu-db.com/sets
  │        │ (single source — replaces the two independent
  │        │  token-filter call sites + prices.ts's hardcoded array)
  │        ▼
  ├─▶ syncAllCards(nonTokenSets)
  │        │  for each set (loop continues past failures — D-05):
  │        │    GET /cards/{setId}
  │        │    upsertCards(setId, cards)
  │        │       ├─ group variants in memory (unchanged)
  │        │       ├─ chunk(defRows, 500) → batch INSERT ... ON CONFLICT  (was: 1 insert/card)
  │        │       └─ chunk(printingRows, 500) → batch INSERT ... ON CONFLICT (was: 1 insert/variant)
  │        │    check elapsed time vs 240s soft deadline (D-08) — stop starting new sets if exceeded
  │        ▼
  │   { setsTotal, setsProcessed, cardsUpserted, failedSets[] }
  │
  ├─▶ syncPrices(nonTokenSets)   ← same list, no more hardcoded activeSets (D-10)
  │        │  for each set (loop continues past failures — D-07 needs a total, not a swallow):
  │        │    GET /cards/search?q=set:{setCode}
  │        │    chunk(normalVariantRows, 500) → single UPDATE ... SET price_eur = CASE WHEN ... END
  │        ▼
  │   { setsTotal, setsProcessed, totalUpdated, failedSets[] }
  │
  ├─▶ revalidateTag('cards', 'max')   — fires regardless of verdict (Claude's Discretion, locked assumption)
  │
  └─▶ verdict = (cards.setsProcessed === cards.setsTotal) && (prices.setsProcessed === prices.setsTotal)
           ▼
      Response.json({ success: verdict, cards, prices, duration })
      status: verdict ? 200 : 500        ← SYNC-03: partial run is no longer 200


GET /api/cron/sync-status   (new — SYNC-04, D-01..D-04)
  │  Bearer CRON_SECRET guard (same as above, reused verbatim)
  ▼
SELECT set_code, MAX(updated_at) AS last_synced_at
FROM card_printings GROUP BY set_code        ← DB-only, no swu-db fetch (D-04)
  ▼
{ fresh: boolean, sets: [{ setCode, lastSyncedAt, ageHours, stale }] }
```

### Recommended Project Structure
```
src/lib/sync/
├── upsert-cards.ts     # add: batch-chunked upserts, elapsed-time soft deadline, getNonTokenSets() export
├── prices.ts           # add: consume getNonTokenSets(), batch CASE-WHEN update, drop sleep, report totals not swallow
└── set-list.ts         # NEW (recommended) — single-source getNonTokenSets(), extracted from upsert-cards.ts:62/:195
src/app/api/cron/
├── sync-cards/route.ts       # add: maxDuration = 300, compare processed vs total, non-2xx on shortfall
└── sync-status/route.ts      # NEW — D-01..D-04 freshness route
src/data/starter-decks.ts     # DEBT-05: correct the 9 previously-placeholder LAW entries if verification fails
__tests__/ (or tests/)
└── starter-decks-resolve.test.ts   # NEW — D-15 DB-backed resolution test
vitest.config.mts              # add: test.env via loadEnv (D-15 DB-backed test path)
```

### Pattern 1: Chunked multi-row upsert (SYNC-01)
**What:** Replace per-row `await db.insert(...)` loops with `db.insert(table).values(chunk).onConflictDoUpdate(...)`, where `chunk` is a slice of at most 500 rows.
**When to use:** Any bulk write where the row count could exceed the Postgres bind-parameter budget for a single statement.
**Example (existing prior art — reuse this shape, don't reinvent it):**
```typescript
// Source: src/lib/collection.ts:298-317 (Phase 25 / PERF-04, already shipped in this repo)
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
Apply the same `.values(chunk).onConflictDoUpdate({ set: { col: sql`excluded.col` } })` shape to `card_definitions` (target: `cardDefinitions.swudbId`) and `card_printings` (target: `[cardPrintings.setCode, cardPrintings.collectorNumber]`) — both already use `onConflictDoUpdate` with `sql`excluded.col`` today (`upsert-cards.ts:117-137`, `:159-170`); the only change is batching the `.values()` array and chunking it, not the conflict semantics.

**Empty-array guard:** Drizzle throws on `.values([])` — every batch helper in `collection.ts` guards with an early `if (items.length === 0) return;`. Apply the same guard to every new chunked call site.

### Pattern 2: Chunk-size derivation (Postgres bind-parameter ceiling)
**What:** Postgres has a hard limit of 65,535 bind parameters per prepared statement. A multi-row `.values([...])` insert binds `rows × columns` parameters.
**When to use:** Before picking a chunk size for any bulk insert/update.
**Math (verified against this schema — `src/db/schema.ts`):**
```
card_definitions insert touches 17 columns (upsert-cards.ts:98-116):
  swudbId, name, subtitle, type, aspects, arenas, traits, keywords,
  cost, power, hp, frontText, backText, epicAction, doubleSided, unique, updatedAt
  → 65535 / 17 ≈ 3855 rows/statement (hard ceiling)

card_printings insert touches 9 columns (upsert-cards.ts:148-157):
  cardDefinitionId, setCode, collectorNumber, rarity, variantType,
  frontArtUrl, backArtUrl, artist, updatedAt
  → 65535 / 9 ≈ 7281 rows/statement (hard ceiling)
```
**Recommendation:** Chunk at **500 rows** for both tables. This is comfortably below both ceilings (500×17=8,500 and 500×9=4,500, both ≪ 65,535), and comfortably above real-world set sizes — the catalog measured 2026-08-16 at 33 non-token sets / 8,404 printings / 2,596 definitions ≈ 254 printings and 79 definitions per set on average, so the overwhelming majority of sets fit in a single 500-row chunk and the chunking loop exists as a safety net for outsized sets rather than being exercised routinely. Using one constant for both tables keeps the chunking helper reusable and the code simpler than tuning two separate numbers.

### Pattern 3: Batch update with per-row different values (D-11, price sync)
**What:** Drizzle has no native `.update(table).set(arrayOfObjects)`. The officially documented pattern for "update N rows, each with different values, in one round trip" is a dynamic `CASE WHEN` expression built with `sql.join`.
**When to use:** `prices.ts:78-85` — replacing the per-card `UPDATE` loop.
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/guides/update-many-with-different-value (official Drizzle docs)
import { SQL, inArray, sql } from 'drizzle-orm';

function buildCaseUpdate(column: PgColumn, rows: Array<{ swudbId: string; value: unknown }>): SQL {
  const chunks: SQL[] = [sql`(case`];
  for (const row of rows) {
    chunks.push(sql`when ${cardDefinitions.swudbId} = ${row.swudbId} then ${row.value}`);
  }
  chunks.push(sql`end)`);
  return sql.join(chunks, sql.raw(' '));
}

// per 500-row chunk:
if (chunk.length === 0) continue;
await db.update(cardDefinitions)
  .set({
    priceEur: buildCaseUpdate(cardDefinitions.priceEur, chunk.map(c => ({ swudbId: c.swudbId, value: c.priceEur }))),
    priceUsd: buildCaseUpdate(cardDefinitions.priceUsd, chunk.map(c => ({ swudbId: c.swudbId, value: c.priceUsd }))),
    pricesUpdatedAt: sql`now()`,
  })
  .where(inArray(cardDefinitions.swudbId, chunk.map(c => c.swudbId)));
```
**Why this over `UPDATE ... FROM (VALUES ...)`:** The `CASE WHEN` form stays inside Drizzle's `.update().set().where()` builder — every other query in this codebase uses the builder, never raw `db.execute()`. A hand-rolled `VALUES` list would need explicit `::integer` casts on `price_eur`/`price_usd` because those columns are nullable (`src/db/schema.ts:88-90`) — Postgres cannot infer a type for a VALUES column that contains `NULL` without an explicit cast, and getting that cast wrong is a real, easy-to-hit runtime error. The `CASE WHEN` form binds each value as a normal parameter in its own branch, so Postgres infers the type from the target column (`cardDefinitions.priceEur`) the same way the existing single-row `UPDATE` already does — no new cast logic to get right.
**Chunk size:** Same 500-row chunk as Pattern 2. Per-row parameter cost here is 2 params × 3 case expressions + 1 (inArray) ≈ 7 params/row, so 500 rows ≈ 3,500 params — far under the 65,535 ceiling.

### Pattern 4: Single-source non-token set list (D-10)
**What:** `upsertCards()` has the canonical token-set filter (`upsert-cards.ts:62`); `syncAllCards()` has a duplicate pre-filter (`:195`) using the identical regex, purely as a fetch-avoidance optimization. `prices.ts:59` has a third, independent, hardcoded list that has silently drifted (missing ASH, LOF, TS26).
**When to use:** Any new consumer of "the list of sets we sync" (there are now two: cards and prices).
**Recommendation:** Extract one function, e.g. `getNonTokenSets(): Promise<SWUSet[]>` in a new `src/lib/sync/set-list.ts` (or exported from `upsert-cards.ts` if the planner prefers fewer new files), that does the `/sets` fetch + the token-set filter once. `syncAllCards()` and `syncPrices()` both call it; the cron route can also call it once and pass the result to both, avoiding a duplicate `/sets` fetch per run. `upsertCards()`'s own internal token-type guard (`:62`, on the *card* payload, not the *set* list) stays — it is a different filter (card `Type` field, not `setId`) and remains the correct defensive check for cards belonging to a set that itself isn't a pure token set (e.g., `TS26` — a real playable set whose ID happens to start with `T`).

### Anti-Patterns to Avoid
- **Success-threshold verdicts** ("90% of sets synced counts as success"): explicitly rejected by D-05 — any shortfall makes the run non-2xx. Don't reintroduce a percentage cutoff.
- **Silently overwriting `revalidateTag` behavior on failure:** the Claude's-Discretion assumption is that cache invalidation still fires on a partial run — don't gate it behind the verdict.
- **Hand-rolled retry/backoff/timeout on the swu-db fetch:** explicitly out of scope (`CONCERNS.md:142-147`, deferred list). Don't add `fetch` timeouts or exponential backoff as a side effect of "cleaning up" the sync loop.
- **A second cron entry in `vercel.json`:** Hobby allows exactly one (`crons: [...]` currently has one entry at `0 6 * * *`). Both card and price sync must stay inside the single `/api/cron/sync-cards` invocation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bulk insert-or-update | A hand-rolled loop with manual "does it exist" SELECT-then-INSERT/UPDATE branching | `.values([...]).onConflictDoUpdate({ set: { col: sql`excluded.col` } })` — already proven in `collection.ts` | Drizzle + Postgres already do this atomically and efficiently in one round trip; a manual exists-check doubles round trips and reintroduces race conditions the current `onConflictDoUpdate` already avoids |
| Bulk update with per-row values | Raw string-concatenated SQL, or N sequential `UPDATE` statements | Drizzle's documented `CASE WHEN` + `sql.join` pattern | Avoids SQL injection risk of string concatenation and avoids the cast pitfalls of a hand-rolled VALUES list, while still being one round trip |
| Chunking logic | A bespoke chunking utility per call site | One shared `chunk<T>(arr: T[], size: number): T[][]` helper (no existing one in the codebase — worth adding once, reused by both `upsert-cards.ts` and `prices.ts`) | Both files need the identical chunking behavior; writing it twice is the same "one file forgets to update" risk `CONCERNS.md:158-166` already flags for variant precedence |
| Freshness/staleness computation | A new sync-run-history table with per-run bookkeeping | `MAX(updated_at) GROUP BY set_code` over the existing `card_printings` table (D-02) | The write path already sets `updated_at = now()` on every successful touch; no new schema, no migration, and the design is explicitly reversible if a run-history table is added later under SYNC-05 |

**Key insight:** Every mechanism this phase needs (batch upsert, batch update, freshness derivation) is either already built in this codebase (`collection.ts`) or natively supported by the installed Drizzle version without new SQL patterns the codebase doesn't already use somewhere. The work here is almost entirely *extending an established shape to two more files*, not designing something new.

## Common Pitfalls

### Pitfall 1: Chunking the wrong axis
**What goes wrong:** Chunking `card_printings` rows within a single `card_definitions` insert batch but not re-batching the corresponding definitions, leaving definitions still inserted one-per-set-group (they already are — one `INSERT` per logical card group today) while only printings get chunked.
**Why it happens:** The current code structure does definitions and printings in two different loops with different cardinalities (~79 vs ~254 per set); it's easy to batch one and miss the other.
**How to avoid:** Both loops need independent chunking — collect ALL definition rows for a set into one array, chunk and upsert; collect ALL printing rows for a set into a second array, chunk and upsert. Neither should stay in a per-card-group loop.
**Warning signs:** `db.insert` call count doesn't drop by roughly the expected order of magnitude after the change (still O(sets × cards) instead of O(sets × cards / 500)).

### Pitfall 2: `updatedAt` staleness breaking D-02's freshness derivation
**What goes wrong:** If a batched insert's `onConflictDoUpdate.set.updatedAt` is accidentally left as a fixed JS `Date` captured once before the chunk loop (instead of `sql`now()`` evaluated per statement, as the current single-row code already does at `upsert-cards.ts:115,135,157`), every row in a batch gets the same timestamp — which is actually fine for D-02's `MAX(updated_at)` freshness query, but breaks if any future code assumes per-row write ordering.
**Why it happens:** Batching naturally invites hoisting a `new Date()` or `now` variable outside the loop for "efficiency."
**How to avoid:** Keep using `sql`now()`` (a SQL-side function call, evaluated by Postgres per statement) rather than a JS-side `Date` — this is what the code already does and it should be preserved unchanged through the batching refactor.
**Warning signs:** D-02's SYNC-04 route showing identical `lastSyncedAt` timestamps for sets synced in different chunks of the same run when they shouldn't be (unlikely to matter functionally, but a signal something was hoisted wrong).

### Pitfall 3: The soft deadline (D-08) racing the chunk loop, not the set loop
**What goes wrong:** Checking "am I past 240s?" only between sets (not between chunks within a very large set) means a single oversized set's batched upsert could still blow through `maxDuration` if that one set alone takes longer than the remaining budget.
**Why it happens:** The natural place to check elapsed time is the outer `for (const set of nonTokenSets)` loop, which is correct for D-08's stated behavior ("stop starting new sets") — but it's tempting to assume this alone bounds total runtime, when in fact one very large set's *own* batched writes are not interrupted mid-set.
**How to avoid:** D-08 explicitly scopes the soft deadline to *starting new sets*, not interrupting a set in progress — this is the locked decision, not a gap. Just be precise in the plan that the deadline check happens once per set boundary, not per chunk, and that this is intentional (a single set finishing slightly over budget is accepted; starting a whole new set near the deadline is not).
**Warning signs:** None expected if D-08 is implemented as scoped — flagging only so the planner doesn't "improve" it into per-chunk checking, which changes behavior beyond what was decided.

### Pitfall 4: `sql.join` requires `sql.raw(' ')` as the separator, not a plain string
**What goes wrong:** `sql.join(chunks, ' ')` throws or produces malformed SQL because the second argument must itself be a `SQL` fragment.
**Why it happens:** Easy to assume `sql.join` behaves like `Array.prototype.join` with a plain string separator.
**How to avoid:** Use `sql.join(chunks, sql.raw(' '))` as shown in the official Drizzle example (Pattern 3 above) — `sql.raw()` wraps a literal string as an unescaped `SQL` fragment, which is what the separator parameter expects.
**Warning signs:** A TypeScript error at the `sql.join` call site, or a Postgres syntax error if the type system is bypassed.

### Pitfall 5: `.values([])` throws
**What goes wrong:** If a set's card list happens to produce zero rows for a chunk (shouldn't normally happen, but is a real edge case for a set with very few cards or a filtered-to-empty result), calling `.values([])` throws instead of being a no-op.
**Why it happens:** Documented Drizzle behavior; every batch helper in `collection.ts` already guards against it (`if (items.length === 0) return;`).
**How to avoid:** Apply the same empty-array guard at every new chunked call site — before the definitions batch, before the printings batch, and before the price update batch.
**Warning signs:** A thrown error on a set with unusually few cards, or a token-adjacent set (`TS26`) that could plausibly return few rows for a given chunk boundary.

### Pitfall 6: `CONCERNS.md:184-189` describes the wrong driver
**What goes wrong:** `CONCERNS.md:184-189` says "Neon HTTP pooled connections require `process.exit(0)` in scripts or they hang," but `src/db/index.ts` actually uses `drizzle-orm/neon-serverless` with a WebSocket `Pool` (`import ws from 'ws'`), not the HTTP driver. The `process.exit(0)` requirement is still real (confirmed by every script in `scripts/` doing it, e.g. `scripts/seed.ts:11`, `scripts/validate-spotlight-numbers.ts:53`) — a WebSocket connection keeps the Node process alive just as an unclosed HTTP-keepalive pool would — but the stated *reason* in CONCERNS.md is inaccurate. This matters for D-15: a DB-backed Vitest test needs the same `process.exit`-equivalent handling (an `afterAll(() => pool.end())` or similar), or the test run will hang.
**Why it happens:** The concern was likely written when the project used the HTTP driver, or transcribed from a different Neon guide, and never updated after a later switch to `neon-serverless`.
**How to avoid:** When writing the D-15 test's teardown, don't copy the "Neon HTTP" framing from CONCERNS.md — treat it as "a WebSocket Pool connection must be explicitly closed or the process/test runner hangs," and use `pool.end()` (or equivalent) in an `afterAll`, not a blind `process.exit(0)` (which is fine in a standalone script but wrong inside a Vitest worker process shared across test files).
**Warning signs:** Vitest hanging after all tests report as passed, or `vitest --run` never returning to the shell.

### Pitfall 7: DEBT-05 deck count assumption (D-14) is stale
**What goes wrong:** Planning the DEBT-05 test's scope around "15 decks" (the number cited in D-14 of the locked CONTEXT) undercounts by 7 — `starterDecks[]` currently contains **22** entries (9 `starter`, 10 `spotlight`, 3 `twin-suns`), covering 746 unique collector numbers.
**Why it happens:** The count was likely written before the `twin-suns` (TS26) and/or `ash-*` spotlight decks were added, or was simply miscounted during discussion.
**How to avoid:** Scope the D-15 test to `starterDecks[].flatMap(d => d.cards)` (i.e., "every deck in the array," not a fixed count) rather than hardcoding a deck count anywhere in the test or its description. This makes the count irrelevant and future-proof — a correctness property that generalizes automatically as decks are added.
**Warning signs:** A test comment or assertion that hardcodes "15 decks" — should be flagged in review since it will be wrong on day one.

## Code Examples

### Chunk helper (new, not in codebase today)
```typescript
// No existing chunk() utility found in this codebase — recommend adding once, e.g. src/lib/sync/chunk.ts
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
```

### Batched card_definitions upsert (extends existing single-row shape)
```typescript
// Extends src/lib/sync/upsert-cards.ts:96-138 (single-row) to batched form.
// onConflictDoUpdate target/set shape is IDENTICAL to today — only .values() becomes an array and gets chunked.
const CHUNK_SIZE = 500;

for (const defChunk of chunk(definitionRows, CHUNK_SIZE)) {
  if (defChunk.length === 0) continue;
  await db.insert(cardDefinitions)
    .values(defChunk)
    .onConflictDoUpdate({
      target: cardDefinitions.swudbId,
      set: {
        name: sql`excluded.name`,
        subtitle: sql`excluded.subtitle`,
        // ... same field list as upsert-cards.ts:120-135, unchanged
        updatedAt: sql`now()`,
      },
    });
}
```

### maxDuration + loud-failure verdict (route.ts)
```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md
// Syntax confirmed unchanged in Next.js 16.2.4 (this project's installed version).
export const maxDuration = 300; // Hobby + Fluid Compute ceiling — see Common Pitfalls / State of the Art below

export async function GET(request: NextRequest) {
  // ...auth guard unchanged...
  const cardResult = await syncAllCards();
  const priceResult = await syncPrices();
  revalidateTag('cards', 'max'); // fires regardless of verdict — Claude's Discretion, locked assumption

  const cardsOk = cardResult.setsProcessed === cardResult.setsTotal;
  const pricesOk = priceResult.setsProcessed === priceResult.setsTotal;
  const success = cardsOk && pricesOk;

  return Response.json(
    { success, cards: cardResult, prices: priceResult, duration: `${(Date.now() - startTime) / 1000}s` },
    { status: success ? 200 : 500 }
  );
}
```

### Freshness status route (D-01..D-04)
```typescript
// New route: src/app/api/cron/sync-status/route.ts
import { sql } from 'drizzle-orm';
import { cardPrintings } from '@/db/schema';

const FRESH_WINDOW_HOURS = 24; // SYNC-02

export async function GET(request: NextRequest) {
  // ...identical Bearer CRON_SECRET guard, copied verbatim from sync-cards/route.ts:6-14...

  const rows = await db
    .select({
      setCode: cardPrintings.setCode,
      lastSyncedAt: sql<string>`max(${cardPrintings.updatedAt})`,
    })
    .from(cardPrintings)
    .groupBy(cardPrintings.setCode);

  const sets = rows.map((r) => {
    const ageHours = (Date.now() - new Date(r.lastSyncedAt).getTime()) / 3_600_000;
    return { setCode: r.setCode, lastSyncedAt: r.lastSyncedAt, ageHours, stale: ageHours > FRESH_WINDOW_HOURS };
  });

  return Response.json({ fresh: sets.every((s) => !s.stale), sets });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Vercel Serverless Functions, Hobby: 10s default / 60s max (pre-Fluid) | Fluid Compute, Hobby: 300s default AND max | Fluid Compute became the platform default for all projects/plans starting April 23, 2025 | The 300s ceiling this phase designs around (`maxDuration = 300`, D-08's 240s soft deadline) is 5× the old legacy Hobby ceiling — but is still a *hard* ceiling with no higher Hobby tier to request, which is exactly why batching (not just "wait longer") is the actual fix |
| Per-row sequential Drizzle writes | `.values([...]).onConflictDoUpdate()` batched writes, `CASE WHEN` batched updates | Already established in this codebase since Phase 25 (PERF-04, `src/lib/collection.ts`) | This phase is not introducing a new pattern to the codebase — it is applying an existing, already-proven-in-production pattern to two files that were missed the first time |

**Deprecated/outdated:**
- The `activeSets` hardcoded array in `prices.ts:59` — superseded by deriving the set list from the same `/sets` fetch `upsertCards()` already performs (D-10).
- The 1s inter-set sleep in `prices.ts:96-100` — superseded by no sleep at all; the sibling `upsert-cards.ts:201` fetch loop already proves the same host tolerates no delay (D-12).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `starterDecks[]` contains 22 decks (9 starter, 10 spotlight, 3 twin-suns), not the "15" cited in D-14 of the locked CONTEXT — counted directly via `tsx` against the live file (`src/data/starter-decks.ts`), so this is VERIFIED, not assumed, but is flagged here because it corrects a number inside a *locked* decision | DEBT-05 ground truth | Low — the recommended test design (Pitfall 7) scopes to "every deck in the array" rather than a hardcoded count, so this correction doesn't change the implementation approach, only the planner's mental model of scope size |
| A2 | This specific Vercel project has Fluid Compute enabled (assumed, not confirmed in the Vercel dashboard from this research session — `vercel.json` doesn't surface this setting, it's a project-level toggle) | Environment Availability / D-09 | Medium — if Fluid Compute is somehow *not* enabled on this project despite the platform-wide default, the actual Hobby ceiling could be the legacy 60s limit instead of 300s, and `export const maxDuration = 300` would either be silently capped by Vercel or rejected at deploy time. The planner should add a `checkpoint:human-verify` task to confirm in Vercel dashboard → Settings → Functions before or immediately after deploying this phase's `maxDuration` change |
| A3 | 500-row chunk size is a reasonable default for both `card_definitions` and `card_printings` batch upserts, and for price `CASE WHEN` update batches — derived from the bind-parameter math (Pattern 2) but the actual "sweet spot" for Neon WebSocket-Pool round-trip latency at this row/column count has not been load-tested in this research session | Pattern 2, Code Examples | Low — 500 is far under the hard Postgres ceiling in both directions, so even if it's not perfectly tuned, it will not error; at worst it's suboptimal by some constant factor the planner can tune later with a quick manual timing check during implementation |

## Open Questions

1. **Is Fluid Compute confirmed enabled for this exact Vercel project?**
   - What we know: Fluid Compute is the platform default for all projects on all plans as of the April 2025 rollout, per Vercel's official docs and changelog.
   - What's unclear: Whether an existing project (this one, created well before that date per the v1 MVP milestone history in STATE.md) was auto-migrated, or requires a manual toggle in Settings → Functions.
   - Recommendation: Add a `checkpoint:human-verify` task in the plan to confirm the Fluid Compute toggle and the effective Function Max Duration setting in the Vercel dashboard before or right after deploying `maxDuration = 300`.

2. **Should the new `set-list.ts` helper live as a new file or as an export from `upsert-cards.ts`?**
   - What we know: Both `upsert-cards.ts:62` (canonical, on card `Type`) and `:195` (pre-filter, on set `setId`) do token filtering today; `prices.ts` needs the same set-level filter D-10 asks for.
   - What's unclear: The CONTEXT explicitly leaves this as planner's call ("Either hoist the set fetch into the cron route and pass it to both, or export a shared helper — planner's call, but the list must have one source").
   - Recommendation: A new `src/lib/sync/set-list.ts` keeps `upsert-cards.ts` focused on card-shape logic and gives `prices.ts` a dependency-light single import; either choice satisfies the "one source" requirement, so this is a low-stakes call for the planner to make directly rather than research further.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `DATABASE_URL` / Neon Postgres | All of this phase's DB reads/writes | ✓ (`.env.local` present, referenced by `src/db/index.ts`) | Neon (WebSocket `Pool` via `@neondatabase/serverless` 1.1.0) | — |
| `CRON_SECRET` env var | Existing cron auth guard, reused by the new status route | ✓ (referenced at `route.ts:8`, assumed configured in Vercel env — not independently re-verified this session) | — | — |
| `api.swu-db.com` (external, unauthenticated) | `syncAllCards()`, `syncPrices()` — unchanged by this phase | ✓ (already in production use; no new dependency introduced) | — | Out of scope to add a fallback (timeouts/retry explicitly deferred) |
| Vercel Fluid Compute (project-level toggle) | D-09's 300s `maxDuration` ceiling | **Unconfirmed** — see Open Question 1 / Assumption A2 | — | If disabled, effective Hobby ceiling may be the legacy 60s; planner should add a verification checkpoint |
| CI (GitHub Actions or similar) | D-15's committed Vitest test running automatically on every change | ✗ — no `.github/workflows/` found in this repo | — | Tests currently run manually via `npm test`; the new DB-backed test will only catch a regression when a human/agent runs the suite locally with `.env.local` present, not on every push. Not blocking for this phase (out of scope to add CI), but worth noting as a limit on D-15's stated protection ("a future hand-edited deck cannot silently reintroduce the bug" — true only when the suite is actually run) |

**Missing dependencies with no fallback:** none blocking.

**Missing dependencies with fallback:** CI absence (noted above) — doesn't block this phase, but tempers D-15's "prevents future regression" framing to "prevents future regression *when the suite is run*."

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.mts` (environment: `node`, globals: true, `passWithNoTests: true`) |
| Quick run command | `npx vitest run __tests__/cron-route.test.ts __tests__/upsert-cards.test.ts` |
| Full suite command | `npm test` (runs `vitest`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SYNC-01 | Batched upserts issue O(sets × ceil(cards/500)) inserts, not O(cards) | unit (mocked `@/db`, count `db.insert` calls) | `npx vitest run __tests__/upsert-cards.test.ts` | ✅ exists — extend the existing mock-DB test file; the current tests already assert insert-call counts per card-group (e.g. `expect(insertCalls).toBe(2)`), the same technique extends to asserting chunk counts |
| SYNC-01 | Function completes within `maxDuration` on a real deploy | manual-only | — (cannot be automated in Vitest; Vercel execution-time enforcement is a runtime platform behavior) | ❌ — no automated equivalent; verify via a real cron trigger or manual `curl` against the deployed route timing the response |
| SYNC-02 | ASH/LOF/TS26 are included in `syncPrices()`'s set list after D-10 | unit (mocked `@/db`, assert fetch calls include the previously-missing sets) | `npx vitest run <new prices test>` | ❌ Wave 0 — `src/lib/sync/prices.test.ts` exists as a pure unit test today (per CONTEXT) but doesn't yet assert set-list membership; extend it |
| SYNC-03 | Cron route returns non-2xx when `setsProcessed < setsTotal` | unit (mocked `syncAllCards`/`syncPrices` returning a shortfall) | `npx vitest run __tests__/cron-route.test.ts` | ✅ exists — extend; current tests only cover the 401 paths and a full-success 200 path, need a new case mocking a partial result and asserting `res.status !== 200` and `body.success === false` |
| SYNC-04 | Status route returns DB-only freshness verdict, no swu-db fetch | unit (mocked `@/db`, assert `global.fetch` never called) | `npx vitest run <new sync-status test>` | ❌ Wave 0 — new route, new test file |
| DEBT-05 | All `starterDecks[].cards[].collectorNumber` resolve against `card_printings` | integration (real DB — D-15's committed test) | `npx vitest run <new starter-decks-resolve test>` | ❌ Wave 0 — new test AND new DB-backed test-env path (see below) |

### Sampling Rate
- **Per task commit:** targeted `npx vitest run <changed test file>`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`; the DB-backed DEBT-05 test additionally requires `DATABASE_URL` to be present in whatever shell runs the full suite (see Wave 0 gap below)

### Wave 0 Gaps
- [ ] `vitest.config.mts` — add `test.env: loadEnv(mode, process.cwd(), '')` (Vite's documented pattern for exposing `.env`/`.env.local` values on `process.env` inside tests) so the new DEBT-05 test can reach `DATABASE_URL` the same way `src/db/index.ts` does at runtime. **No DB-backed Vitest path exists today** — every current test (`upsert-cards.test.ts`, `cron-route.test.ts`, `prices.test.ts`, `data-isolation.test.ts`, etc.) mocks `@/db` entirely.
- [ ] New test file for D-15 (e.g. `__tests__/starter-decks-resolve.test.ts`) with an `afterAll(() => pool.end())` (or equivalent close call on the real `Pool`/`db` client) — the WebSocket connection will otherwise keep the Vitest worker process alive after the suite finishes (see Common Pitfalls, Pitfall 6). Do not use `process.exit(0)` inside a Vitest test file — that pattern is correct for the standalone `tsx` scripts in `scripts/`, but killing the process from inside a shared Vitest worker would abort other test files running in the same worker.
- [ ] Extend `src/lib/sync/prices.test.ts` to assert D-10's set-list source and D-07's "report a total instead of swallowing" behavior — both are currently untested (the file is described in CONTEXT as "a pure unit test" with no indication these specific behaviors are covered).
- [ ] Extend `__tests__/cron-route.test.ts` with a partial-failure case (mock `syncAllCards`/`syncPrices` to return `setsProcessed < setsTotal>` and assert non-2xx).
- [ ] New test file for the SYNC-04 status route.
- Framework install: none — Vitest is already installed; only the `loadEnv` config addition and the new test files are needed.

**Flag per D-15:** Establishing the DB-backed Vitest path (the `loadEnv` config change plus the `afterAll` close-connection discipline) is real, bounded, one-time work — not disproportionate. It is a single config change reusable by any future DB-backed test, not a new capability invented from scratch for this one test. The alternative (a standalone `tsx` script matching `scripts/validate-spotlight-numbers.ts`) is faster to write but explicitly does not satisfy D-15's locked requirement that the check be a *committed test* preventing regression — so it is not a substitute, only a fallback if the Vitest path proves harder than expected during implementation.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (existing pattern, reused) | Bearer shared-secret guard (`CRON_SECRET`), identical to `sync-cards/route.ts:6-14` — the new status route must not weaken this (no query-string secret, no unauthenticated fallback) |
| V3 Session Management | No | This is a machine-to-machine cron/monitoring surface, not a user session |
| V4 Access Control | No | Single shared secret, no per-role distinction — matches this app's existing "no admin-role concept" stated in D-01 |
| V5 Input Validation | Minimal | The new status route is a parameterless `GET` (D-04: DB-only, no query params consumed) — no user input to validate. The DEBT-05 test consumes only the repo's own `starterDecks[]` data, not external input |
| V6 Cryptography | No | No new crypto — the existing `CRON_SECRET` string-equality comparison in `route.ts:12` is unchanged (not a timing-safe comparison, but this is pre-existing behavior outside this phase's scope to alter) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via unsanitized `sql.join`/`sql`` interpolation in the new `CASE WHEN` batch update | Tampering | Drizzle's `sql`` template tag parameterizes every interpolated value automatically (this is what makes it safe vs. string concatenation) — as long as `sql.raw()` is used ONLY for the literal `' '` separator and `case`/`end` keywords (never for user- or API-derived data), the pattern in Code Examples is safe. The swu-db API response fields (`swudbId`, `priceEur`, `priceUsd`) are always passed through `sql`${value}`` template interpolation, never `sql.raw()` |
| Secret leakage via the new status route echoing internals | Information Disclosure | D-04 already scopes the response to `{ setCode, lastSyncedAt, ageHours, stale }` — no DB connection details, no internal error messages. Keep any caught-error responses generic (`"Sync failed"`, matching the existing route's pattern at `route.ts:38`), not raw error objects |

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md` — `maxDuration` export syntax, confirmed unchanged for this project's installed Next.js 16.2.4
- `src/lib/collection.ts` (this repo) — the batch-upsert pattern to reuse verbatim, read in full
- `src/lib/sync/upsert-cards.ts`, `src/lib/sync/prices.ts`, `src/app/api/cron/sync-cards/route.ts` (this repo) — the exact code this phase modifies, read in full
- `src/db/schema.ts` (this repo) — exact column counts/types used for the parameter-limit math and cast reasoning
- `src/data/starter-decks.ts` (this repo, enumerated via `tsx`) — exact deck count and structure (22 decks, 746 unique collector numbers)
- `vitest.config.mts`, `__tests__/upsert-cards.test.ts`, `__tests__/cron-route.test.ts`, `scripts/validate-spotlight-numbers.ts` (this repo) — confirmed no DB-backed Vitest path exists today; confirmed the standalone-script pattern for real-DB access

### Secondary (MEDIUM confidence)
- https://vercel.com/docs/functions/configuring-functions/duration (fetched directly, official Vercel docs, `last_updated: 2026-07-01`) — Hobby + Fluid Compute duration table (300s default and maximum)
- https://vercel.com/docs/functions/limitations (fetched directly, official Vercel docs, `last_updated: 2026-07-01`) — corroborates the same 300s Hobby ceiling
- https://orm.drizzle.team/docs/guides/update-many-with-different-value (fetched directly, official Drizzle ORM docs) — the `CASE WHEN` + `sql.join` bulk-update pattern used in Pattern 3
- https://vercel.com/changelog/higher-defaults-and-limits-for-vercel-functions-running-fluid-compute (fetched directly) — confirms Fluid Compute's 300s default is platform-wide, but does not clarify auto-migration of pre-existing projects (hence Open Question 1 / Assumption A2)
- Vitest `env` config documentation (via WebSearch, corroborated by the official `vitest.dev/config/env` and `vitest.dev/config/` pages surfaced in results) — the `loadEnv(mode, process.cwd(), '')` pattern for exposing `.env.local` on `process.env` in tests

### Tertiary (LOW confidence)
- None used as the basis for any recommendation in this document — all load-bearing claims trace to either this repo's own source, or a directly-fetched official docs page.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; every capability confirmed against installed `package.json` versions and existing in-repo usage
- Architecture: HIGH — the batching pattern is not proposed, it is copied from already-shipped code in this exact repo (`src/lib/collection.ts`, Phase 25)
- Pitfalls: HIGH — every pitfall traces to a specific file/line in this repo or an official docs page fetched this session (Postgres param math, `sql.join` separator requirement, `.values([])` throw behavior, the CONCERNS.md driver-name discrepancy)
- `maxDuration` ceiling (D-09): MEDIUM — the 300s number is HIGH confidence (official Vercel docs, fetched directly), but whether *this specific project* has Fluid Compute enabled is unconfirmed (Assumption A2, Open Question 1)
- DEBT-05 deck count: HIGH — directly counted via `tsx` against the live file, not estimated

**Research date:** 2026-08-16
**Valid until:** 30 days for the Drizzle/codebase-internal findings (stable, versioned in this repo); ~90 days for the Vercel Hobby/Fluid Compute duration limits (platform limits change infrequently but are worth re-confirming if this phase's implementation is deferred significantly)
