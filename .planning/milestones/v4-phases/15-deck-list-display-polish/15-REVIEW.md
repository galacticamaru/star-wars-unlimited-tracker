---
phase: 15-deck-list-display-polish
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/lib/deck-grouping.ts
  - src/lib/aspect-panel.ts
  - src/components/decks/deck-builder.tsx
  - src/components/decks/deck-sidebar.tsx
  - __tests__/deck-grouping.test.ts
  - __tests__/aspect-panel.test.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-05-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Six files reviewed covering the deck-list display polish for phase 15. The two pure library modules (`deck-grouping.ts`, `aspect-panel.ts`) are clean and correct. The test suites cover the happy paths and a reasonable set of edge cases. Issues are concentrated in `deck-builder.tsx` and `deck-sidebar.tsx`.

No security vulnerabilities or data-loss bugs were found. Three warnings require attention before shipping: a `null` cost rendered literally as the string "null" in the UI, a mobile touch preview that has no dismiss path, and a Unit card that carries both arenas being silently dropped from `spaceUnits`. Three info-level items round out the findings.

---

## Warnings

### WR-01: `card.cost` null renders as literal "null" string in both main-deck and sideboard rows

**File:** `src/components/decks/deck-builder.tsx:492` (and `:538`)
**Issue:** `Card.cost` is typed `number | null` in `deck-validation.ts`. Both the main-deck section (line 492) and the sideboard section (line 538) render `{item.card.cost} Cost` directly. When `cost` is `null`, React renders the string `"null Cost"` — visible to the user for any card without a cost value (e.g., bases, tokens, or cards not yet priced in the data).
**Fix:**
```tsx
<p className="text-xs text-slate-500">
  {item.card.type}
  {item.card.cost !== null ? ` • ${item.card.cost} Cost` : ''}
</p>
```
Apply the same guard at both line 492 and line 538.

---

### WR-02: `onTouchStart` sets hover preview but nothing clears it on mobile

**File:** `src/components/decks/deck-builder.tsx:484`
**Issue:** Each deck-row `div` sets `hoveredCard` on `onTouchStart` but has no `onTouchEnd` handler. On touch devices, once a row is tapped the mobile bottom-bar preview (line 563) appears and persists indefinitely — there is no tap-outside-to-dismiss, no `onTouchEnd`, and no `onTouchCancel`. The bar covers ~96px of bottom content and cannot be cleared without tapping a different row or scrolling away (which does not clear it either).
**Fix:** Add an `onTouchEnd` handler (or a document-level touch listener) to clear the hovered card:
```tsx
onTouchEnd={() => setHoveredCard(null)}
```
Add the same handler to `onTouchCancel`.

---

### WR-03: Unit with both `Ground` and `Space` arenas is silently excluded from `spaceUnits`

**File:** `src/lib/deck-grouping.ts:27-29`
**Issue:** The classifier uses `if ... else if`, so a Unit card with `arenas: ['Ground', 'Space']` matches the first branch (`groundUnits`) and is never placed in `spaceUnits`. If such a card exists in game data, the Space Units section count will be understated. The current test suite does not cover this case. If the game guarantees mutual exclusivity of arenas for Units this is fine, but that invariant is neither enforced nor documented in the code.
**Fix:** If mutual exclusivity is guaranteed, add a comment and a test:
```ts
// Invariant: a Unit card has exactly one arena. If SWU ever introduces
// dual-arena units, this if/else chain must be replaced with additive logic.
```
Or, if dual-arena units are possible, push the item into all matching groups rather than stopping at the first match.

---

## Info

### IN-01: `console.error` left in production client component

**File:** `src/components/decks/deck-builder.tsx:269`
**Issue:** `console.error('Failed to save deck', err)` logs to the browser console in production. The error is already surfaced to the user via `setApiErrors`. Server-side logging would be a better place for this signal; in the client it leaks stack traces to the browser console.
**Fix:** Remove the `console.error` call; the `setApiErrors` path already provides user feedback.

---

### IN-02: Array index used as React `key` for API error list

**File:** `src/components/decks/deck-sidebar.tsx:93`
**Issue:** `key={i}` uses the array index as the React reconciliation key for the error messages list. If the error list changes length between renders, React may not correctly remount error items and any enter/exit transitions (if added later) would be wrong.
**Fix:** Use the error string itself as the key (error strings are short, descriptive, and effectively unique within a single save attempt):
```tsx
{apiErrors.map((error) => (
  <div key={error} className="...">
```

---

### IN-03: Test suite does not cover Unit with both arenas (mirrors WR-03)

**File:** `__tests__/deck-grouping.test.ts`
**Issue:** No test exercises a `Unit` card with `arenas: ['Ground', 'Space']`. The behaviour (ground wins) is an undocumented side-effect of the `if/else if` chain. Adding a test, even if just to document the current behaviour, would make future changes safer.
**Fix:** Add a test case:
```ts
it('classifies a dual-arena unit into groundUnits (first-match rule)', () => {
  const items: DeckCard[] = [
    { card: makeCard({ type: 'Unit', arenas: ['Ground', 'Space'] }), quantity: 1 },
  ];
  const groups = groupDeckCards(items);
  expect(groups.groundUnits).toHaveLength(1);
  expect(groups.spaceUnits).toHaveLength(0);
});
```

---

_Reviewed: 2026-05-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
