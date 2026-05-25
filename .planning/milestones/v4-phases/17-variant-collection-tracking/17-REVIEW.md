---
phase: 17-variant-collection-tracking
reviewed: 2026-05-18T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/app/api/collection/collection-shape.ts
  - src/app/api/collection/route.ts
  - src/app/api/collection/variants/route.ts
  - src/app/api/collection/import/route.ts
  - src/app/cards/[set-code]/[card-number]/page.tsx
  - src/components/catalog/catalog-client.tsx
  - src/components/catalog/card-grid.tsx
  - src/components/catalog/card-item.tsx
  - src/components/catalog/variant-collection-section.tsx
  - src/components/decks/want-list-tab.tsx
  - src/db/queries/card-detail.ts
  - src/db/queries/collection.ts
  - src/db/schema.ts
  - src/lib/collection/normalize.ts
  - src/lib/filter-cards.ts
  - src/lib/want-list.ts
findings:
  critical: 5
  warning: 5
  info: 2
  total: 12
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-05-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This phase introduces per-variant collection tracking via a new `user_printing_collections` table, a `variants/` mutation route, an updated import route, and a `VariantCollectionSection` component. The architecture is sound overall — auth is correctly sourced from session, the `buildCollectionMap` shape is well-defined, and the legacy hydration guard is logically correct.

Five blockers were found: two involve `NaN` propagating into DB writes (unvalidated string counts in both mutation routes), one is a silent HTTP error swallow in `VariantCollectionSection` that leaves optimistic state permanently desynchronized, one is a potential data integrity double-count in the CSV normalizer, and one is a missing `cardDefinitionId` filter in the `getUserCollection` JOIN that leaks all printings for a definition across all users' collection rows. Five warnings cover the missing optimistic rollback, a TOCTOU window in the two-step upsert/recompute, unbounded import body size, stale-total risk in `buildCollectionMap`, and the hard-coded `variantType = 'Normal'` filter causing 404s for non-Normal-primary printings.

---

## Critical Issues

### CR-01: `NaN` flows into DB upsert when `count` is a non-numeric string

**File:** `src/app/api/collection/variants/route.ts:31`

**Issue:** The route validates that `cardPrintingId` is a number but applies no type or `isNaN` check to `count`. A request body of `{ cardPrintingId: 1, count: "abc" }` passes the presence check (`count !== undefined`), and `Math.max(0, Number("abc"))` evaluates to `Math.max(0, NaN)` which equals `NaN`. That `NaN` is then passed directly to `upsertVariantCount` as the count argument and ultimately written to the `integer` column. PostgreSQL will reject the value with a runtime error, but the error is swallowed by the outer `try/catch` and returns a 500 with no indication to the client of what went wrong. With a numeric string like `"5"`, `Number("5")` silently succeeds and the count proceeds — inconsistent coercion semantics that bypass the "must be a number" intent.

**Fix:**
```typescript
if (typeof count !== 'number' || !Number.isFinite(count)) {
  return new Response('count must be a finite number', { status: 400 });
}
const safeCount = Math.max(0, Math.floor(count));
```

---

### CR-02: `NaN` count propagates through import route when JSON values are non-numeric

**File:** `src/app/api/collection/import/route.ts:60`

**Issue:** The body is cast to `Record<string, number>` at the TypeScript level but there is no runtime validation that the values are actually numbers. If a malicious or malformed client sends `{ "SOR-059": "DROP TABLE" }`, then `Math.max(0, "DROP TABLE" as unknown as number)` evaluates to `NaN` (since `Math.max` coerces and `NaN` wins). `upsertVariantCount` receives `NaN` for the count and will trigger a PostgreSQL type error, caught by the outer handler and silently returned as 500. With a numeric-looking string like `"3"`, `Math.max(0, "3")` evaluates to `3` due to JavaScript implicit coercion — so string counts silently succeed where they should be rejected. Add explicit runtime validation:

**Fix:**
```typescript
const normalizedCounts: unknown = await request.json();
if (
  typeof normalizedCounts !== 'object' ||
  normalizedCounts === null ||
  Array.isArray(normalizedCounts)
) {
  return new Response('Body must be a JSON object', { status: 400 });
}
for (const [key, val] of Object.entries(normalizedCounts as Record<string, unknown>)) {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    return new Response(`Invalid count for key "${key}": must be a finite number`, { status: 400 });
  }
}
const counts = normalizedCounts as Record<string, number>;
```

---

### CR-03: `VariantCollectionSection` silently discards server errors — optimistic state permanently wrong

**File:** `src/components/catalog/variant-collection-section.tsx:42-51`

**Issue:** `fetch` only rejects on network-level failures (DNS, timeout). A server-side 400, 404, or 500 response resolves the Promise normally with a non-ok `Response` object — it does NOT throw. The `catch` block therefore never fires for server errors. When the server returns an error status:

1. The optimistic state update has already been applied (`setCounts` at line 40).
2. No `response.ok` check is performed.
3. The count in the UI is now permanently wrong — it shows the optimistic value the server rejected.

This is a data integrity failure from the user's perspective: they see a count they cannot trust, with no way to know the persist failed short of refreshing.

**Fix:**
```typescript
const updateVariant = async (cardPrintingId: number, newCount: number) => {
  if (!isAuthenticated) { router.push('/login'); return; }
  const val = Math.max(0, newCount);

  // Capture previous value for rollback
  const prev = counts[cardPrintingId] ?? 0;
  setCounts(c => ({ ...c, [cardPrintingId]: val }));

  try {
    const res = await fetch('/api/collection/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardPrintingId, count: val }),
    });
    if (!res.ok) {
      // Roll back on server error
      setCounts(c => ({ ...c, [cardPrintingId]: prev }));
      console.error('Failed to update variant count:', await res.text());
    }
  } catch (err) {
    setCounts(c => ({ ...c, [cardPrintingId]: prev }));
    console.error('Failed to update variant count:', err);
  }
};
```

---

### CR-04: `normalizeRedditCsv` double-counts cards when both `Standard` and `Non-Foil` columns are non-zero

**File:** `src/lib/collection/normalize.ts:38`

**Issue:** `const normalCount = Math.max(0, standard + nonFoil)` sums the `Standard` column value and the `Non-Foil` column value together. The comment explains that "Standard" and "Non-Foil" are the same physical variant in different set tabs — so for any given row, at most one of them should be non-zero. However, there is no guard enforcing this. If a CSV ever has both columns populated (e.g., an improperly formatted spreadsheet, or a future set with both column headers), the counts are silently added together, resulting in a doubled count inserted into the database. This is invisible to the user and corrupts collection data.

**Fix:** Use `Math.max` of the two instead of sum, since they represent the same variant:
```typescript
// Standard and Non-Foil represent the same physical variant — take the max to avoid
// doubling if a spreadsheet ever has both columns filled for the same card.
const normalCount = Math.max(0, Math.max(standard, nonFoil));
```
Alternatively, validate upstream that exactly one of the two is non-zero and return an error if both are.

---

### CR-05: Unbounded import body allows DoS via thousands of sequential DB round-trips

**File:** `src/app/api/collection/import/route.ts:55-65`

**Issue:** There is no limit on the number of keys in the incoming JSON body. Each key in `normalizedCounts` that maps to a known printing triggers an `await upsertVariantCount(...)` call sequentially inside a `for...of` loop. A set with 500+ cards can already produce 500+ sequential DB round-trips per import (plus one `recomputeTotal` per affected card definition). An attacker who knows the route exists can craft a body with thousands of synthetic collectorNumbers (which will simply be filtered by the `mapping` lookup, but the loop itself still iterates all of them). A legitimate user importing multiple sets at once could create enough load to exhaust the serverless DB connection pool or time out the serverless function.

**Fix:**
```typescript
const MAX_IMPORT_KEYS = 2000;
if (collectorNumbers.length > MAX_IMPORT_KEYS) {
  return new Response(`Import exceeds maximum of ${MAX_IMPORT_KEYS} entries`, { status: 400 });
}
```

---

## Warnings

### WR-01: Optimistic update in `VariantCollectionSection` is not rolled back on error (companion to CR-03)

**File:** `src/components/catalog/variant-collection-section.tsx:40`

**Issue:** Even if CR-03 is partially addressed by adding a `response.ok` check, the current code structure requires explicit rollback logic to be added. Without it, any transient server error leaves the UI permanently desynchronized. This is the "no UI error indicator in this phase" comment, but the lack of rollback is functionally different from a lack of visible indicator — the data is wrong, not just unconfirmed.

**Fix:** Capture the previous count before the optimistic update and restore it on failure. Full fix shown in CR-03 above.

---

### WR-02: TOCTOU window between `upsertVariantCount` and `recomputeTotal`

**File:** `src/app/api/collection/variants/route.ts:34,49`  
**File:** `src/app/api/collection/import/route.ts:62,69`

**Issue:** The two-step pattern — upsert a variant count, then recompute the aggregate total — is acknowledged as non-transactional due to the Neon HTTP driver limitation. Under concurrent requests (two browser tabs, rapid clicks), a second request for the same card can upsert its variant count between another request's upsert and recompute steps. The recompute then reads a mix of the first request's intended final state and the second request's new value. The result written to `userCollections.count` will be some intermediate total that doesn't reflect either request's intended outcome.

In practice this is unlikely given the single-user nature of collection editing, but it is a real correctness hazard for the import route which processes many variants sequentially — a concurrent single-variant edit during a bulk import could produce a wrong total.

**Fix:** The long-term fix requires HTTP-over-WebSocket Drizzle connection to support transactions. Short-term, document the known hazard and consider rate-limiting or serializing mutation requests client-side (e.g., a request queue in `VariantCollectionSection`).

---

### WR-03: `buildCollectionMap` uses the first row's `total` and ignores subsequent rows' `total` for the same card

**File:** `src/app/api/collection/collection-shape.ts:23-24`

**Issue:** The guard `if (!map[row.cardDefinitionId])` initializes the entry with `row.total` from the first encountered row. Subsequent rows for the same card only add variant entries. Under the current LEFT JOIN in `getUserCollection`, all rows for a given `cardDefinitionId` replicate the same `userCollections.count` value as `total`, so this is harmless today. However, if the JOIN order changes, if the query is reused in a different context, or if a bug elsewhere causes `userCollections.count` to be updated between two query rows (impossible in a single query but theoretically fragile), the first row wins silently. The design assumption is not enforced.

**Fix:** Assert consistency or explicitly select the total per-group:
```typescript
// Either: assert all totals for the same key match (in dev/test)
// Or: re-compute total from variant sums client-side after building the map
// Simplest defensive fix: use the max total across rows
if (!map[row.cardDefinitionId]) {
  map[row.cardDefinitionId] = { total: row.total, variants: {} };
} else if (row.total > map[row.cardDefinitionId].total) {
  map[row.cardDefinitionId].total = row.total; // take max if rows disagree
}
```

---

### WR-04: `getCardByPrinting` hard-codes `variantType = 'Normal'` — non-Normal variant URLs 404

**File:** `src/db/queries/card-detail.ts:52`

**Issue:** The query filters `eq(cardPrintings.variantType, 'Normal')`. This means navigating to `/cards/SOR/059` works only if the SOR-059 printing has a `Normal` variant in `card_printings`. If the URL is constructed from a Foil or Hyperspace `collectorNumber`, or if a future set has cards with no Normal printing, the query returns null and `notFound()` is called even though the card exists. The `CardItem` component constructs its URL from the card's `collectorNumber` (which includes set prefix), so as long as `collectorNumber` is always the Normal variant's number, this is safe — but it is an undocumented coupling between URL construction and this query.

**Fix:** Either document this assumption explicitly in the query comment, or remove the variantType filter and instead add an `ORDER BY variantType` with a preference for 'Normal' (e.g., `CASE WHEN variantType='Normal' THEN 0 ELSE 1 END`) combined with `.limit(1)`.

---

### WR-05: `WantListTab` fetches collection on every mount with no auth guard

**File:** `src/components/decks/want-list-tab.tsx:21-32`

**Issue:** The `useEffect` fetches `/api/collection` unconditionally on mount with no check for authentication. If the tab is rendered for an unauthenticated user (possible if parent component fails to guard), the request hits the server, receives a 401, and `res.json()` on a plain-text "Unauthorized" response throws a JSON parse error. This leaves `collection` as `{}` and `loading` as `false` (since the `.catch` sets `setLoading(false)`), silently showing an empty want list rather than an auth error. This is a silent failure.

Additionally, unlike `CatalogClient` which checks `isAuthenticated` before fetching, `WantListTab` has no such guard.

**Fix:**
```typescript
useEffect(() => {
  fetch('/api/collection')
    .then(res => {
      if (!res.ok) {
        setLoading(false);
        return;
      }
      return res.json();
    })
    .then(data => {
      if (data) setCollection(data);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to load collection:', err);
      setLoading(false);
    });
}, []);
```

---

## Info

### IN-01: Legacy hydration in Server Component issues a write on every page render

**File:** `src/app/cards/[set-code]/[card-number]/page.tsx:39-46`

**Issue:** The legacy hydration block runs `upsertVariantCount` (a DB write) inside a Server Component's render function every time the card detail page is loaded, for any user whose `card.collectionCount > 0` and all current variant counts are zero. This covers two scenarios: (a) genuinely pre-migration legacy data (correct behavior), and (b) a user who legitimately has a non-zero legacy total but has since zeroed out all variants (incorrectly re-seeds the Normal variant from the now-stale legacy total). Once a user visits the page after migration, the variant counts will be non-zero, so subsequent visits skip the block — but the first post-migration visit issues a write per card page visited.

This is an intentional one-time migration shim, but it should be documented with a removal ticket, and the ambiguity in scenario (b) noted.

**Fix:** Add a comment noting this should be removed after the migration window closes (e.g., 30–60 days after deploy), and consider tracking migration state to avoid re-running.

---

### IN-02: `collectorNumber` uniqueness constraint may not match expected multi-set behavior

**File:** `src/db/schema.ts:113`

**Issue:** The `unique().on(t.setCode, t.collectorNumber)` constraint means no two rows in `card_printings` can share the same `(setCode, collectorNumber)` pair. Since `collectorNumber` is stored as `"SOR-059"` (already prefixed with set code), and `setCode` is stored separately as `"SOR"`, the uniqueness constraint is effectively `(setCode, setCode + "-" + number)`. This is redundant — `collectorNumber` already encodes `setCode`. The constraint still functions correctly, but the redundancy could confuse future schema migrations or queries that need to understand the constraint scope.

**Fix:** Consider either storing `collectorNumber` as just the numeric suffix (e.g., `"059"`) and deriving the full identifier in queries, or dropping `setCode` from the unique constraint since `collectorNumber` alone should be globally unique given its format.

---

_Reviewed: 2026-05-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
