---
phase: 21-binder-variant-badges
reviewed: 2026-05-23T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/app/api/cards/all/route.ts
  - src/app/api/trade/route.ts
  - src/app/binder/[username]/page.tsx
  - src/app/binder/manage/page.tsx
  - src/components/catalog/card-grid.tsx
  - src/components/catalog/card-item.test.tsx
  - src/components/catalog/card-item.tsx
  - src/db/queries/binder.ts
  - src/db/queries/catalog.ts
  - src/db/queries/trade.ts
  - src/db/schema.ts
  - tests/binder-flow.test.ts
  - tests/trade-api.test.ts
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-05-23T00:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

This phase adds variant type badges to the public binder view and the manage-binder card search. The core badge rendering in `CardItem` is straightforward and correct. The underlying database schema, query logic, and API route structure are sound for the happy path.

However, three blockers were found: the trade PATCH route passes a client-supplied `cardPrintingId` directly to the database without any type or bounds validation (allowing NaN or negative integer injection); the `lookingFor` assembly in `binder.ts` spreads a `Map.get()` result that may be `undefined`, producing objects with all-undefined fields that silently pass a `.filter(lf => lf.id !== undefined)` guard only when the guard succeeds — but the spread itself is unguarded; and the binder flow integration test has a mock topology mismatch that means it does not actually exercise `getPublicBinderData`'s query chain, giving false confidence.

---

## Critical Issues

### CR-01: No type validation on `cardPrintingId` in PATCH /api/trade — NaN silently reaches the DB

**File:** `src/app/api/trade/route.ts:16-23`

**Issue:** The route checks `cardPrintingId === undefined` but does not verify it is a finite integer. A client can send `{ "cardPrintingId": null, "tradeQuantity": 5 }` (passes the `=== undefined` guard), or `{ "cardPrintingId": "999; DROP TABLE ...", "tradeQuantity": 1 }`. Because `upsertTradeOffering` receives the raw value and Drizzle parameterises it, SQL injection is not the risk here — but `Number(null)` is `0`, which would corrupt a legitimate `cardPrintingId=0`-based record, and a non-numeric string produces `NaN`, which Drizzle passes as `NaN` to Postgres, causing an unhandled DB exception that leaks a 500 to the caller instead of a clean 400. Critically, a `null` body value produces `cardPrintingId = null`, which also passes the `!== undefined` guard and reaches `upsertTradeOffering(userId, null, quantity)`, mapping to `cardPrintingId = null` at the DB layer — violating the NOT NULL constraint and throwing an uncaught DB error that returns 500 rather than 400.

**Fix:**
```typescript
const { cardPrintingId, tradeQuantity } = body;

if (
  typeof cardPrintingId !== 'number' ||
  !Number.isInteger(cardPrintingId) ||
  cardPrintingId <= 0 ||
  typeof tradeQuantity !== 'number' ||
  !Number.isInteger(tradeQuantity)
) {
  return new Response('Invalid cardPrintingId or tradeQuantity', { status: 400 });
}
```

---

### CR-02: Same missing type validation in POST /api/binder/wants and POST /api/binder/exclusions

**File:** `src/app/api/binder/wants/route.ts:14-23` and `src/app/api/binder/exclusions/route.ts:14-23`

**Issue:** Both routes perform the same `=== undefined` guard and then pass the raw `cardDefinitionId` (and `quantity` / `excluded`) directly to query functions. `null` passes the `!== undefined` check and reaches the query with `cardDefinitionId = null`, violating the NOT NULL FK constraint and producing an unhandled 500. A non-integer `cardDefinitionId` (e.g. `1.5` or `"abc"`) similarly reaches the DB unchecked. For `exclusions/route.ts`, a non-boolean `excluded` value causes the `if (excluded)` branch to evaluate by JS truthiness — sending `{ excluded: 1 }` will add an exclusion because `1` is truthy, which is probably unintentional and inconsistent. This is the same class of bug as CR-01 and shares the same fix pattern.

**Fix:**
```typescript
// In wants/route.ts:
if (
  typeof cardDefinitionId !== 'number' ||
  !Number.isInteger(cardDefinitionId) ||
  cardDefinitionId <= 0 ||
  typeof quantity !== 'number' ||
  !Number.isInteger(quantity)
) {
  return new Response('Invalid cardDefinitionId or quantity', { status: 400 });
}

// In exclusions/route.ts:
if (
  typeof cardDefinitionId !== 'number' ||
  !Number.isInteger(cardDefinitionId) ||
  cardDefinitionId <= 0 ||
  typeof excluded !== 'boolean'
) {
  return new Response('Invalid cardDefinitionId or excluded', { status: 400 });
}
```

---

### CR-03: Unsafe spread of potentially-undefined `Map.get()` in `getPublicBinderData`

**File:** `src/db/queries/binder.ts:176-180`

**Issue:** The `lookingFor` array is built by spreading the result of `detailsMap.get(lf.cardDefinitionId)` directly:

```typescript
lookingFor: lookingForList.map(lf => ({
  ...detailsMap.get(lf.cardDefinitionId),   // ← this is CardDetail | undefined
  lookingForQuantity: lf.lookingForQuantity,
})).filter(lf => lf.id !== undefined)
```

Spreading `undefined` in JavaScript does not throw — it produces `{}`. The resulting object then has `lookingForQuantity` set but all card fields (`id`, `name`, `type`, etc.) as `undefined`. The `.filter(lf => lf.id !== undefined)` guard correctly removes these, so the returned array is safe. However, if the query in `cardDetails` does not return a row for a card that is in `cardsToFetch` (e.g. the card was deleted between the two queries), the entry is silently dropped from `lookingFor` with no warning. The deeper risk is that TypeScript infers the type of the spread as the union rather than flagging the undefined — downstream consumers receive an array typed as full card objects but possibly missing entries without any indication. This is a data-consistency hole that will manifest as a mysteriously missing "Looking For" card on the public binder page without any error.

Additionally: the `detailsMap` is keyed by `d.id` (cardDefinitionId), but the query joins `cardPrintings` to get rarity/setCode, and filters `eq(cardPrintings.variantType, 'Normal')`. If a card has no Normal printing (e.g. a promo-only card), it will have no entry in `detailsMap` and silently vanish. That is arguably correct behavior, but it means the filter precondition is invisible — a future maintainer may add a new card type and not realize the join will silently drop it.

**Fix:**
```typescript
lookingFor: lookingForList
  .map(lf => {
    const detail = detailsMap.get(lf.cardDefinitionId);
    if (!detail) return null;
    return { ...detail, lookingForQuantity: lf.lookingForQuantity };
  })
  .filter((lf): lf is NonNullable<typeof lf> => lf !== null)
```

This makes the guard explicit and the type narrowing sound, matching the pattern already used correctly in `getUserTradeData` (trade.ts:152-164).

---

## Warnings

### WR-01: `cardPrintings` unique constraint is on `(setCode, collectorNumber)` — does not prevent duplicate variant rows for the same card

**File:** `src/db/schema.ts:111-114`

**Issue:** The composite unique constraint is `unique().on(t.setCode, t.collectorNumber)`. The comment says "one row per physical printing variant", but `variantType` is not included in the constraint. Two rows with the same `(setCode, collectorNumber)` but different `variantType` values are therefore impossible — which contradicts the stated intent ("Foil", "Hyperspace", "Hyperspace Foil", and "Showcase" variants of the same card would logically share a `collectorNumber` but differ in `variantType`). If variants are intended to be distinct rows, the constraint must include `variantType`. If a single collector number maps to exactly one row (and variant is an attribute of that row), the schema is correct but the comment is misleading. Either the constraint is wrong or the comment is wrong — the mismatch will cause silent upsert collisions when ingesting variant data.

**Fix:** Clarify intent. If multiple variant rows per collector number are intended:
```typescript
unique().on(t.setCode, t.collectorNumber, t.variantType)
```
If only one row per collector number is intended, update the comment to reflect that.

---

### WR-02: `CardGrid` uses `collectorNumber` as the React `key` — not unique when the same card appears in multiple variants

**File:** `src/components/catalog/card-grid.tsx:47`

**Issue:** The key is `\`${card.collectorNumber}-${mode}\``. If the same collector number appears in multiple variant rows (e.g. `SOR-059` Normal and `SOR-059` Foil), both render with the key `SOR-059-binder`. React will emit a duplicate-key warning in development, and in production it will silently cause incorrect reconciliation: updating one card's trade quantity badge may re-render the wrong tile or skip re-rendering the correct one.

The proper key for a card row that is variant-aware is `printingId`, which is already available on `CardForFilter` (as confirmed by `catalog.ts` selecting `printingId: cardPrintings.id`).

**Fix:**
```tsx
key={`${card.printingId ?? card.collectorNumber}-${mode}`}
```
Or, because `printingId` should always be present in this data shape:
```tsx
key={card.printingId}
```

---

### WR-03: `updateTradeQuantity` in `manage/page.tsx` hard-codes quantity `1` when adding a new card — ignores actual intent

**File:** `src/app/binder/manage/page.tsx:294`

**Issue:** When the user clicks "Trade" in the search results, the click handler calls `updateTradeQuantity(card.printingId, 1)`. This always adds exactly 1 copy. If the user has already set a higher quantity for this card (i.e. an existing offering) and then searches for it again and clicks "Trade", the `PATCH /api/trade` call will reset the server-side quantity to `Math.max(0, 1) = 1`, overwriting the existing quantity. The optimistic update in state then replaces the displayed quantity with 1. The user has no feedback that their existing quantity was clobbered.

**Fix:** Before calling `updateTradeQuantity(card.printingId, 1)`, check whether an offering already exists for this printing. If it does, increment the existing `tradeQuantity` rather than resetting to 1:
```typescript
onClick={() => {
  const existing = tradeData?.offerings.find(o => o.cardPrintingId === card.printingId);
  updateTradeQuantity(card.printingId, (existing?.tradeQuantity ?? 0) + 1);
}}
```

---

### WR-04: `binder-flow.test.ts` mock topology does not match actual `getPublicBinderData` query chain — test gives false confidence

**File:** `tests/binder-flow.test.ts:68-78`

**Issue:** `getPublicBinderData` issues at least six chained DB calls (offerings query, inventory, manualWants, exclusions, decks, deckCards). The mock uses a single `mockResults` function that returns resolved values in sequence, attached to the `where` step of all non-user tables via `innerJoin: vi.fn().mockReturnThis()`. However, the actual queries also include `.leftJoin`, `.limit`, and in some cases `.innerJoin` called multiple times on the same builder. Because all non-user tables return `{ innerJoin: mockReturnThis, where: mockResults }`, the sequence of `mockResults` calls (line 59-65) must precisely match the order the function issues queries. The function does not call `innerJoin` on the inventory or exclusions queries — it calls `from(...).where(...)` directly. The mock returns `{ innerJoin, where }` for all non-user queries, meaning the mock's `where` is always used, but the real query for inventory does not call `innerJoin` at all. This means the mock silently absorbs extra `.where()` calls on the wrong mock step, and the sequence assertion is fragile. The test passes not because the code is correct but because the mock is lenient enough to absorb any call order. Specifically, `getPublicBinderData` on the real DB will not call `cardDetails` query when `cardsToFetch` is empty (because the mock's `calculateLookingFor` always returns 0), so step 6 of `mockResults` is never consumed — the test passes vacuously.

**Fix:** Either use a proper Drizzle query interceptor (e.g. `drizzle-kit` test helpers or a real test database) or restructure the mock to return distinct builder objects per table so that each call chain is independently verified. At minimum, add an assertion that `mockResults` was called the expected number of times:
```typescript
expect(mockResults).toHaveBeenCalledTimes(5); // offerings, inventory, wants, exclusions, decks
```

---

### WR-05: `mapToFilterable` in `binder/[username]/page.tsx` uses `any` type and silently drops fields

**File:** `src/app/binder/[username]/page.tsx:26-54`

**Issue:** The `mapToFilterable` function accepts `c: any` and populates `swudbId: ''`, `backArtUrl: null`, `frontText: null`, `backText: null`, `epicAction: null`, `doubleSided: false`, `unique: false`. Several of these are hardcoded rather than sourced from the query result. If `CardForFilter` consumers check `doubleSided` to decide whether to render a back-art button, they will never see it on the public binder page. The `unique` field (relevant for unique-card display rules) is also always `false`. The `getPublicBinderData` query does not fetch these fields, so the fix requires either expanding the query or documenting that these fields are intentionally omitted from the public binder view. Using `any` for `c` hides the mismatch from TypeScript.

**Fix:** Type `c` as the actual return type of `getPublicBinderData`:
```typescript
const mapToFilterable = (c: Awaited<ReturnType<typeof getPublicBinderData>>['offerings'][number]): CardForFilter => ({
  ...
});
```
This will cause a compile error that surfaces the missing fields, making the omissions explicit rather than silently defaulted.

---

## Info

### IN-01: `console.error` in API route catch blocks — appropriate for server-side but should include request context

**File:** `src/app/api/trade/route.ts:28`, `src/app/api/binder/wants/route.ts:28`, `src/app/api/binder/exclusions/route.ts:27`

**Issue:** Error logging catches the thrown error but logs no context about which user or which card was involved. In a serverless environment with concurrent requests, log lines will be interleaved with no way to correlate a failure to a specific request.

**Fix:** Include structured context in the log:
```typescript
console.error('Failed to update trade offering', { userId: session?.user?.id, cardPrintingId }, error);
```

---

### IN-02: `binder-flow.test.ts` imports `db`, `user`, `userTradeOfferings`, and `eq` from schema/drizzle but never uses them directly

**File:** `tests/binder-flow.test.ts:7-9`

**Issue:** Lines 7-9 import `{ db }`, `{ user, userTradeOfferings }`, and `{ eq }` which are only used to construct the mock call assertions (e.g. `expect(db.update).toHaveBeenCalledWith(user)`). However `eq` is imported but never referenced in the test body — it is dead import.

**Fix:** Remove the unused `eq` import from line 9.

---

### IN-03: Variant badge in `CardItem` is only shown in `binder` mode — `want` mode shows no variant context

**File:** `src/components/catalog/card-item.tsx:111-115`

**Issue:** The variant type badge (`{variantType}`) is gated on `isBinder`. The `want` mode (public binder "Looking For" section) does not show variant badges. The Looking For section in `getPublicBinderData` fetches only the Normal printing for each wanted card (line 169: `eq(cardPrintings.variantType, 'Normal')`), so variant badges on the want side may not be meaningful in the current data model. However, if a user wants a Hyperspace variant specifically, the want display will show the Normal art with no variant indicator, which could mislead trading partners. This is a product scope question more than a bug, but it should be a conscious decision.

**Fix:** Document the intentional limitation in a comment on line 111, or extend variant badge rendering to `isWant` mode if the want data model is extended to track variant preferences.

---

_Reviewed: 2026-05-23T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
