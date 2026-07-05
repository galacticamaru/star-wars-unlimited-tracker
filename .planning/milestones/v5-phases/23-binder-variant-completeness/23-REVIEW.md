---
phase: 23-binder-variant-completeness
reviewed: 2026-05-26T00:00:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - drizzle/0005_binder_variant_completeness.sql
  - drizzle/meta/_journal.json
  - src/app/api/binder/wants/route.ts
  - src/app/api/cards/all/route.ts
  - src/app/api/collection/owned-cards/route.ts
  - src/app/api/trade/route.ts
  - src/app/binder/[username]/page.tsx
  - src/app/binder/manage/page.tsx
  - src/app/cards/[set-code]/[card-number]/page.tsx
  - src/components/binder/manage-wants-list.tsx
  - src/components/binder/manual-wants-add-flow.tsx
  - src/components/binder/variant-trade-sheet.tsx
  - src/components/catalog/card-grid.tsx
  - src/components/catalog/card-item.test.tsx
  - src/components/catalog/card-item.tsx
  - src/components/catalog/variant-collection-section.tsx
  - src/components/catalog/variant-trade-section.tsx
  - src/data/starter-decks.ts
  - src/db/queries/binder.ts
  - src/db/queries/card-detail.ts
  - src/db/queries/catalog.ts
  - src/db/queries/collection.ts
  - src/db/queries/trade.ts
  - src/db/schema.ts
  - tests/binder-flow.test.ts
  - tests/trade-api.test.ts
findings:
  critical: 4
  warning: 6
  info: 3
  total: 13
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-05-26T00:00:00Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

This phase migrates `trade_manual_wants` from a `card_definition_id`-keyed table to a `card_printing_id`-keyed table, adds per-variant binder management UI, and exposes variant chips in the manual-wants add flow. The structural change is directionally correct, but four blockers were found: the test suite for the wants API is silently wrong (it still passes `cardDefinitionId` to a route that now expects `cardPrintingId`, so the assertions pass against mock data that has nothing to do with the real logic); the migration timestamp is in the past and will silently mis-order against any future migration applied in 2025; the binder page's `mapToFilterable` hard-codes sentinel values for several fields that affect filtering behaviour; and the `VariantTradeSheet` renders `VariantCollectionSection` without an `onQuantityChange` callback, leaving collection updates from the sheet silently broken. Additionally, several warnings around input validation, optimistic-update gaps, and a variable-shadowing bug are documented below.

---

## Critical Issues

### CR-01: Test suite for wants API passes wrong field — assertions are vacuous

**File:** `tests/trade-api.test.ts:66-88`

**Issue:** The `POST /api/binder/wants` tests send `cardDefinitionId` in the request body, but the actual route (`src/app/api/binder/wants/route.ts:14`) destructures `cardPrintingId`. When the test fires, the route receives `cardPrintingId === undefined`, hits the guard on line 16, and returns 400 — yet the tests expect 200 and assert `upsertManualWant` was called. This only "passes" because the entire route module is mocked via `vi.mock('@/db/queries/trade', ...)`, meaning the real guard branch is never executed — the mock `upsertManualWant` is invoked regardless of what the route does with the body. The tests therefore cannot detect the schema mismatch.

More concretely: if `upsertManualWant` were to fire on `cardDefinitionId` instead of `cardPrintingId`, it would insert a row with a printing-level FK pointing to a definition ID, which is either a constraint violation or silent data corruption. The test gives a false green signal.

**Fix:**
```typescript
// tests/trade-api.test.ts — wants suite

it('upserts manual want', async () => {
  const request = new NextRequest('http://localhost/api/binder/wants', {
    method: 'POST',
    body: JSON.stringify({ cardPrintingId: 202, quantity: 3 }), // was: cardDefinitionId
  });

  const response = await wantsPOST(request);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(upsertManualWant).toHaveBeenCalledWith(1, 202, 3);
});

it('deletes manual want if quantity is 0', async () => {
  const request = new NextRequest('http://localhost/api/binder/wants', {
    method: 'POST',
    body: JSON.stringify({ cardPrintingId: 202, quantity: 0 }), // was: cardDefinitionId
  });

  const response = await wantsPOST(request);
  expect(response.status).toBe(200);
  expect(deleteManualWant).toHaveBeenCalledWith(1, 202);
});
```

---

### CR-02: Migration timestamp is in the past — future migrations will silently mis-order

**File:** `drizzle/meta/_journal.json:43`

**Issue:** Entry `0005_binder_variant_completeness` has `"when": 1748304000000`, which is 2025-05-27 in UTC — before the four preceding migrations whose `when` values are all in 2025-05-03 through 2025-05-12. Drizzle Kit sorts migrations primarily by `idx`, so the execution order is preserved for existing entries. However, if a new migration is generated while the current clock is after 2025-05-27, its `when` will be later than 0005's but earlier than would be expected if a developer were to sort by timestamp for debugging purposes. More critically, if any tooling or migration runner uses `when` as the sort key instead of `idx`, migration 0005 will execute out of order, applying the schema after a table-state where `card_printing_id` does not yet exist.

The immediate risk is that the `when` value of `1748304000000` (2025-05-27) is already in the past relative to all other migrations in the journal, but set to a hard-coded future-relative value rather than the actual generation timestamp. Any automated tooling that introspects `when` for ordering will silently mis-order.

**Fix:** Regenerate the journal entry with the actual current Unix timestamp (milliseconds):
```json
{
  "idx": 5,
  "version": "7",
  "when": 1748908800000,
  "tag": "0005_binder_variant_completeness",
  "breakpoints": true
}
```
Use `Date.now()` at the time of actual migration generation, not a manually chosen date.

---

### CR-03: `VariantTradeSheet` renders `VariantCollectionSection` without an `onQuantityChange` prop — collection updates silently no-op from the sheet

**File:** `src/components/binder/variant-trade-sheet.tsx:47`

**Issue:** `VariantCollectionSection` is a fully interactive component that calls `/api/collection/variants` and maintains local state. Rendering it inside the sheet is intentional (to show owned counts). However, `VariantCollectionSection`'s `printings` prop only receives the `ownedCount` values from `SheetPrinting`, which does not include `frontArtUrl`. The `SheetPrinting` interface (line 7-12) omits `frontArtUrl`, so the `VariantCollectionSection` receives printings without art URLs — this is not the blocker.

The actual blocker: after a user changes collection counts inside the sheet via `VariantCollectionSection`, the `ownedCards` state in the parent (`manage/page.tsx`) is NOT updated. The sheet's `VariantCollectionSection` writes to the DB but the parent's `ownedCards` array still holds stale `ownedCount` values. When the sheet closes and the user re-opens it, the `printings` prop is reconstructed from the (now stale) `ownedCards` state, so the sheet shows wrong counts. There is no `onCountChange` wired up: `VariantTradeSheet` has no such prop, and `VariantCollectionSection` does not emit collection-level changes upward.

**Fix:** Either (a) add an `onOwnedCountChange` prop chain from `VariantCollectionSection` → `VariantTradeSheet` → `manage/page.tsx` to update local state, or (b) stop embedding `VariantCollectionSection` in the sheet and only embed `VariantTradeSection`. Option (b) is simpler and aligns with the sheet's stated purpose (trade quantity management):

```tsx
// src/components/binder/variant-trade-sheet.tsx

// Remove VariantCollectionSection import
// In the render:
{printings.length === 0 ? (
  <p className="px-6 py-4 text-sm text-muted-foreground">No owned printings to display.</p>
) : (
  <div className="px-6 py-6 flex flex-col gap-6">
    {/* Only trade section — collection edits belong on the card detail page */}
    <VariantTradeSection
      printings={printings}
      onQuantityChange={onTradeQuantityChange}
    />
  </div>
)}
```

---

### CR-04: `binder/[username]/page.tsx` — `mapToFilterable` hard-codes `backArtUrl: null`, `doubleSided: false`, and `unique: false`, breaking filtering for Leaders

**File:** `src/app/binder/[username]/page.tsx:43-53`

**Issue:** The `mapToFilterable` function assembles a `CardForFilter` from the raw binder data but substitutes sentinel values for several fields:
- `backArtUrl: null` — Leaders have a real back art URL needed for the card image toggle.
- `doubleSided: false` — `CardItem` / `CardImageSection` uses `doubleSided` to decide whether to render a flip button. Setting it to `false` for Leaders means the public binder page never renders the flip button.
- `unique: false` — unique cards may be filtered differently in some modes.
- `frontText: null`, `backText: null`, `epicAction: null` — these are safe (not displayed in binder mode tiles), but `doubleSided` and `backArtUrl` are not.

The root cause is that `getPublicBinderData` does not return these fields. However, because `mapToFilterable` unconditionally sets them to `false`/`null`, Leader cards in a public binder will always render without a flip-side image and without the back-image toggle, regardless of what data the DB contains.

**Fix:** Either extend `getPublicBinderData` to return `backArtUrl` and `doubleSided` from `cardDefinitions`/`cardPrintings`, or stop casting to `CardForFilter` and use a binder-specific type that omits those fields. Quick fix for the flip button:

```typescript
// src/db/queries/binder.ts — offerings select
backArtUrl: cardPrintings.backArtUrl,    // add
doubleSided: cardDefinitions.doubleSided, // add
```
```typescript
// src/app/binder/[username]/page.tsx mapToFilterable
backArtUrl: c.backArtUrl ?? null,
doubleSided: c.doubleSided ?? false,
```

---

## Warnings

### WR-01: `binder/wants/route.ts` POST — `quantity` validation allows negative values to delete silently

**File:** `src/app/api/binder/wants/route.ts:20`

**Issue:** The guard `if (quantity <= 0)` routes to `deleteManualWant`. A client sending `quantity: -99` will silently delete the want row without any indication of invalid input. While this may be acceptable as a design choice, there is no input type-check: if `quantity` arrives as a non-numeric string (e.g. `quantity: "abc"`), the condition `"abc" <= 0` is `false` in JS, so it falls through to `upsertManualWant(userId, cardPrintingId, "abc")` which passes a string to a DB integer column, risking a runtime type error or silent truncation.

**Fix:**
```typescript
const qty = Number(quantity);
if (!Number.isFinite(qty) || !Number.isInteger(qty)) {
  return new Response('Invalid quantity', { status: 400 });
}
if (qty <= 0) {
  await deleteManualWant(Number(session.user.id), Number(cardPrintingId));
} else {
  await upsertManualWant(Number(session.user.id), Number(cardPrintingId), qty);
}
```

---

### WR-02: `binder/wants/route.ts` DELETE — `cardPrintingId` from query string parsed but not validated for NaN

**File:** `src/app/api/binder/wants/route.ts:47`

**Issue:** `parseInt(cardPrintingId, 10)` can produce `NaN` if the query param is not a valid integer string (e.g. `?cardPrintingId=abc`). `NaN` is then passed as the second argument to `deleteManualWant`, where the Drizzle `eq` clause will compare against `NaN`. In PostgreSQL this emits `WHERE card_printing_id = NaN`, which Postgres casts to `WHERE card_printing_id = 'NaN'::integer` — a runtime error on some drivers or silently matches nothing on others. Either way, the route returns 200 (`success: true`) for an invalid input.

**Fix:**
```typescript
const idNum = parseInt(cardPrintingId, 10);
if (isNaN(idNum)) {
  return new Response('Invalid cardPrintingId', { status: 400 });
}
await deleteManualWant(Number(session.user.id), idNum);
```

---

### WR-03: `variant-collection-section.tsx` — variable shadowing on `prev` in optimistic rollback

**File:** `src/components/catalog/variant-collection-section.tsx:43`

**Issue:** At line 40 the function captures `const prev = counts[cardPrintingId] ?? 0` to use as a rollback value. Three lines later the optimistic update uses `setCounts(prev => ({ ...prev, [cardPrintingId]: val }))`. The inner callback parameter is also named `prev`, which shadows the outer `prev` (the captured rollback snapshot). This is a latent bug: within the rollback `setCounts` calls at lines 53 and 58, the callback parameter is renamed to `c`, so those rollbacks are correct. However, the naming creates a trap for future maintainers who might write the optimistic update as `setCounts(prev => ...)` and accidentally use `prev[cardPrintingId]` as the rollback value rather than the captured snapshot.

**Fix:** Rename the captured rollback value to avoid shadowing:
```typescript
const prevCount = counts[cardPrintingId] ?? 0;
// ...
setCounts(c => ({ ...c, [cardPrintingId]: val }));
// rollback:
setCounts(c => ({ ...c, [cardPrintingId]: prevCount }));
```

---

### WR-04: `manage/page.tsx` — optimistic `updateWantQuantity` adds a new want row without fetching `subtitle` or `variantType` from owned printings of other definition IDs

**File:** `src/app/binder/manage/page.tsx:225-244`

**Issue:** When `updateWantQuantity` is called for a `cardPrintingId` that does not yet exist in `manualWants`, it attempts to find card info from `ownedCards` (line 226-229). However, wants can also be added via `ManualWantsAddFlow` for cards the user does NOT own (the flow shows all printings for owned definitions but could display non-owned variant chips). More importantly, after `ManualWantsAddFlow` calls `onWantAdded()`, `refreshTradeData()` re-fetches `/api/binder` and resets `tradeData` — so the want added by the flow is never put through the optimistic path. The optimistic path in `updateWantQuantity` is only triggered from `ManageWantsList`'s increment/decrement buttons, which do exist for already-present wants. This is internally consistent, but the code comment at line 225 (`// Find card info from ownedCards`) will silently return `prev` (no update) for any `cardPrintingId` not linked to an `ownedCards` entry, providing no user feedback that the update was dropped.

**Fix:** When the card/printing lookup fails (lines 230-231), return an error indicator or at minimum log the miss:
```typescript
if (!card || !printing) {
  console.error('updateWantQuantity: cardPrintingId not found in ownedCards', cardPrintingId);
  return prev; // silent drop — add a toast in production
}
```

---

### WR-05: `getPublicBinderData` in `binder.ts` — auto-want de-duplication not enforced; cards in both `manualWantRows` and `autoWantEntries` produce duplicate tiles

**File:** `src/db/queries/binder.ts:214-217`

**Issue:** `lookingFor` is assembled by concatenating `manualWantRows` and `autoWantEntries` without any de-duplication check. If a user has manually added a want for a card's Normal printing AND that card also appears in an auto-want shortfall (same `cardDefinitionId`), both entries will appear in `lookingFor`. On the public binder page this produces two tiles for the same card (one manual, one auto). The private binder API (`trade.ts:getUserTradeData`) returns `manualWants` and `autoWants` as separate arrays so the UI can render them in separate sections, but the public binder merges them into one array.

**Fix:** Filter `autoWantEntries` to exclude cards whose `cardDefinitionId` already appears in `manualWantRows`:
```typescript
const manualDefIds = new Set(manualWantRows.map(r => r.id));
const dedupedAutoWants = autoWantEntries.filter(e => !manualDefIds.has(e.id));
const lookingFor = [...manualWantRows, ...dedupedAutoWants];
```

---

### WR-06: `manage/page.tsx` — HTTP errors from `/api/binder` and `/api/collection/owned-cards` are silently swallowed

**File:** `src/app/binder/manage/page.tsx:95-109`

**Issue:** The `fetchData` function calls `binderRes.json()` and `ownedRes.json()` without checking `binderRes.ok` or `ownedRes.ok`. If either endpoint returns 4xx or 5xx (e.g., session expired between render and fetch, or DB timeout), `res.json()` may throw (malformed body) or return an error-shape object that silently replaces the state with garbage data. The `catch` at line 105 only catches thrown exceptions; a 500 with a JSON error body would pass through, set `tradeData` to `{ error: "..." }`, and cause downstream type errors when the UI tries to access `.offerings`.

**Fix:**
```typescript
if (!binderRes.ok || !ownedRes.ok) {
  console.error('Failed to load binder data', binderRes.status, ownedRes.status);
  setIsLoading(false);
  return;
}
```

---

## Info

### IN-01: `drizzle/0005_binder_variant_completeness.sql` — `DELETE` before `NOT NULL` constraint risks silent data loss on partial migration

**File:** `drizzle/0005_binder_variant_completeness.sql:9`

**Issue:** The migration deletes all rows in `trade_manual_wants` where `card_printing_id IS NULL` — i.e., rows where the UPDATE (lines 3-7) failed to find a matching Normal printing. This is intentional (the comment in the migration implies it), but it is irreversible. If a card definition lacks a Normal printing in `card_printings` (e.g., data ingest missed a variant), those wants are silently deleted without any pre-flight count logged. A production database could lose user data with no error or warning emitted.

**Fix:** Consider logging a count before delete, or add a pre-migration check:
```sql
-- Pre-flight: count rows that will be deleted
SELECT COUNT(*) FROM "trade_manual_wants" WHERE "card_printing_id" IS NULL;
-- Abort migration if count is unexpectedly high
```
At minimum, document the data loss risk in the migration header comment.

---

### IN-02: `src/app/api/cards/all/route.ts` — route passes errors from `getAllCards` to the client unhandled

**File:** `src/app/api/cards/all/route.ts:6-18`

**Issue:** The `GET` handler calls `getAllCards()` with no `try/catch`. Any DB error (connection failure, query timeout) will propagate as an unhandled rejection, which Next.js will convert to a 500 with a default error page. This is not a security issue but means the client receives no structured error JSON and the error is not logged at the route boundary.

**Fix:**
```typescript
export async function GET() {
  try {
    const cards = await getAllCards();
    const plainCards = cards.map(c => ({ ... }));
    return NextResponse.json(plainCards);
  } catch (err) {
    console.error('Failed to fetch all cards:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

---

### IN-03: `tests/binder-flow.test.ts` — mock chain does not account for `getPublicBinderData`'s multiple chained joins; test assertion on `binderData.offerings` is vacuously correct

**File:** `tests/binder-flow.test.ts:66-88`

**Issue:** The mock of `db.select` (line 68-78) returns a chain with `innerJoin: vi.fn().mockReturnThis()`. Since `getPublicBinderData` chains multiple `innerJoin` calls (offerings query: two inner joins + one where), `mockReturnThis()` returns the same mock object for all `.innerJoin(...)` calls. When `.where(...)` is finally called it calls `mockResults` which returns the first mocked value (`[mockOffering]`). This means the mock returns the expected value not because the query was correct, but because the test is not discriminating between which `select().from()...where()` call is being intercepted. The assertion `expect(binderData.offerings).toHaveLength(1)` passes trivially regardless of whether the real query logic is correct.

This is a test quality issue, not a production bug, but means the test provides zero coverage of the actual query logic.

**Fix:** Consider integration tests against a real (or seeded) Neon branch for query correctness, or verify individual query modules with more targeted unit tests that assert on the Drizzle builder call arguments rather than mocked return values.

---

_Reviewed: 2026-05-26T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
