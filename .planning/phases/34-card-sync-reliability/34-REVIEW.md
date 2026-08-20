---
phase: 34-card-sync-reliability
reviewed: 2026-08-20T00:00:00Z
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
  critical: 0
  warning: 7
  info: 2
  total: 9
status: issues_found
---

# Phase 34: Code Review Report

**Reviewed:** 2026-08-20T00:00:00Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

This is a re-review of waves 1-4 plus the 34-08 gap-closure plan. The prior review's one Critical
finding (CR-01: `syncAllCards()` had no per-set error isolation) is **verified closed**. `upsert-cards.ts:302-317`
now wraps the per-set fetch+upsert body in `try { ... } catch (error) { console.error(...); failedSets.push(set.setId); }`,
mirroring `syncPrices()`'s existing pattern exactly. `__tests__/upsert-cards.test.ts` adds four new
`syncAllCards` tests that directly exercise the previously-uncovered failure modes: a rejected `fetch()`,
a cards response missing the `data` key, a DB write rejecting mid-`upsertCards()`, and the deliberate
"unresolved swudbId" throw — every one asserts the failing set lands in `failedSets`, later sets still
process, and the promise resolves rather than rejects. `__tests__/cron-route.test.ts` adds a matching
pair of route-level tests proving a per-set card failure now still reaches `syncPrices()`, still
invalidates the cache, and returns a JSON body (contrasted explicitly against the case where
`syncAllCards()` rejects outright, which the tests correctly pin as the sole remaining path to the
bodyless 500). CR-01 is closed with genuine test evidence, not just code inspection.

No new Critical-severity issues were found. Two new Warnings were found on independent inspection: the
per-set `try/catch` fix stops a bad set from aborting the whole run, but it does not make a single
set's write atomic — `upsertCards()`'s Phase C (`card_definitions`) can commit chunks to the DB before
Phase D (`card_printings`) throws, so a set reported as fully "failed" can still leave partially-written
rows behind with zero signal in `CardSyncResult`. Separately, `collection/page.tsx`'s `/api/collection/sets`
fetch never checks `res.ok` or validates the response shape before treating it as an array, so a
non-2xx or malformed response would carry through to `sets.map()` in the render path.

The six previously-deferred items (WR-01..WR-05, IN-01), recorded in `deferred-items.md` as conscious
deferrals rather than oversights, are all still present unchanged in the code. They are re-reported
below at their original severity, each flagged as a recorded deferral rather than a newly discovered
issue, per the review brief.

## Narrative Findings (AI reviewer)

### Resolved Since Last Review

**CR-01 (from `34-REVIEW.md` wave 1-3 pass) — CLOSED.** `src/lib/sync/upsert-cards.ts:302-317` now
isolates each set's fetch+upsert in its own `try/catch`:
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
Verified with test evidence, not just inspection: `__tests__/upsert-cards.test.ts:216-344` adds four
`syncAllCards` tests (rejected fetch, missing `data` key, rejecting DB write, unresolved-swudbId throw)
that all assert the failing set lands in `failedSets` and that later sets in the list still process.
`__tests__/cron-route.test.ts:261-307` adds the matching route-level pair — a per-set card failure now
reaches `syncPrices()`, still invalidates the cache tag, and returns a JSON body naming
`cards.failedSets`, explicitly contrasted against the case where `syncAllCards()` rejects outright
(pinned as the one remaining path to the bodyless 500, with a comment warning future contributors not
to "fix" it by widening the route's catch). This closes the regression against SYNC-03/D-05.

## Warnings

### WR-06 (NEW): Per-set catch stops the whole run from aborting, but does not make one set's write atomic

**File:** `src/lib/sync/upsert-cards.ts:188-267` (Phase C at 192-223, Phase D at 225-267), caught by the
per-set `try/catch` at `279-322`
**Issue:** The CR-01 fix correctly prevents one bad set from killing the entire sync run, but it does
not address the partial-write hazard inside a single set that the original CR-01 finding also called
out. Phase C commits `card_definitions` chunk-by-chunk in its own `db.insert(...).returning(...)` calls
(188-223); Phase D then resolves each pending printing's `cardDefinitionId` from the `RETURNING` map and
throws if a swudbId is unresolved (228-234), or Phase D's own chunked `db.insert(cardPrintings, ...)`
call can itself reject (248-265). Either way, once Phase C's first chunk has already been sent to
Postgres and returned successfully, that write is committed — there is no wrapping transaction. If a
later chunk in Phase C, or any part of Phase D, then throws, `syncAllCards()`'s catch (302-317) records
the entire set as failed in `failedSets` with no distinction from "nothing was written." A set with more
than 500 card groups (crossing a chunk boundary) is a realistic way to hit this: chunk 1 of
`card_definitions` succeeds, chunk 2 fails (e.g. a transient DB error), and the set is reported as fully
failed while roughly the first 500 definitions were, in fact, upserted.
**Fix:** Either wrap a single set's Phase C + Phase D writes in a Drizzle transaction (`db.transaction(async (tx) => { ... })`)
so a failure rolls back everything written for that set, or — if a transaction is out of scope —
at minimum track how many chunks succeeded before the throw and surface that in `CardSyncResult` (e.g.
a `partiallyWrittenSets: string[]` field) so operators know "failed" doesn't always mean "untouched."

### WR-07 (NEW): Collection page doesn't validate `/api/collection/sets`'s response before treating it as an array

**File:** `src/app/collection/page.tsx:31-38`
**Issue:**
```ts
fetch('/api/collection/sets')
  .then(res => res.json())
  .then(data => {
    setSets(data);
    if (data.length > 0) setSelectedSet(data[0]);
  })
  .catch(err => console.error('Failed to load sets:', err));
```
`res.ok` is never checked, and `data` is used as an array (`data.length`, `data[0]`, and later
`sets.map(s => ...)` at line 158) without validating its shape. If the endpoint ever returns a non-2xx
response with a JSON error body (e.g. `{ error: '...' }`), `res.json()` resolves successfully — it does
not throw on a 4xx/5xx status — so the `.catch()` never fires. `setSets(data)` then stores a non-array
value in state, and the subsequent render crashes at `sets.map(s => (...))` since `.map` does not exist
on a plain object. This is not purely theoretical: any transient DB error, auth change, or future
refactor of `/api/collection/sets` that returns an error object instead of `[]` on failure turns into an
unhandled render crash of the whole Import Collection page instead of a caught, logged failure.
**Fix:**
```ts
fetch('/api/collection/sets')
  .then(res => {
    if (!res.ok) throw new Error(`Failed to load sets: ${res.status}`);
    return res.json();
  })
  .then(data => {
    if (!Array.isArray(data)) throw new Error('Unexpected /api/collection/sets response shape');
    setSets(data);
    if (data.length > 0) setSelectedSet(data[0]);
  })
  .catch(err => console.error('Failed to load sets:', err));
```

### WR-01 (deferred, unchanged): Cron secret comparison is not constant-time

**File:** `src/app/api/cron/sync-cards/route.ts:23`, `src/app/api/cron/sync-status/route.ts:15`
**Issue:** Both guards still compare the secret with `authHeader !== \`Bearer ${cronSecret}\``, a
standard `!==` comparison that short-circuits on the first mismatched byte — a timing side channel on
`CRON_SECRET`. Recorded in `deferred-items.md` under 34-08 as a conscious deferral (also carried in
`34-08-PLAN.md`'s threat model as `T-34-44`, accepted with rationale), not a new discovery.
**Fix:**
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

### WR-02 (deferred, unchanged): Intra-batch conflict-key dedup silently drops rows with no telemetry

**File:** `src/lib/sync/upsert-cards.ts:179-186`
**Issue:** Unchanged from the prior review:
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
A duplicate-key collision from dirty upstream data silently drops a row with zero signal — it never
appears in `failedSets`, `unprocessedSets`, or any log line, and the set is still counted as fully
processed. Recorded in `deferred-items.md` as a conscious deferral.
**Fix:**
```ts
if (dedupedDefinitionRows.length < definitionRows.length) {
  console.warn(
    `upsertCards(${setId}): deduped ${definitionRows.length - dedupedDefinitionRows.length} duplicate-swudbId definition row(s)`
  );
}
```
and the equivalent for `dedupedPrintingRows`.

### WR-03 (deferred, unchanged): Token-set predicate is duplicated instead of reusing `isTokenSetId()`

**File:** `src/lib/sync/upsert-cards.ts:72` vs `src/lib/sync/set-list.ts:17-19`
**Issue:** `set-list.ts` still documents `isTokenSetId()` as the canonical predicate, but
`upsert-cards.ts:72` still re-implements the identical condition inline (`setId.startsWith('T') && setId.length > 3 && !setId.match(/^TS\d{2}$/)`)
instead of importing it. Two copies of the same regex/condition can drift silently. Recorded in
`deferred-items.md` — noted there as deliberately left alone because it's a different value (set id vs.
`card.Type`) from the check `34-08` actually touched in this file.
**Fix:**
```ts
import { getNonTokenSets, isTokenSetId, type SWUSet } from './set-list';
// ...
if (isTokenSetId(setId)) return 0;
```

### WR-04 (deferred, unchanged): `sync-status` can't detect a brand-new, never-synced set

**File:** `src/app/api/cron/sync-status/route.ts:23-52`
**Issue:** Unchanged: the freshness aggregate groups over `card_printings`, so a set that has never had
a single row synced is simply absent from `sets[]` — neither listed nor marked stale — and `fresh` can
still read `true`. For a route whose stated purpose (SYNC-04) is to be the reliability/freshness signal,
"we don't know this set exists yet" is indistinguishable from "everything is fine." Recorded in
`deferred-items.md` as a conscious deferral.
**Fix:** Cross-reference `getNonTokenSets()` against the distinct `setCode`s present in `card_printings`,
and report sets with zero rows as `stale: true` / `lastSyncedAt: null`:
```ts
const upstreamSets = await getNonTokenSets();
const knownCodes = new Set(sets.map((s) => s.setCode));
const missing = upstreamSets.filter((s) => !knownCodes.has(s.setId));
// merge `missing` into `sets` as { setCode, lastSyncedAt: null, ageHours: null, stale: true }
```

### WR-05 (deferred, unchanged): vitest `DATABASE_`-only env scoping doesn't actually keep `AUTH_SECRET` out of tests

**File:** `vitest.config.mts:12-15`
**Issue:** Unchanged. The comment claims `AUTH_SECRET` "must not reach the test environment," but
Vitest's `test.env` merges into `process.env` with assign-if-undefined semantics, not a wholesale
replacement — this config only stops Vite's own `loadEnv()` call from introducing new keys; it does
nothing to remove or mask a variable already present in the ambient shell/CI environment before Vitest
starts. Recorded in `deferred-items.md` as a conscious deferral.
**Fix:** Soften the comment to describe what this actually buys, or add an explicit `globalSetup` step
that deletes known-sensitive keys (e.g. `process.env.AUTH_SECRET`) before the DB-backed test file runs.

## Info

### IN-02 (NEW): `chunk()` has no guard against a non-positive size — infinite loop if ever misused

**File:** `src/lib/sync/chunk.ts:13-19`
**Issue:**
```ts
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
```
Every current call site passes the fixed `SYNC_CHUNK_SIZE = 500` constant, so this isn't reachable
today. But `chunk()` is an exported, general-purpose helper with no runtime guard: a `size` of `0` makes
`i` never advance (`i += 0`), producing an infinite loop and hanging the caller (in a cron route, this
would run until the platform's hard timeout kills the function); a negative `size` behaves the same way.
**Fix:**
```ts
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error(`chunk(): size must be positive, got ${size}`);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
```

### IN-01 (deferred, unchanged): Malformed JSON body in starter-deck POST returns 500 instead of 400

**File:** `src/app/api/collection/starter-deck/route.ts:17`
**Issue:** Unchanged: `const body = await request.json();` is still inside the outer try/catch. A
malformed request body throws and falls into the generic `catch (error) { ...; return new Response('Internal Server Error', { status: 500 }); }`,
reporting a client-side malformed-request error as a server fault. Recorded in `deferred-items.md` as a
conscious deferral.
**Fix:**
```ts
let body: unknown;
try {
  body = await request.json();
} catch {
  return new Response('Invalid JSON body', { status: 400 });
}
```

---

_Reviewed: 2026-08-20T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
