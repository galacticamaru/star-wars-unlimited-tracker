---
phase: 09-Sideboard
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/lib/deck-validation.ts
  - src/lib/deck-validation.test.ts
  - src/components/decks/deck-builder.tsx
  - src/components/decks/deck-sidebar.tsx
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 09: Code Review Report

**Reviewed:** 2026-05-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

This phase adds sideboard support to the deck builder. The core validation logic in `deck-validation.ts` is clean and well-structured. The test suite is thorough and covers the new sideboard rules well. However, the UI layer in `deck-builder.tsx` contains two correctness bugs that will cause real user-facing misbehaviour: stale state reads in the move handlers allow the sideboard to silently overflow past 10 cards, and the `+` button on sideboard cards is completely unconstrained. A non-400 save failure is also swallowed without surfacing to the user.

---

## Critical Issues

### CR-01: Stale state read in `handleMoveToSideboard` allows sideboard to exceed 10 cards

**File:** `src/components/decks/deck-builder.tsx:176`

**Issue:** `handleMoveToSideboard` reads `state.cards` to compute the current sideboard entry's quantity on line 176, then dispatches two separate actions. Because React batches dispatches inside the same event handler, `state.cards` is still the pre-dispatch snapshot when line 176 executes — the reducer from the first `dispatch` has not yet been applied. This means `sbEntry?.quantity` reflects the old state. While this particular race does not cause data loss in most cases (both quantities are read from the same snapshot), the real correctness issue is that the UI guard on "Move to SB" (`disabled={sideboardTotal >= 10}`) is the **only** enforcement of the 10-card limit for this path. A user who fires the action before the guard re-renders (e.g. rapid clicks before React re-renders) can bypass it, pushing the sideboard past 10 cards. The stale-read pattern also makes `handleMoveToMain` (line 184) symmetric, creating the same fragility for the reverse direction.

**Fix:** Combine the two `dispatch` calls into a single custom action type so the reducer handles the atomic move in one step. This eliminates the race and makes the reducer the single place that enforces the invariant.

```typescript
// In DeckAction union:
| { type: 'MOVE_TO_SIDEBOARD'; payload: { cardDefinitionId: number } }
| { type: 'MOVE_TO_MAIN';      payload: { cardDefinitionId: number } }

// In deckReducer:
case 'MOVE_TO_SIDEBOARD': {
  const id = action.payload.cardDefinitionId;
  const mainEntry = state.cards.find(c => c.cardDefinitionId === id && !c.isSideboard);
  if (!mainEntry) return state;
  const sbEntry = state.cards.find(c => c.cardDefinitionId === id && c.isSideboard);
  const currentSideboardTotal = state.cards
    .filter(c => c.isSideboard)
    .reduce((sum, c) => sum + c.quantity, 0);
  if (currentSideboardTotal >= 10) return state; // hard limit enforced in reducer
  let newCards = state.cards.map(c => {
    if (c.cardDefinitionId === id && !c.isSideboard) {
      return { ...c, quantity: c.quantity - 1 };
    }
    if (c.cardDefinitionId === id && c.isSideboard) {
      return { ...c, quantity: c.quantity + 1 };
    }
    return c;
  }).filter(c => c.quantity > 0);
  if (!sbEntry) {
    newCards = [...newCards, { cardDefinitionId: id, quantity: 1, isSideboard: true }];
  }
  return { ...state, cards: newCards };
}
// Mirror pattern for MOVE_TO_MAIN.
```

---

### CR-02: Sideboard `+` button has no cap — user can add unlimited sideboard cards via direct increment

**File:** `src/components/decks/deck-builder.tsx:398`

**Issue:** The `+` button for sideboard cards in the editor view dispatches `UPDATE_CARD` with `quantity: item.quantity + 1` and `isSideboard: true` without any guard. This lets a user increment a sideboard card's quantity indefinitely, blowing past the 10-card rule. The validation result will show the error in the sidebar, but the state is corrupt and can be saved as a draft and later published if the user removes the error through another path. Unlike the "Move to SB" button (which has `disabled={sideboardTotal >= 10}`), no such guard is applied here.

**Fix:** Either add `disabled={sideboardTotal >= 10}` to the sideboard `+` button, or (preferably) enforce the cap in the reducer so no dispatch path can violate it.

```tsx
// Minimal fix — guard on the + button:
<Button
  variant="outline"
  size="icon"
  className="h-8 w-8"
  disabled={sideboardTotal >= 10}
  onClick={() => dispatch({
    type: 'UPDATE_CARD',
    payload: { cardDefinitionId: item.card.id, quantity: item.quantity + 1, isSideboard: true }
  })}
>+</Button>
```

---

## Warnings

### WR-01: Non-400 API errors are not surfaced to the user

**File:** `src/components/decks/deck-builder.tsx:209-217`

**Issue:** The `handleSave` function handles `res.status === 400` explicitly and also catches network errors. However, any other HTTP error status (401, 403, 404, 409, 500, etc.) falls through the `if (res.ok) / else if (res.status === 400)` chain silently — the function returns without setting `apiErrors` and without re-throwing. The user sees nothing: saving appears to succeed from a spinner perspective (the `finally` block clears `isSaving`), but `cleanStateRef` is not updated and no error is shown.

```typescript
// Current code — 5xx and other client errors fall through silently:
if (res.ok) {
  cleanStateRef.current = { ...state, isDraft };
  if (!isDraft) router.push('/decks');
} else if (res.status === 400) {
  const data = await res.json();
  setApiErrors(data.errors || ['Failed to save deck']);
}
// else: nothing happens

// Fix — add an else branch:
} else {
  setApiErrors([`Unexpected error (${res.status}). Please try again.`]);
}
```

---

### WR-02: Copy-limit check conflates main-deck and sideboard counts, but only warns on off-aspect for main-deck cards — sideboard off-aspect cards are silently ignored

**File:** `src/lib/deck-validation.ts:118-124`

**Issue:** `processCard` applies the off-aspect warning only when `isMain === true` (line 102 branch). Sideboard cards are processed in the `else` branch where only `sideboardCostCurve` is updated. This means a sideboard card that requires an aspect not covered by the leader or base will never generate a warning. Whether this matches the intended game rules should be verified — if sideboard cards can introduce aspect penalties, the check needs to run for both branches. If sideboard cards are intentionally exempt, this should be documented with a comment.

**Fix:** If sideboard cards should also trigger aspect warnings, move the off-aspect check outside the `if (isMain)` branch:

```typescript
// Move aspect warning outside the isMain guard:
card.aspects.forEach((aspect) => {
  if (isMain) {
    stats.aspectCounts[aspect] = (stats.aspectCounts[aspect] || 0) + quantity;
  }
  if (aspect !== 'Basic' && !combinedAspects.has(aspect)) {
    const warning = `${card.name} is off-aspect (requires ${aspect})`;
    if (!warnings.includes(warning)) {
      warnings.push(warning);
    }
  }
});
```

If this is intentional (sideboard is exempt), add a comment to `processCard` so future maintainers understand the decision.

---

### WR-03: `handleMoveToSideboard` does not check that the main-deck quantity is > 0 before moving

**File:** `src/components/decks/deck-builder.tsx:172-178`

**Issue:** `handleMoveToSideboard` checks that `mainEntry` exists (i.e. a record for this card exists in `state.cards`), but does not check that `mainEntry.quantity > 0`. If a card somehow reaches a state where it has `quantity: 0` in the main deck (which the reducer normally prevents via `splice`, but could occur through direct state hydration or a bug), the function will dispatch `quantity: -1` for the main entry. The reducer's `quantity <= 0` path would then delete it — so the end result is probably safe, but the dispatch of a negative quantity is semantically wrong and could mask deeper state corruption.

**Fix:** Add an explicit quantity check:

```typescript
const handleMoveToSideboard = (cardDefinitionId: number) => {
  const mainEntry = state.cards.find(c => c.cardDefinitionId === cardDefinitionId && !c.isSideboard);
  if (!mainEntry || mainEntry.quantity <= 0) return;
  // ...
};
```

---

### WR-04: `isDirty` comparison uses `JSON.stringify` with insertion-order-dependent object serialisation

**File:** `src/components/decks/deck-builder.tsx:86-89`

**Issue:** `isDirty` is computed by `JSON.stringify(state) !== JSON.stringify(cleanStateRef.current)`. The `cards` array within the state is order-sensitive, so if two states have the same cards in a different order (e.g. after a `REMOVE_CARD` + re-add via a different code path), `isDirty` will be `true` even though the deck contents are functionally identical, and the user will receive an unsaved-changes prompt when leaving a page they haven't actually changed. This is a false-positive dirtiness bug. More critically, if the save response causes a re-render that reorders the cards array, `cleanStateRef.current` and the next `state` will stringify differently, causing the guard to remain dirty after a successful save.

**Fix:** Normalise before comparing (e.g. sort `cards` by `cardDefinitionId` + `isSideboard`), or compare the cards as a `Set`-like structure, or use a dedicated `equals` function that is order-insensitive.

---

## Info

### IN-01: Test helper `createCard` uses `Math.random()` for `id` — non-deterministic test data

**File:** `src/lib/deck-validation.test.ts:6`

**Issue:** `id: Math.floor(Math.random() * 1000)` generates a different `id` on every test run. If two cards in a single test happen to get the same `id`, behaviour may be unexpected (though the validation logic uses `swudbId` not `id` for tracking, so the practical blast radius is low). The pattern is still an anti-pattern for deterministic tests.

**Fix:** Use a counter or fixed IDs per test:

```typescript
let idCounter = 1;
const createCard = (overrides: Partial<Card>): Card => ({
  id: idCounter++,
  // ...
  ...overrides,
});
```

Or reset the counter inside `beforeEach`.

---

### IN-02: Magic number `12` in cost-curve bar height calculation is unexplained

**File:** `src/components/decks/deck-sidebar.tsx:127`

**Issue:** `const mainHeight = Math.min((count / 12) * 100, 100)` — the divisor `12` is a magic number with no comment explaining its intent (maximum expected cards at a given cost point for a 50-card deck). If the maximum deck size or cost distribution expectation changes, this constant will be silently wrong.

**Fix:** Extract to a named constant:

```typescript
const COST_CURVE_SCALE_MAX = 12; // bars reach 100% height at this many cards per cost slot
const mainHeight = Math.min((count / COST_CURVE_SCALE_MAX) * 100, 100);
```

---

_Reviewed: 2026-05-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
