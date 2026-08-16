---
phase: 34-card-sync-reliability
reviewed: 2026-08-16T08:29:30Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - __tests__/cron-route.test.ts
  - __tests__/starter-deck-route.test.ts
  - __tests__/starter-decks-resolve.test.ts
  - __tests__/sync-status-route.test.ts
  - __tests__/upsert-cards.test.ts
  - src/app/api/collection/starter-deck/route.ts
  - src/app/api/cron/sync-cards/route.ts
  - src/app/api/cron/sync-status/route.ts
  - src/app/collection/page.test.tsx
  - src/app/collection/page.tsx
  - src/db/index.ts
  - src/lib/sync/chunk.ts
  - src/lib/sync/prices.test.ts
  - src/lib/sync/prices.ts
  - src/lib/sync/set-list.ts
  - src/lib/sync/upsert-cards.ts
  - vitest.config.mts
findings:
  critical: 1
  warning: 5
  info: 1
  total: 7
status: issues_found
---

# Phase 34: Code Review Report

**Reviewed:** 2026-08-16T08:29:30Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

The headline SYNC-03 fix itself is sound: `success = cardsOk && pricesOk` uses strict equality with
a `setsTotal > 0` guard, a thrown error inside the route's own try/catch still yields a non-2xx, and
`revalidateTag('cards', 'max')` is the correct two-argument call for this Next.js version. The
`prices.ts` `buildCaseUpdate()` SQL is genuinely safe — every swu-db-derived value is bound through
`sql` template interpolation and `sql.raw()` touches only fixed keywords/separators, matching the
claim in the code comment. The `upsertCards()` printing-to-definition linkage correctly uses the
`RETURNING` `swudbId` column via a map, never positional indexing, and this is proven by a
reverse-order `RETURNING` test.

The one **Critical** finding is a real regression against the phase's own stated goal: unlike
`syncPrices()`, which wraps each set's fetch+write in `try/catch` so one bad set never takes down
the run, `syncAllCards()`'s per-set body (`upsert-cards.ts:302-311`) has no such isolation. A single
set with a malformed API response or a DB error during `upsertCards()` throws uncaught, killing the
entire cards sync *and* skipping price sync entirely (since it runs sequentially after), collapsing
the route's rich per-set diagnostics into a bare 500 with no body. This directly undercuts SYNC-03's
purpose of honest, granular failure reporting, and it is untested — none of the three test files
covering this code path exercise a rejected fetch or a throwing `upsertCards()`.

Several Warnings round out the review: a non-constant-time secret comparison in both cron guards
(explicitly flagged for review by the phase intent), a silent last-write-wins dedup with no
telemetry on collision counts, duplicated token-set-predicate logic that defeats set-list.ts's
"single source of truth" claim, a blind spot in `sync-status` for entirely new/never-synced sets,
and an overstated claim about the vitest env scoping actually keeping `AUTH_SECRET` out of the test
process.

## Critical Issues

### CR-01: `syncAllCards()` has no per-set error isolation — one bad set kills the whole sync

**File:** `src/lib/sync/upsert-cards.ts:279-322` (specifically the loop body at `302-311`)
**Issue:** Contrast with `src/lib/sync/prices.ts:132-171`, which wraps each set's `fetchSetPrices()` +
DB writes in `try { ... } catch (error) { failedSets.push(setCode); }` so a single set's failure is
recorded and the loop continues — exactly the SYNC-03/D-05 "run continues" contract. `syncAllCards()`
has no equivalent:

```ts
const cardsResponse = await fetch(`https://api.swu-db.com/cards/${set.setId}`);
if (!cardsResponse.ok) {
  console.error(`Failed to fetch cards for set ${set.setId}: ${cardsResponse.status}`);
  failedSets.push(set.setId);
  continue; // Skip this set, continue with others (D-05)
}
const { data: cards }: { data: SWUCard[] } = await cardsResponse.json();
const count = await upsertCards(set.setId, cards);
totalUpserted += count;
setsSucceeded = setsSucceeded + 1;
```

Only the `!cardsResponse.ok` branch is defended. A rejected `fetch()` (network blip/timeout), a
malformed JSON body (e.g. a response missing `data`, which makes `cards` `undefined` and crashes
`nonTokenCards = cards.filter(...)` inside `upsertCards`), a NOT-NULL/FK constraint violation on one
bad row, or the deliberate `throw new Error(...)` in `upsertCards()`'s Phase D ("unresolved swudbId")
all propagate uncaught out of `syncAllCards()`. In the cron route this is caught only by the *outer*
try/catch (`sync-cards/route.ts:88-91`), which:
- returns a bare `Response('Sync failed', { status: 500 })` — no JSON body, so any caller/alerting
  system parsing `body.cards.failedSets` gets nothing;
- never reaches `syncPrices()`, so a card-sync hiccup on one set also silently cancels the entire
  price half of the run, which had nothing to do with the failure;
- never calls `revalidateTag`, discarding whatever sets *did* land successfully before the failing one.

This is also a partial-write hazard: `upsertCards()`'s Phase C (`card_definitions` upsert) commits to
the DB in its own statement(s) before Phase D resolves `card_printings`. If Phase D throws (the
"unresolved swudbId" guard, or any later DB error), the definitions for that set are already
persisted but the printings are not — and the whole run then aborts uncaught, with no record of the
partial state in `failedSets`/`unprocessedSets`.

None of `__tests__/upsert-cards.test.ts`, `__tests__/cron-route.test.ts`, or
`__tests__/starter-decks-resolve.test.ts` exercise a rejected `fetch()` or a throwing `upsertCards()`
call inside `syncAllCards()` — the existing "fetch fails" test only covers the `!ok` branch, which is
already handled correctly.

**Fix:** Mirror `syncPrices()`'s per-set isolation:
```ts
try {
  const cardsResponse = await fetch(`https://api.swu-db.com/cards/${set.setId}`);
  if (!cardsResponse.ok) {
    console.error(`Failed to fetch cards for set ${set.setId}: ${cardsResponse.status}`);
    failedSets.push(set.setId);
    continue;
  }
  const { data: cards }: { data: SWUCard[] } = await cardsResponse.json();
  const count = await upsertCards(set.setId, cards);
  totalUpserted += count;
  setsSucceeded = setsSucceeded + 1;
} catch (error) {
  console.error(`Error syncing cards for set ${set.setId}:`, error);
  failedSets.push(set.setId);
}
```
Add a test that makes `mockFetch` reject and one that makes a card-processing step throw, asserting
the set lands in `failedSets` and later sets still process — the same coverage `prices.test.ts`
already has for its analogous path.

## Warnings

### WR-01: Cron secret comparison is not constant-time

**File:** `src/app/api/cron/sync-cards/route.ts:23`, `src/app/api/cron/sync-status/route.ts:15`
**Issue:** Both guards compare the secret with `authHeader !== \`Bearer ${cronSecret}\``, a standard
`!==` string comparison that short-circuits on the first mismatched byte. This is a timing side
channel on `CRON_SECRET` — explicitly called out for review in the phase intent ("Auth guards ...
timing"). Network jitter makes this hard to exploit remotely but it's a well-known hardening gap for
a bearer-token comparison.
**Fix:** Use a length-normalized constant-time compare, e.g.:
```ts
import { timingSafeEqual } from 'crypto';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
// ...
if (!cronSecret || !safeEqual(authHeader ?? '', `Bearer ${cronSecret}`)) {
  return new Response('Unauthorized', { status: 401 });
}
```
Apply identically to both routes to preserve the intentional byte-for-byte duplication.

### WR-02: Intra-batch conflict-key dedup silently drops rows with no telemetry

**File:** `src/lib/sync/upsert-cards.ts:179-186`
**Issue:**
```ts
const dedupedDefinitionRows = Array.from(
  new Map(definitionRows.map((row) => [row.swudbId, row])).values()
);
const dedupedPrintingRows = Array.from(
  new Map(
    pendingPrintings.map((row) => [`${row.setCode}|${row.collectorNumber}`, row])
  ).values()
);
```
The surrounding comment concedes duplicates are a real, observed condition in upstream data ("the
per-row loop this replaces silently tolerated a duplicate from dirty upstream data"). Silently
keeping the last row and dropping the rest means a genuine duplicate-key collision in the swu-db.com
payload causes a card variant or definition to vanish from the batch with zero signal — it doesn't
appear in `failedSets`, `unprocessedSets`, or any log line, and the set is still counted as fully
processed. There's no way to tell from `CardSyncResult` (or the logs) that this ever happens.
**Fix:** Log when dedup actually removes something, e.g.:
```ts
if (dedupedDefinitionRows.length < definitionRows.length) {
  console.warn(
    `upsertCards(${setId}): deduped ${definitionRows.length - dedupedDefinitionRows.length} duplicate-swudbId definition row(s)`
  );
}
```
and the equivalent for `dedupedPrintingRows`, so a spike in dropped rows is visible in cron logs.

### WR-03: Token-set predicate is duplicated instead of reusing `isTokenSetId()`

**File:** `src/lib/sync/upsert-cards.ts:72` vs `src/lib/sync/set-list.ts:17-19`
**Issue:** `set-list.ts` documents `isTokenSetId()` as "Canonical token-set predicate ... verbatim
from the pre-existing pre-filter" and is imported for `getNonTokenSets` elsewhere, but `upsert-cards.ts`
re-implements the identical condition inline instead of importing it:
```ts
// upsert-cards.ts:72
if (setId.startsWith('T') && setId.length > 3 && !setId.match(/^TS\d{2}$/)) return 0;
// set-list.ts:17-19
export function isTokenSetId(setId: string): boolean {
  return setId.startsWith('T') && setId.length > 3 && !setId.match(/^TS\d{2}$/);
}
```
Two copies of the same regex/condition can drift silently if one is edited without the other — the
exact class of bug set-list.ts's docblock says it exists to prevent.
**Fix:**
```ts
import { getNonTokenSets, isTokenSetId, type SWUSet } from './set-list';
// ...
if (isTokenSetId(setId)) return 0;
```

### WR-04: `sync-status` can't detect a brand-new, never-synced set

**File:** `src/app/api/cron/sync-status/route.ts:23-52`
**Issue:** The freshness aggregate groups over `card_printings`, so it can only ever report on sets
that already have at least one row. If swu-db.com publishes a new set that the cron job hasn't picked
up yet at all (first run pending, or the cron itself is broken), that set is simply absent from
`sets[]` — it's neither listed nor marked stale, and `fresh` can still read `true` off the sets that
do exist. For a route whose stated purpose (SYNC-04) is to be the reliability/freshness signal for
the sync pipeline, "we don't know this set exists yet" is indistinguishable from "everything is
fine," which is the exact false-negative failure mode SYNC-03 was written to eliminate on the write
side.
**Fix:** Cross-reference `getNonTokenSets()` (already the shared source of truth per D-10) against the
distinct `setCode`s present in `card_printings`, and report sets with zero rows as `stale: true` /
`lastSyncedAt: null` rather than omitting them:
```ts
const upstreamSets = await getNonTokenSets();
const knownCodes = new Set(sets.map((s) => s.setCode));
const missing = upstreamSets.filter((s) => !knownCodes.has(s.setId));
// merge `missing` into `sets` as { setCode, lastSyncedAt: null, ageHours: null, stale: true }
```
If this cross-check is deliberately out of scope for D-02 ("no new table, no migration" — this needs
an extra fetch, not a migration, so it doesn't conflict), at minimum document the blind spot so it
isn't mistaken for full coverage.

### WR-05: vitest DATABASE_-only env scoping doesn't actually keep `AUTH_SECRET` out of tests

**File:** `vitest.config.mts:12-15`
**Issue:** The comment claims:
> scope to the `DATABASE_` prefix only (least privilege) — `AUTH_SECRET` and every other `.env.local`
> value must not reach the test environment.

`test.env` in this Vitest version is merged into `process.env` with `??=` (assign-if-undefined,
confirmed in `node_modules/vitest/dist/chunks/cli-api.*.js`), not a wholesale replacement. That means
this config only prevents Vite's `loadEnv()` call itself from newly introducing extra `.env.local`
keys into `process.env` — it does nothing to remove or mask any variable (including `AUTH_SECRET`)
that's already present in the ambient process environment before Vitest starts (inherited from the
shell, a CI job's injected secrets, a `dotenv -e .env.local -- vitest` wrapper, etc.). In any of those
common setups, `AUTH_SECRET` reaches every test's `process.env` regardless of this scoping, which
directly contradicts the "must not reach the test environment" claim.
**Fix:** Either soften the comment to describe what this actually buys (keeps `loadEnv()` itself from
being the leak vector, not a guarantee about the whole process env), or add an explicit strip step for
known-sensitive keys not matching the allowed prefix, e.g. a `globalSetup` that deletes
`process.env.AUTH_SECRET` (and any other secret) before the DB-backed test file runs.

## Info

### IN-01: Malformed JSON body in starter-deck POST returns 500 instead of 400

**File:** `src/app/api/collection/starter-deck/route.ts:17`, `78-81`
**Issue:** `const body = await request.json();` isn't isolated from the outer try/catch. If the
request body isn't valid JSON, `request.json()` throws and falls into the generic
`catch (error) { ...; return new Response('Internal Server Error', { status: 500 }); }`, reporting a
client-side malformed-request error as a server fault.
**Fix:** Parse the body in its own try/catch and return 400 on failure:
```ts
let body: unknown;
try {
  body = await request.json();
} catch {
  return new Response('Invalid JSON body', { status: 400 });
}
```

---

_Reviewed: 2026-08-16T08:29:30Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
