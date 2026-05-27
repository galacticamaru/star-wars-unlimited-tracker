---
phase: 25-operation-performance
reviewed: 2026-05-27T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/app/api/collection/import/route.ts
  - src/app/api/collection/starter-deck/route.ts
  - src/app/collection/page.test.tsx
  - src/app/collection/page.tsx
  - src/app/decks/[id]/loading.test.tsx
  - src/app/decks/[id]/loading.tsx
  - src/db/queries/collection.test.ts
  - src/db/queries/collection.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 25: Code Review Report

**Reviewed:** 2026-05-27T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase introduces batch DB helpers (`batchIncrementVariantCounts`, `batchUpsertVariantCounts`, `batchRecomputeTotals`) to replace per-card sequential loops in the Quick Add and CSV Import API routes, and adds a loading skeleton for the deck builder. The batch query logic is generally sound. One critical data-corruption path exists: the CSV Import route clamps negative `count` values to 0 silently and then upserts that 0, which will **overwrite and zero out** a user's existing collection entry for those cards. There are also input-validation ordering issues, an unused import, a raw SQL string fragility, and minor test-infrastructure concerns.

---

## Critical Issues

### CR-01: Negative `count` in CSV Import payload silently zeros out existing collection entries

**File:** `src/app/api/collection/import/route.ts:101`

**Issue:** The per-item validation loop (lines 28–39) only checks `Number.isFinite(item.count)`. Negative integers such as `-1` or `-999` pass validation. At line 101, `Math.max(0, item.count)` silently clamps these to 0. The clamped value is then passed to `batchUpsertVariantCounts`, which uses **overwrite semantics** (`EXCLUDED.count`). A user who imports a CSV row with a negative count will have their existing variant count for that card **permanently set to 0** with no error or warning. This is a silent data loss vector.

A malicious or corrupted CSV file could zero out an entire collection by injecting `-1` for every row.

**Fix:** Add an explicit `item.count < 0` guard inside the validation loop, rejecting the whole payload with a 400 error; or at minimum skip negative items and do not add them to `batchItems` (so no zero-count upsert occurs):

```typescript
// In the validation loop (lines 28-39), add:
if (item.count < 0) {
  return new Response('count must be non-negative', { status: 400 });
}
```

Or as a softer skip (avoids the silent overwrite without rejecting the full import):

```typescript
// Line 101 — replace silent clamp with an explicit skip:
if (item.count < 0) continue;  // do not upsert negative counts
const safeCount = item.count;  // already validated as non-negative
```

---

## Warnings

### WR-01: Input size check is placed after the full validation loop (DoS amplification)

**File:** `src/app/api/collection/import/route.ts:46-49`

**Issue:** The `MAX_IMPORT_ITEMS` guard (line 47) runs **after** the per-item `for` loop that validates every element (lines 28–39). For a payload with 100,000 items, the server iterates and validates all 100,000 items before rejecting with a 400. This allows a caller to drive significant CPU usage per request, proportional to the payload size, with no prior bound. The array-check at line 25 only rejects non-arrays; a large array is accepted into the full loop.

**Fix:** Move the size check to immediately after the array type check:

```typescript
if (!Array.isArray(rawBody)) {
  return new Response('Body must be a JSON array', { status: 400 });
}
// Move this block up, before the per-item loop:
if (rawBody.length > MAX_IMPORT_ITEMS) {
  return new Response(`Import exceeds maximum of ${MAX_IMPORT_ITEMS} items`, { status: 400 });
}
for (const item of rawBody) { ... }
```

---

### WR-02: Unused import `inArray` in CSV Import route

**File:** `src/app/api/collection/import/route.ts:4`

**Issue:** `inArray` is imported from `drizzle-orm` but is not referenced anywhere in `route.ts`. The route's DB lookup uses `or(...conditions)` with `and(eq(...), eq(...))` tuples — `inArray` was likely a leftover from an earlier implementation and was never removed.

**Fix:**

```typescript
// Remove inArray from the import:
import { and, eq, or } from 'drizzle-orm';
```

---

### WR-03: Raw SQL string `EXCLUDED.count` is fragile against column rename

**File:** `src/db/queries/collection.ts:313`

**Issue:** `batchIncrementVariantCounts` uses:

```typescript
count: sql`${userPrintingCollections.count} + EXCLUDED.count`,
```

The string `EXCLUDED.count` is a hardcoded PostgreSQL pseudo-table reference. If the schema column `count` is ever renamed (e.g., to `quantity` to match `userTradeOfferings`), this raw string will silently generate broken SQL (`EXCLUDED.count` would reference a non-existent column), producing a runtime error or wrong results. `batchUpsertVariantCounts` at line 342 has the same pattern with `sql\`EXCLUDED.count\``.

Neither instance will be caught at compile time by TypeScript.

**Fix:** Use Drizzle's `sql.raw` with a typed column reference to make this refactor-safe, or add a comment calling out the coupling:

```typescript
// Annotate explicitly so a rename is caught in review:
// NOTE: "count" here must match the DB column name in user_printing_collections.
count: sql`${userPrintingCollections.count} + EXCLUDED.count`,
```

Alternatively, consider using a subquery or named reference if Drizzle's version supports it. At minimum, document the coupling explicitly so a schema rename triggers a search for these strings.

---

### WR-04: `batchRecomputeTotals` does not zero-out totals when all variant rows are deleted

**File:** `src/db/queries/collection.ts:380`

**Issue:** At line 380, `if (sums.length === 0) return;` — if `cardDefinitionIds` is non-empty but the SELECT finds no matching `userPrintingCollections` rows for this user (e.g. all rows were deleted, not zeroed), the function returns early without touching `userCollections`. This leaves stale non-zero totals in `userCollections` for affected definitions.

The single-row `recomputeTotal` (line 261) has the identical issue — but the batch variant makes it more likely to be triggered at scale (e.g. after a full re-import that deletes then re-inserts rows, depending on the workflow).

If this function is intended to be authoritative (i.e. the total always equals the sum of current variant rows), the early return is incorrect for the case where all variant rows were deleted.

**Fix:** If variant rows can be deleted (not just zeroed), replace the early return with an upsert of 0 for all definitions in `cardDefinitionIds` that did not appear in `sums`:

```typescript
// After computing sums, build a complete list including missing definitions:
const sumsMap = new Map(sums.map(r => [r.cardDefinitionId, r.total]));
const allRows = cardDefinitionIds.map(id => ({
  userId,
  cardDefinitionId: id,
  count: Number(sumsMap.get(id) ?? 0),
}));
if (allRows.length === 0) return;
return db.insert(userCollections).values(allRows).onConflictDoUpdate({
  target: [userCollections.userId, userCollections.cardDefinitionId],
  set: { count: sql`EXCLUDED.count`, updatedAt: new Date() },
});
```

---

## Info

### IN-01: `handleFileUpload` silently submits empty payload when CSV normalizes to zero rows

**File:** `src/app/collection/page.tsx:56-81`

**Issue:** If `normalizeRedditCsv` returns an empty array (e.g. all rows skipped because no recognized columns), `setImportCardCount(0)` is set and the fetch is still dispatched to the API. The API short-circuits at line 42 and returns `{ success: true, count: 0 }`, resulting in the user seeing "Done! 0 cards imported." with no explanation. This is a confusing outcome for a user who uploaded a valid-looking file with the wrong column headers.

**Fix:** Add an early return after normalization:

```typescript
const normalized = normalizeRedditCsv(results.data, selectedSet);
if (normalized.length === 0) {
  setStatus('error'); // or add a new 'empty' status with a helpful message
  return;
}
setImportCardCount(normalized.length);
setStatus('uploading');
```

---

### IN-02: `readFileSync` in test creates a brittle CWD-dependent assertion

**File:** `src/app/decks/[id]/loading.test.tsx:39-46`

**Issue:** The test directly reads the source file via `readFileSync(join(process.cwd(), 'src/app/decks/[id]/loading.tsx'), 'utf-8')` to assert that it does not contain auth-related imports. This:
- Fails with a filesystem error (not a test assertion failure) if the test runner CWD is not the project root.
- Duplicates intent that TypeScript's static analysis already enforces.
- Creates a maintenance burden if the file is renamed or moved.

**Fix:** The test intent (ensuring no auth calls in a loading skeleton) is better enforced by a lint rule or a TypeScript import restriction rather than a runtime file read. At minimum, wrap the `readFileSync` in a try/catch that produces a clear assertion failure message rather than an uncaught exception.

---

### IN-03: `useEffect` fetch failure produces no user-facing error state for set selector

**File:** `src/app/collection/page.tsx:29-38`

**Issue:** If `/api/collection/sets` fails, `sets` remains an empty array, the set selector renders no options, and the file upload input is `disabled` (line 165: `!selectedSet` is truthy when `selectedSet` is `''`). The user sees a disabled UI with no explanation. The `console.error` on line 37 is only visible in dev tools.

**Fix:** Add a dedicated error state for the sets fetch and render a user-visible message:

```typescript
const [setsError, setSetsError] = useState(false);
// In the catch block:
setSetsError(true);
// In JSX, near the set selector:
{setsError && <p className="text-sm text-destructive">Failed to load sets. Please refresh the page.</p>}
```

---

_Reviewed: 2026-05-27T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
