---
phase: 18-catalog-collection-enhancements
reviewed: 2026-05-20T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - src/app/api/collection/starter-deck/route.ts
  - src/app/cards/page.tsx
  - src/app/collection/page.tsx
  - src/components/catalog/card-grid.tsx
  - src/components/catalog/card-item.tsx
  - src/components/catalog/catalog-client.tsx
  - src/data/starter-decks.ts
  - src/db/queries/catalog.ts
  - src/db/queries/collection.ts
  - src/lib/catalog/select-best-variant.ts
  - tests/catalog-variant.test.ts
  - tests/starter-deck-api.test.ts
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 18: Code Review Report

**Reviewed:** 2026-05-20T00:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

The phase delivers two features: variant art selection for catalog tiles (REQ-COLLECT-08) and a starter-deck quick-add endpoint. The pure logic in `select-best-variant.ts` is correct and well-tested. The main risks are in the API route and the collection query:

1. The starter-deck route has a silent data-corruption path — if `session.user.id` is not a valid integer (e.g., an OAuth provider returns a UUID-style string), `Number()` yields `NaN`, which propagates into every `userId` parameter and will silently corrupt or fail DB writes without being caught by the `try/catch`.
2. `getUserCollection` fans out every printing for every card definition the user owns, including printings they have never touched — this produces incorrect variant counts for any card that has more than one printing (reprints, promo variants), because `userPrintingCollections` rows may exist for a printing of a *different* set under the same `cardDefinitionId`.

---

## Critical Issues

### CR-01: `Number(session.user.id)` is not validated — NaN silently corrupts DB writes

**File:** `src/app/api/collection/starter-deck/route.ts:29`

**Issue:** `session.user.id` is a `string` (Better Auth returns it as text from the serialised session). `Number()` does not throw — it returns `NaN` when the value is not purely numeric (e.g., a UUID or empty string). `NaN` is then passed as `userId` to `incrementVariantCount` and `recomputeTotal`. Drizzle will coerce `NaN` to `NULL` or `0` in the SQL parameter depending on the driver, meaning rows could be written with `userId = NULL` (bypassing the NOT NULL constraint and throwing a DB error that is swallowed by the outer `catch`) or `userId = 0` (writing data under a phantom user). The `catch` at line 71 logs and returns 500, but the partial writes issued before the failure remain committed (no transaction).

```typescript
// BEFORE (line 29)
const userId = Number(session.user.id);

// AFTER — validate before any DB work
const userId = parseInt(session.user.id, 10);
if (!Number.isFinite(userId) || userId <= 0) {
  return new Response('Invalid session', { status: 401 });
}
```

The same pattern appears throughout the codebase (all routes use `Number(session.user.id)` without guarding). This review flags only the new route introduced in this phase; the others are pre-existing.

---

### CR-02: `getUserCollection` JOIN fan-out returns variant counts for ALL printings of a card, not just the user's own

**File:** `src/db/queries/collection.ts:16-27`

**Issue:** The first `leftJoin` at line 16 joins `cardPrintings` on `cardPrintings.cardDefinitionId = userCollections.cardDefinitionId` — no filter on `setCode` or `variantType`. This produces one row per printing that shares a `cardDefinitionId` (i.e., every Normal, Foil, Hyperspace, SOR reprint, SHD reprint, etc. row). The second `leftJoin` to `userPrintingCollections` uses `userPrintingCollections.cardPrintingId = cardPrintings.id`, which is correct per-printing, but the expansion happens *before* the join, so for a card with N printings the query returns N rows — one for each printing — each carrying the same aggregate `total`. `buildCollectionMap` (in `collection-shape.ts`) deduplicates correctly for the `total` field, but also populates `variants` for every printing that happens to have a row in `userPrintingCollections` for *this user*. If the user imported a Normal SOR card and later a Foil SOR is added to the DB, the fan-out row for the Foil printing will produce a `variantCount = null` row (not a bug), but if the user independently upserted a Foil count, the map will include it. The structural bug is more subtle: the `total` stored in `userCollections` is summed over printings the user owns, but `getUserCollection` exposes *all* printings linked to the definition, mixing owned and un-owned printing rows. For `selectBestVariantArtUrl` this is benign (zero-count entries are skipped), but any consumer iterating `variants` and assuming every key represents an owned printing will be wrong.

More concretely: if a card has been reprinted in SOR (id=5) and SHD (id=42) and the user owns the SOR Normal printing (id=5, count=3), the query will return two rows: one for printing 5 (variantCount=3) and one for printing 42 (variantCount=null). `buildCollectionMap` will insert `{ 5: 3 }` but skip 42 (null guard at line 26). This is safe today, but only because of the null guard — the JOIN semantics are wrong and will silently break if a future consumer removes that guard or if `userPrintingCollections` ever receives a row with count=0 for an unrelated reason.

The correct fix is to push the `userCollections.userId` filter into the first JOIN condition or restructure the query to join `userPrintingCollections` directly:

```typescript
// BEFORE (line 16-19): joins ALL printings for the definition
.leftJoin(
  cardPrintings,
  eq(cardPrintings.cardDefinitionId, userCollections.cardDefinitionId)
)

// AFTER: scope to only the printings the user has touched
.leftJoin(
  userPrintingCollections,
  and(
    eq(userPrintingCollections.userId, userId),
    // ...then join cardPrintings to get cardDefinitionId if needed
  )
)
// Or, keep current structure but add a comment that the null guard in
// buildCollectionMap is load-bearing. At minimum add a defensive test.
```

Given the current `buildCollectionMap` null-guard this does not cause wrong data today, but the JOIN contract is incorrect and is one code-change away from a data integrity bug.

---

## Warnings

### WR-01: `cardsAdded` counts qty of skipped cards as zero but silently skips them — caller has no visibility into partial success

**File:** `src/app/api/collection/starter-deck/route.ts:54-62`

**Issue:** When a card's `collectorNumber` is not found in the DB (line 55 `continue`), the card and its `qty` are silently dropped. The response `{ cardsAdded }` at line 70 only reflects cards that were matched. The UI at `src/app/collection/page.tsx:96` shows "Added N cards from [deck]" using this number, so the user sees a lower count with no indication of missing cards. If there are data gaps (which the comments acknowledge as possible), a user adding a 50-card deck might see "Added 44 cards" with no explanation for the missing 6.

**Fix:** Return both a count and a `skipped` count (or a boolean `partial`) so the UI can surface a warning:

```typescript
return Response.json({ cardsAdded, skipped: deck.cards.length - matchedCardCount });
```

And in the UI check `data.skipped > 0` to show a warning banner.

---

### WR-02: Auth mock in `starter-deck-api.test.ts` is wired incorrectly — the test does not exercise the auth path at all

**File:** `tests/starter-deck-api.test.ts:21-23`

**Issue:** The mock at line 21 mocks `@/lib/auth` as:
```typescript
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: '1' } }),
}));
```
But the production code calls `auth.api.getSession(...)` — `auth` is an object with an `.api` property, not a function. The mock replaces `auth` with a plain function, so `auth.api` would be `undefined` in test, and `auth.api.getSession` would throw `TypeError: Cannot read properties of undefined`. This means the test at line 27 (`POST endpoint is exported`) never actually calls the handler in a real request — it only imports the module. All four test cases in `describe('REQ-CAT-04')` that import the route module will succeed trivially because they never invoke `POST` with a real `Request`. The auth guard is untested.

**Fix:**
```typescript
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({ user: { id: '1' } }),
    },
  },
}));
```

---

### WR-03: `selectBestVariantArtUrl` returns `null` when the best variant has a null art URL, but the caller treats `null` as "no override" — shows wrong art for owned cards with missing URLs

**File:** `src/lib/catalog/select-best-variant.ts:56` / `src/components/catalog/card-grid.tsx:39-42`

**Issue:** `selectBestVariantArtUrl` returns `null` in two distinct situations: (a) the user owns no variants, and (b) the user owns variants but the best one has a `null` `frontArtUrl`. `CardGrid` treats both cases identically at line 40:
```typescript
const bestVariantArtUrl =
  cardVariants && printingArtMap
    ? selectBestVariantArtUrl(cardVariants, printingArtMap)
    : null;
```
`CardItem` then does `const displayUrl = bestVariantArtUrl ?? normalDisplayUrl` (card-item.tsx:62), which falls back to `normalDisplayUrl` when `bestVariantArtUrl` is `null`. This means if a user owns a Showcase copy but that Showcase printing has no `frontArtUrl` in the DB, the tile silently shows the Normal art instead — the user can't tell their Showcase is being used to determine the display. This is a logic/data-representation ambiguity rather than a crash, but it produces misleading display.

**Fix:** Return a sentinel distinct from null to differentiate "user owns nothing" from "user owns something but art URL is missing":
```typescript
// Option: return { artUrl: string | null; hasOwned: boolean } instead of string | null
```
Or at minimum document the limitation in the function's JSDoc so future consumers understand the dual-null semantics.

---

### WR-04: `catalog-client.tsx` missing `onUpdateCount` — users cannot update counts from the catalog page

**File:** `src/components/catalog/catalog-client.tsx:224-232`

**Issue:** `CardGrid` is rendered at line 224 without passing `onUpdateCount`:
```tsx
<CardGrid
  cards={filtered}
  collection={collection}
  printingArtMap={printingArtMap}
  mode={mode}
  deckCounts={deckCounts}
  onDeckUpdate={onDeckUpdate}
/>
```
`CardItem` checks `onUpdateCount` at line 171 to decide whether to show the count-adjustment controls. Without it, the catalog tile hover shows only a name label (the final `else` branch at card-item.tsx:206). If `CatalogClient` is only used as a read-only viewer with no inline count editing (editing happens elsewhere), this is intentional — but there is no comment or prop documenting this choice, making it look like a forgotten prop. If inline editing was intended, this silently disables it.

**Fix:** Either pass an `onUpdateCount` handler wired to the collection API, or add a comment to `CatalogClient` explicitly noting that catalog-mode is read-only.

---

## Info

### IN-01: `console.error` in production API route leaks internal error details to server logs

**File:** `src/app/api/collection/starter-deck/route.ts:72`

**Issue:** `console.error('Starter deck quick-add failed:', error)` will print the full error (including DB error messages with table/column names) to server logs. This is consistent with the existing codebase pattern but is a mild information-disclosure risk in production. No fix required now, but worth tracking as technical debt.

---

### IN-02: `collectionCount` column selected in `getAllCards` but not used / not included in `plainCards`

**File:** `src/db/queries/catalog.ts:38` / `src/app/cards/page.tsx:22-48`

**Issue:** `getAllCards` selects `collectionCount: sql<number>\`COALESCE(${userCollections.count}, 0)\`` at line 38, but `page.tsx` does not include `collectionCount` in `plainCards` (lines 22-48). The field is computed in SQL (potentially a full join pass) but thrown away on every render. If `collectionCount` is not used anywhere downstream, the SQL expression is dead weight. If it was intended to replace the client-side `collection` fetch in `CatalogClient`, the connection is incomplete.

**Fix:** Audit whether `collectionCount` is consumed anywhere. If not, remove the SQL expression from `getAllCards` to save query cost.

---

### IN-03: Starter deck data has no duplicate-id guard — a typo could register two decks with the same id silently

**File:** `src/data/starter-decks.ts`

**Issue:** The `starterDecks` array has 11 entries and is validated in tests for required fields and positive quantities, but no test checks for duplicate `id` values. The route's `find` at route.ts:24 returns the first match only — a duplicate would silently hide the second deck.

**Fix:** Add a test assertion:
```typescript
const ids = starterDecks.map(d => d.id);
expect(new Set(ids).size).toBe(ids.length); // no duplicate ids
```

---

_Reviewed: 2026-05-20T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
