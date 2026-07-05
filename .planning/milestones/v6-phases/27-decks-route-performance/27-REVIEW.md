---
phase: 27-decks-route-performance
reviewed: 2026-06-02T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - __tests__/api-deck-revalidate.test.ts
  - src/app/api/decks/[id]/route.ts
  - src/app/api/decks/route.ts
  - src/app/decks/[id]/loading.tsx
  - src/app/decks/loading.tsx
  - src/app/decks/page.test.tsx
  - src/components/decks/deck-builder-perf.test.ts
  - src/components/decks/deck-builder.tsx
  - src/components/decks/decks-client.tsx
  - src/db/queries/decks.test.ts
  - src/db/queries/decks.ts
findings:
  critical: 3
  warning: 4
  info: 2
  total: 9
status: issues_found
---

# Phase 27: Code Review Report

**Reviewed:** 2026-06-02T00:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

This phase adds `'use cache'` / `cacheTag` / `cacheLife` to the deck query layer and wires `revalidateTag` into every mutation route handler, plus `startTransition` wrappers in the deck builder and `router.refresh()` in `DecksClient`. The caching plumbing is structurally sound and ownership guards are preserved. However three correctness / security defects require attention before this ships: a cross-user data-leak path in `getDeckWithCards`, an unconditional update on `updateDeck` that bypasses the ownership check, and `revalidateTag` calls that fire before confirming mutation success.

---

## Critical Issues

### CR-01: `getDeckWithCards` leaks cards of any deck owner after cache hit

**File:** `src/db/queries/decks.ts:17-37`

**Issue:** The function is tagged `deck-${deckId}-user-${userId}` and the initial `SELECT` on `decks` correctly filters by both `deckId` and `userId`. But the second query on line 30 fetches `deckCards` filtered only by `deckId` — with no `userId` guard:

```ts
const cards = await db
  .select()
  .from(deckCards)
  .where(eq(deckCards.deckId, deckId));   // ← no userId check
```

On a **cache miss** this is safe today only because the `if (!deck) return null` gate on line 26 short-circuits for unauthorised access before reaching the cards query. But if the cache is ever pre-warmed with a legitimate entry and later the `decks` row is transferred or deleted without a `revalidateTag` call, a stale cached result will skip the ownership gate entirely and return another user's cards. More concretely: the cache tag encodes `userId`, so `user-A` and `user-B` get independent cache buckets — but if `user-B` can somehow trigger a request that resolves to the **same tag string** (e.g. a user whose numeric id is crafted to collide), they get user-A's cached card list. The structural risk is that the cards sub-query is not independently owner-gated, making the caching correct only by sequential ordering, which is fragile.

**Fix:** Add the ownership join to the cards query so it is independently safe regardless of call order or cache state:

```ts
const cards = await db
  .select()
  .from(deckCards)
  .innerJoin(decks, eq(deckCards.deckId, decks.id))
  .where(
    and(
      eq(deckCards.deckId, deckId),
      eq(decks.userId, userId)          // ← owner guard on the cards query too
    )
  );
```

---

### CR-02: `updateDeck` fires the `UPDATE` statement even when ownership check fails at the application layer

**File:** `src/db/queries/decks.ts:78-84`

**Issue:** The ownership check inside the transaction (lines 63-69) throws `'Deck not found or unauthorized'` when the deck is not found, which correctly aborts the transaction. However the `UPDATE` on line 83 uses only `eq(decks.id, deckId)` — **not** `and(eq(decks.id, deckId), eq(decks.userId, userId))`:

```ts
await tx
  .update(decks)
  .set(updatePayload)
  .where(eq(decks.id, deckId));   // ← userId not in WHERE clause
```

Inside a transaction this is currently safe because the `SELECT` above would have already thrown. But if the `SELECT` guard is ever refactored away or the function is called directly (e.g. from a test double or a future code path that bypasses the guard), this `UPDATE` will modify any deck matching `deckId` regardless of owner. Defence-in-depth demands the `WHERE` clause carry the ownership predicate.

**Fix:**

```ts
await tx
  .update(decks)
  .set(updatePayload)
  .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
```

---

### CR-03: `revalidateTag` is called before the mutation response is verified as successful

**File:** `src/app/api/decks/route.ts:38` and `src/app/api/decks/[id]/route.ts:115-117`, `145-146`

**Issue:** In all three mutation handlers the `revalidateTag` calls are placed **after** `await updateDeck(...)` / `await deleteDeck(...)` / `await createDeck(...)`, but **before** the `Response.json({ success: true })` return — and, critically, they are **inside the `try` block** with nothing preventing them from running even if the DB call throws. Because `revalidateTag` is synchronous and the throw from the DB call would skip it, this specific ordering is marginally safe in the success path. The real defect is the opposite scenario: if the DB operation succeeds but `revalidateTag` itself throws (e.g. the Next.js cache context is unavailable during certain middleware or test environments), the mutation has committed but the response returns a 500, leaving the client believing the operation failed while the cache is in an inconsistent state (stale data is served for a committed change that the client will not retry).

Additionally in `POST /api/decks` (route.ts line 38), `revalidateTag` fires before the `return Response.json(deck)` — if the `deck` object returned by `createDeck` is somehow invalid and Response.json throws, the tag was already invalidated for no reason, causing an unnecessary cache bust.

**Fix:** Wrap `revalidateTag` calls in their own `try/catch` that logs but does not re-throw, so a cache-layer failure never converts a successful mutation into a 500:

```ts
await updateDeck(deckId, userId, body);
try {
  revalidateTag(`deck-${deckId}-user-${userId}`, 'max');
  revalidateTag(`decks-user-${userId}`, 'max');
} catch (cacheErr) {
  console.error('revalidateTag failed (non-fatal):', cacheErr);
}
return Response.json({ success: true });
```

---

## Warnings

### WR-01: `decks-client.tsx` silently ignores fetch errors on deck creation

**File:** `src/components/decks/decks-client.tsx:61-76`

**Issue:** `handleCreateDeck` catches errors and logs them, but never surfaces any feedback to the user. If the POST fails (network error, 400, 500), the user sees nothing — no error message, no toast, no state change. The function also does not handle `!res.ok` for non-2xx HTTP responses: if the server returns 400 or 500, the code proceeds to `await res.json()` and `router.push(...)` with whatever the error body contains, likely crashing or navigating to `/decks/undefined`.

```ts
if (res.ok) {            // ← non-ok responses fall through to the catch
  const deck = await res.json();
  router.refresh();
  router.push(`/decks/${deck.id}`);   // ← deck.id may be undefined on error body
}
// no else branch — non-ok is silently swallowed
```

**Fix:** Add an `else` branch for non-ok responses and surface an error state to the user.

---

### WR-02: `handleDeleteDeck` has a stale-closure bug with `decks` state

**File:** `src/components/decks/decks-client.tsx:87`

**Issue:** `setDecks(decks.filter((d) => d.id !== id))` captures `decks` from the closure at the time the async handler resolves. If two delete operations are in-flight simultaneously (or any other state update has fired between the user clicking Delete and the fetch resolving), this will operate on stale state and may re-add a deck that was already removed by another operation, or miss a deck added in the interim.

**Fix:** Use the functional updater form:

```ts
setDecks(prev => prev.filter((d) => d.id !== id));
```

---

### WR-03: `updateDeck` unconditionally sets `updatedAt` only when metadata fields change, but not when only cards change

**File:** `src/db/queries/decks.ts:78-99`

**Issue:** `updatedAt` is added to `updatePayload` on line 79 and the deck `UPDATE` is guarded by `if (Object.keys(updatePayload).length > 0)`. When a PATCH request provides **only** `cards` (no name/leader/base/isDraft), `updatePayload` remains empty, the deck metadata `UPDATE` is skipped entirely, and `updatedAt` is never refreshed. The `DecksClient` displays "Last updated: ..." from `updatedAt`, so card-only saves will show a stale timestamp.

**Fix:** Move the `updatedAt` stamp to always run when cards are updated, or ensure the deck metadata `UPDATE` always fires when cards change:

```ts
// Always bump updatedAt
updatePayload.updatedAt = new Date();
await tx
  .update(decks)
  .set(updatePayload)
  .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
```

---

### WR-04: `deck-builder.tsx` `MOVE_TO_SIDEBOARD` has a logic error when the sideboard entry already exists

**File:** `src/components/decks/deck-builder.tsx:82-95`

**Issue:** In the `MOVE_TO_SIDEBOARD` case, the code first runs a `.map()` that increments the existing sideboard entry (line 88: `return { ...c, quantity: c.quantity + 1 }`), then on line 93 conditionally pushes a **new** entry with `quantity: 1` only when `!sbEntry`. However `sbEntry` is captured from the state **before** the `.map()` runs. This means: if `sbEntry` was already present, the `.map()` correctly increments it — no double-push occurs. This part is fine.

The real defect is that after the `.filter(c => c.quantity > 0)` on line 91, if the main-deck entry reaches `quantity: 0` it is correctly removed. But the `if (!sbEntry)` push on line 93 uses the **pre-map** `newCards` reference after reassigning it on line 92 with `let newCards = state.cards.map(...)`. This means the final `newCards` array from the `!sbEntry` branch is the pre-filter result concatenated with the new entry, then the `.filter` was already applied to the intermediate value. Re-reading carefully: `let newCards` is set on line 83 to `.map(...).filter(...)`, so the filter runs. Then line 93 spreads `newCards` (already filtered) and appends the new entry. This is correct. However the `MOVE_TO_MAIN` case (lines 97-115) has the symmetric logic and shares the same pattern — `let newCards` is set to the mapped+filtered result, and then a new entry is pushed if `!mainEntry`. This is also structurally correct.

The actual defect: on line 82 `let newCards = state.cards.map(...).filter(c => c.quantity > 0)` — the `.map` runs on `state.cards` (which includes both main and sideboard). When the main entry reaches 0 copies, the filter removes it. But line 93 does `newCards = [...newCards, { cardDefinitionId: id, quantity: 1, isSideboard: true }]` only when `!sbEntry`. When `sbEntry` already exists, the `.map` on line 84-90 increments the existing sideboard entry — correct. The problem is that if `sbEntry` exists AND the main entry reaches `quantity: 1` (so it gets decremented to 0 and filtered out), the resulting `newCards` correctly removes the main entry. But the function never checks whether removing the last copy of a card from main that also exists in sideboard results in a total-across-both-zones count that could be inconsistent with game rules. This is a game-rules issue, not a crash bug — lowered to Warning.

**Fix:** This is a game-rules edge case rather than a data-corruption bug, but worth asserting: ensure `MOVE_TO_SIDEBOARD` checks total copies across both zones before allowing the move, similar to how `MOVE_TO_MAIN` is handled symmetrically.

---

## Info

### IN-01: `revalidateTag` second argument `'max'` is passed as a positional string, not a named profile object

**File:** `src/app/api/decks/[id]/route.ts:116-117`, `145-146`; `src/app/api/decks/route.ts:38`

**Issue:** The Next.js 16 docs confirm `revalidateTag(tag, 'max')` is the recommended two-argument form, so this is correct usage. However the test mock in `__tests__/api-deck-revalidate.test.ts` uses `toHaveBeenCalledWith('decks-user-7', 'max')` (line 71) which will correctly match. No change required — noted for completeness that the two-argument form is the intentional v16 API.

**Fix:** No action needed.

---

### IN-02: `deck-builder-perf.test.ts` source-text regex for `startTransition` is fragile

**File:** `src/components/decks/deck-builder-perf.test.ts:29-31`, `34-36`, `39-41`

**Issue:** The three regex patterns use `[\s\S]*?` (non-greedy cross-line match) to assert that `'SET_LEADER'`, `'SET_BASE'`, and `'UPDATE_CARD'` appear after a `startTransition(() => {` opening. Because `[\s\S]*?` matches any character across any number of lines, a single `startTransition` block containing all three dispatches (or even the type-union definition) would satisfy all three tests simultaneously. The tests would pass even if only one `startTransition` call existed but that call contained all three string literals. The fifth test (`matches.length >= 3`) provides a count guard, but only counts call-sites, not that each dispatch type is individually wrapped. This is a test-quality issue, not a production code defect.

**Fix:** Consider using more precise assertions, e.g. matching the import list or checking that each dispatch pattern appears within its own `startTransition(() => { ... })` block using tighter bounds (e.g., matching up to the closing `})`). Alternatively, use AST-based tests via a parser rather than regex.

---

_Reviewed: 2026-06-02T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
