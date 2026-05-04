---
phase: 01-foundation
reviewed: 2026-05-04T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/db/schema.ts
  - src/db/index.ts
  - src/lib/sync/upsert-cards.ts
  - src/app/api/cron/sync-cards/route.ts
  - scripts/seed.ts
  - __tests__/upsert-cards.test.ts
  - __tests__/cron-route.test.ts
  - drizzle.config.ts
  - vitest.config.mts
  - vercel.json
  - package.json
  - .gitignore
  - .env.example
  - tsconfig.json
  - src/app/layout.tsx
  - src/app/page.tsx
findings:
  critical: 4
  warning: 6
  info: 4
  total: 14
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-04T00:00:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

The foundation layer is structurally sound in most areas: the CRON_SECRET guard is correct, `.env` files are properly git-ignored, and the two-table schema matches the architecture rules. However, four blockers were found that would cause silent data corruption or runtime crashes before any user-facing feature is built on top of this layer. The most serious are a guaranteed runtime crash in `db/index.ts` when `DATABASE_URL` is absent and a silent data truncation bug in the variant-card upsert path. Several warnings concern incomplete upsert `set` clauses and a flawed test mock chain that allows tests to pass despite the code paths not being exercised correctly.

---

## Critical Issues

### CR-01: Non-null assertion on DATABASE_URL crashes the process at module load, not at call time

**File:** `src/db/index.ts:4`
**Issue:** `process.env.DATABASE_URL!` uses a TypeScript non-null assertion, which is erased at runtime. The `neon()` constructor from `@neondatabase/serverless` will receive `undefined` if the env var is absent and throw an uncaught error at module-load time — crashing the entire Next.js server cold rather than returning a useful error response. This is especially dangerous for the cron route: a misconfigured deployment will 500 on every request with no diagnostic message.

**Fix:**
```typescript
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Add it to .env.local for local dev or to Vercel environment variables for deployment.'
  );
}
const sql = neon(databaseUrl);
export const db = drizzle({ client: sql });
```
This converts a silent runtime crash into an actionable error message visible in logs.

---

### CR-02: drizzle.config.ts crashes at import with the same non-null assertion and no env loaded

**File:** `drizzle.config.ts:9`
**Issue:** `process.env.DATABASE_URL!` is used, and `import 'dotenv/config'` at line 1 loads `.env` — but the seed script explicitly documents that dotenv `config()` runs too late in ESM context (seed.ts comment, line 1). `drizzle-kit` invokes this config file directly; if `.env` is not present (e.g., on CI), `DATABASE_URL` is `undefined` at the time `neon()` / drizzle-kit reads it. The `!` assertion is a lie: it does not guarantee the value exists, it only suppresses the TypeScript error.

**Fix:**
```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set — check .env or .env.local');

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url },
});
```

---

### CR-03: Pass 2 upsert for orphaned variant cards silently drops backArtUrl and artist fields

**File:** `src/lib/sync/upsert-cards.ts:218-226`
**Issue:** In the `!existing` branch of Pass 2 (a non-Normal variant with no pre-existing `card_definition`), the `onConflictDoUpdate` set clause for `card_printings` omits `backArtUrl` and `artist` from the conflict update:

```typescript
// Lines 218-226 — missing backArtUrl and artist in set:
set: {
  rarity: sql`excluded.rarity`,
  variantType: sql`excluded.variant_type`,
  frontArtUrl: sql`excluded.front_art_url`,
  updatedAt: new Date(),
},
```

Compare to the Normal-variant upsert (lines 137-144) and the `existing` branch (lines 242-250), both of which also omit `backArtUrl` and `artist`. This means if a card's artist credit or back art URL changes in the source data, re-running the sync will not update those fields for any printing — they will be silently stale forever.

**Fix:** Add the missing fields to all three `onConflictDoUpdate` set clauses in `card_printings` upserts (lines 137-144, 218-226, 242-250):
```typescript
set: {
  rarity: sql`excluded.rarity`,
  variantType: sql`excluded.variant_type`,
  frontArtUrl: sql`excluded.front_art_url`,
  backArtUrl: sql`excluded.back_art_url`,   // ADD
  artist: sql`excluded.artist`,              // ADD
  updatedAt: new Date(),
},
```

---

### CR-04: Variant-card lookup uses name+subtitle across all sets — can match the wrong card

**File:** `src/lib/sync/upsert-cards.ts:158-171`
**Issue:** The Pass 2 lookup query for non-Normal variant cards searches `card_definitions` by `name + subtitle` only, with no `setCode` or `swudbId` constraint. If two different sets contain cards with the same name and subtitle (a reprint scenario), the lookup returns whichever row was inserted first and attaches the variant printing to the wrong `card_definition`. This is a data integrity bug that silently links printings to incorrect canonical definitions.

```typescript
// Lines 158-171 — no set scope on the lookup
const query = db
  .select({ id: cardDefinitions.id })
  .from(cardDefinitions)
  .where(
    card.Subtitle
      ? and(eq(cardDefinitions.name, card.Name), eq(cardDefinitions.subtitle, card.Subtitle))
      : and(eq(cardDefinitions.name, card.Name), isNull(cardDefinitions.subtitle))
  );
```

**Fix:** Scope the lookup to the current set by also constraining `swudbId` prefix or joining against `card_printings` for `setCode`. The most robust approach: since `swudbId` for Normal variants is `${Set}-${Number}`, and the variant card shares the same `Set` and canonical `Number` (just a different variant Number), pass the Normal variant's collector number explicitly or scope via the set:

```typescript
// Constrain to same set by checking swudb_id starts with the set prefix
.where(
  and(
    sql`${cardDefinitions.swudbId} LIKE ${card.Set + '-%'}`,
    card.Subtitle
      ? and(eq(cardDefinitions.name, card.Name), eq(cardDefinitions.subtitle, card.Subtitle))
      : and(eq(cardDefinitions.name, card.Name), isNull(cardDefinitions.subtitle))
  )
)
```

---

## Warnings

### WR-01: updatedAt is set to `new Date()` at query-build time, not execution time, inside loops

**File:** `src/lib/sync/upsert-cards.ts:96-97, 116, 133, 142, 196, 200, 212, 222, 239, 248`
**Issue:** `updatedAt: new Date()` is evaluated when the JavaScript object literal is constructed — before the DB round-trip. In a tight loop over hundreds of cards, all rows processed in the same synchronous tick will receive identical `updatedAt` timestamps. This is not a crash, but it defeats the purpose of `updatedAt` as a meaningful audit field and will cause confusion when debugging sync issues ("why do 300 cards all show the same updated time?"). The standard pattern is to let the database set this value.

**Fix:** Use `sql`now()`` or a Drizzle `defaultNow()` expression in the `set` clause so the DB sets the timestamp atomically:
```typescript
// In onConflictDoUpdate set:
updatedAt: sql`now()`,
```
And in `.values()`, omit `updatedAt` entirely and let the column default handle it on INSERT. If an explicit value is needed, use `sql`now()`` there too.

---

### WR-02: syncAllCards silently swallows per-set errors and misreports setsProcessed

**File:** `src/lib/sync/upsert-cards.ts:278-285`
**Issue:** When a per-set card fetch fails (line 279-282), the code logs the error and `continue`s, but `setsProcessed` still counts that set in the return value (line 288: `setsProcessed: nonTokenSets.length`). The caller sees `setsProcessed: 5` when only 3 sets actually succeeded. This makes it impossible to tell from the cron response whether the sync was partially failed.

```typescript
// Line 288 — always reports full count even if some sets errored
return { setsProcessed: nonTokenSets.length, cardsUpserted: totalUpserted };
```

**Fix:** Track successful set count separately:
```typescript
let setsSucceeded = 0;
// inside loop, on success:
setsSucceeded++;
// ...
return { setsProcessed: setsSucceeded, setsTotal: nonTokenSets.length, cardsUpserted: totalUpserted };
```
Add `setsTotal` and `setsSucceeded` to `SyncResult` interface to make partial failures observable.

---

### WR-03: Test mock chain for db.insert is broken for the card_printings-only path

**File:** `__tests__/upsert-cards.test.ts:106-114`
**Issue:** The mock chain is: `insert → values → onConflictDoUpdate → returning`. However, in the `existing` branch of Pass 2 (lines 229-251 of `upsert-cards.ts`), the `card_printings` insert calls `.onConflictDoUpdate()` but does NOT call `.returning()`. The mock `mockOnConflict` returns `{ returning: mockReturning }` — it does not return a thenable itself. Since the production code `await`s the result of `.onConflictDoUpdate()` directly (no `.returning()`), this mock will resolve to `{ returning: mockReturning }` (a plain object, not a Promise), which Vitest's `await` treats as a resolved value. The test passes for the wrong reason: the mock resolves but the real DB call would return a `Promise`. Any future test that asserts on the awaited value of a non-returning insert will receive the mock object, not `undefined` or an empty array.

**Fix:** Make the mock for `onConflictDoUpdate` also return a resolved Promise when `.returning` is not called:
```typescript
mockOnConflict = vi.fn().mockReturnValue({
  returning: mockReturning,
  // Also make it thenable for cases where .onConflictDoUpdate() is awaited directly
  then: (resolve: (v: unknown) => void) => resolve([]),
});
```
Or restructure to use `mockResolvedValue` for the non-returning path.

---

### WR-04: cron-route test re-imports module after vi.resetModules() but the mock may not apply

**File:** `__tests__/cron-route.test.ts:13-17`
**Issue:** `vi.resetModules()` is called in `beforeEach` before re-importing the route handler. However, `vi.mock('@/lib/sync/upsert-cards', ...)` is hoisted to the top of the file by Vitest's mock hoisting transform. After `resetModules()`, the module registry is cleared, and the dynamic `import('../src/app/api/cron/sync-cards/route')` will re-evaluate the route module — but whether the `vi.mock()` at the top of the file re-applies to this dynamic import depends on Vitest's hoisting behavior and module resolution. In practice, this works in current Vitest, but it is fragile: it relies on implementation-specific hoisting behavior rather than an explicit `vi.mock()` inside the dynamic import chain. If Vitest's behavior changes, these tests will silently start calling the real `syncAllCards`.

**Fix:** Either remove `vi.resetModules()` (it is not needed if `vi.clearAllMocks()` is sufficient) or assert that `syncAllCards` is the mock function after each re-import:
```typescript
const { syncAllCards } = await import('@/lib/sync/upsert-cards');
expect(vi.isMockFunction(syncAllCards)).toBe(true); // guard assertion
```

---

### WR-05: Token-set filter in upsertCards is redundant with the filter in syncAllCards

**File:** `src/lib/sync/upsert-cards.ts:61`
**Issue:** `upsertCards` checks `if (setId.startsWith('T')) return 0` at line 61, and `syncAllCards` already filters token sets before ever calling `upsertCards` (line 273). The double-filter is harmless but creates misleading code: a future developer reading `syncAllCards` may remove the pre-filter because "upsertCards handles it," or reading `upsertCards` may assume it's called independently and that the guard is essential. Neither context is documented.

**Fix:** Pick one canonical location and document the decision. Since `upsertCards` is a public export (callable directly, e.g. from tests or future scripts), the guard in `upsertCards` is the safer canonical location. Remove the filter from `syncAllCards` and add a comment to `upsertCards`:
```typescript
// Token sets are filtered here so callers don't need to pre-filter
if (setId.startsWith('T')) return 0;
```

---

### WR-06: vitest.config.mts uses jsdom environment globally — server-side modules will behave incorrectly

**File:** `vitest.config.mts:8`
**Issue:** `environment: 'jsdom'` applies to all test files including `__tests__/upsert-cards.test.ts` and `__tests__/cron-route.test.ts`, which test pure server-side Node.js code (DB calls, fetch, Next.js route handlers). jsdom sets up browser-like globals (`window`, `document`, `navigator`) and can interfere with Node.js APIs. For example, jsdom patches `fetch` differently than Node's native fetch, and `NextRequest` construction may behave differently. The `cron-route.test.ts` at line 2 imports `NextRequest` from `next/server` — this works today, but only because the mock prevents actual execution. Running server-side code in jsdom is incorrect and will hide environment-specific bugs.

**Fix:** Use per-file environment annotations or split configs:
```typescript
// vitest.config.mts
test: {
  environment: 'node', // default for server-side tests
  environmentMatchGlobs: [
    ['**/*.browser.test.{ts,tsx}', 'jsdom'], // jsdom only for UI tests
  ],
}
```
Or add `// @vitest-environment node` at the top of the two server-side test files.

---

## Info

### IN-01: app/layout.tsx retains create-next-app placeholder metadata

**File:** `src/app/layout.tsx:15-18`
**Issue:** The metadata title and description are the default `"Create Next App"` / `"Generated by create next app"` strings. These will appear in browser tabs and search results.

**Fix:**
```typescript
export const metadata: Metadata = {
  title: "Star Wars Unlimited Tracker",
  description: "Track your Star Wars: Unlimited TCG collection and build decks",
};
```

---

### IN-02: app/page.tsx is entirely placeholder create-next-app content

**File:** `src/app/page.tsx:1-65`
**Issue:** The home page is the unmodified create-next-app template, including Vercel deploy links and Next.js learn links. This is expected at the foundation phase but should be replaced before Phase 2 ships any user-visible feature.

**Fix:** Replace with a minimal placeholder that reflects the actual project (e.g., "Star Wars Unlimited Tracker — Coming Soon") before Phase 2 begins, so the deployed app doesn't present Vercel marketing as the product.

---

### IN-03: SyncResult interface does not reflect partial-failure state

**File:** `src/lib/sync/upsert-cards.ts:38-41`
**Issue:** The `SyncResult` interface has `setsProcessed` (which, per WR-02, is always the total count regardless of errors) and `cardsUpserted`. There is no way for callers to distinguish "5 sets processed, all succeeded" from "5 sets attempted, 2 failed silently."

**Fix:** Extend the interface (tied to the fix for WR-02):
```typescript
interface SyncResult {
  setsTotal: number;
  setsProcessed: number; // successfully processed
  cardsUpserted: number;
}
```

---

### IN-04: parseIntOrNull does not guard against non-numeric strings like "X" or "*"

**File:** `src/lib/sync/upsert-cards.ts:45-49`
**Issue:** `parseInt("X", 10)` returns `NaN`, which `parseIntOrNull` correctly maps to `null`. However, `parseInt("3+1", 10)` returns `3` (parseInt stops at non-numeric characters). If the SWU API ever returns a cost like "X" (variable cost cards exist in many TCGs), the function returns `null` correctly; but values like "3+" would silently store `3` instead of null, which is a silent data quality issue rather than a crash. This is a known edge case to document.

**Fix:** Add a note in the function comment:
```typescript
/**
 * Parses a string to an integer, returning null for missing/empty/NaN values.
 * Note: parseInt stops at non-digit characters ("3+" → 3). If the SWU API
 * introduces variable-cost notation, this function must be updated.
 */
```

---

_Reviewed: 2026-05-04T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
