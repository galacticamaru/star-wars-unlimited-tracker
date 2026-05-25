---
phase: 16-empty-deck-guided-onboarding
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/lib/auto-filter.ts
  - src/lib/auto-filter.test.ts
  - src/components/catalog/sidebar-filters.tsx
  - src/components/catalog/catalog-client.tsx
  - src/components/decks/deck-builder.tsx
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-05-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This phase introduces the auto-filter system for the deck builder: when a user has not yet chosen a leader and/or base, the card browser auto-filters to show only Leader/Base cards; once both are selected it filters by their combined aspects. The implementation is split cleanly across a pure utility (`auto-filter.ts`), a React context consumer (`catalog-client.tsx`), and the orchestrating parent (`deck-builder.tsx`).

The core logic in `auto-filter.ts` is correct and well-tested. The main risks are in the React layer: a spurious eslint-disable comment that misidentifies a plain function call as a hook, a silent optimistic-update rollback failure when the API errors, an auto-filter effect that writes to `selectedAspects` even when only types changed (and vice versa), and the `topOffset` prop that is accepted but never consumed. Several smaller quality issues are also present.

## Warnings

### WR-01: `eslint-disable react/rules-of-hooks` suppresses a legitimate ESLint warning about a non-hook `setTimeout` call

**File:** `src/components/catalog/catalog-client.tsx:77-78`

**Issue:** The comment `// eslint-disable-next-line react-hooks/rules-of-hooks` appears above `setTimeout(() => setCollection({}), 0)`. `setTimeout` is not a React hook — the ESLint rule `react-hooks/rules-of-hooks` would never fire on it. The disable comment is therefore suppressing nothing real, and its presence signals that the author believed the `else` branch inside `useEffect` was somehow violating hook rules. In fact the underlying concern is correct: calling `setCollection` directly inside the `else` branch (without `setTimeout`) is fine, and the `setTimeout` wrapper itself is unnecessary and introduces a subtle ordering issue where collection gets cleared one tick after the session is detected as logged-out, potentially allowing a brief flash of stale collection data. The eslint-disable masks this confusion rather than fixing it.

**Fix:** Remove the `setTimeout` wrapper and the eslint-disable comment. Set state directly:
```typescript
useEffect(() => {
  if (isAuthenticated) {
    fetch('/api/collection')
      .then(res => res.json())
      .then(data => setCollection(data))
      .catch(err => console.error('Failed to load collection:', err));
  } else {
    setCollection({});
  }
}, [isAuthenticated]);
```

---

### WR-02: Auto-filter effect unconditionally writes both `selectedTypes` and `selectedAspects`, overwriting the filter the auto-filter is NOT controlling

**File:** `src/components/catalog/catalog-client.tsx:86-95`

**Issue:** The `useEffect` that applies the auto-filter fires when `autoFilter` changes. It writes `selectedTypes` when `autoFilter.types !== undefined` AND `selectedAspects` when `autoFilter.aspects !== undefined`. However these two fields are mutually exclusive in `computeAutoFilter`: when `types` is set, `aspects` is `undefined`, and vice versa. This means the effect only writes one field per run, which appears correct.

But there is a subtler problem: when the auto-filter transitions from the "types" phase (no leader/base) to the "aspects" phase (both selected), the effect writes `selectedAspects` but does NOT clear `selectedTypes`. The previous auto-filter had set `selectedTypes = ['Leader', 'Base']`, and those values persist in nuqs URL state after the transition. As a result, after a user picks both leader and base, the catalog is filtered by aspects AND still has `types=['Leader','Base']` in the URL, showing zero results.

**Fix:** Clear the complementary field when writing the other:
```typescript
useEffect(() => {
  if (isAutoFilterOverridden || !autoFilter) return;
  if (autoFilter.types !== undefined) {
    setSelectedTypes(autoFilter.types);
    setSelectedAspects([]); // clear the other axis
  } else if (autoFilter.aspects !== undefined) {
    setSelectedAspects(autoFilter.aspects);
    setSelectedTypes([]); // clear the other axis
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [autoFilter, isAutoFilterOverridden]);
```

---

### WR-03: Optimistic collection update is never rolled back on API failure

**File:** `src/components/catalog/catalog-client.tsx:103-115`

**Issue:** `handleUpdateCount` applies an optimistic update to `collection` before the API call, but the `catch` block only logs the error. If the PATCH fails, the UI permanently shows the wrong count until a page refresh. This is not related to phase 16 but is present in the reviewed file.

**Fix:** Capture the previous value and restore it on failure:
```typescript
const handleUpdateCount = async (cardDefinitionId: number, newCount: number) => {
  if (!isAuthenticated) { router.push('/login'); return; }
  const previous = collection[cardDefinitionId];
  setCollection(prev => ({ ...prev, [cardDefinitionId]: newCount }));
  try {
    const res = await fetch('/api/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardDefinitionId, count: newCount }),
    });
    if (!res.ok) throw new Error('Failed to update');
  } catch (err) {
    console.error(err);
    // Rollback
    setCollection(prev => ({ ...prev, [cardDefinitionId]: previous ?? 0 }));
  }
};
```

---

### WR-04: `computeAutoFilter` returns `{ aspects: [] }` when both leader and base have only the 'Basic' aspect — this causes the aspect auto-filter to show zero cards

**File:** `src/lib/auto-filter.ts:24-31`

**Issue:** When both leader and base carry only the `'Basic'` aspect (e.g. the Jawa leader + a colourless base), `computeAutoFilter` returns `{ aspects: [] }`. This is tested and documented as intentional (`auto-filter.test.ts:74-79`). However in `filter-cards.ts` line 81-82, an empty `selectedAspects` array means "no filter" (pass-through), so the empty-aspects result actually disables aspect filtering rather than showing zero cards. This is the correct user-visible behaviour (all non-Basic cards are playable with a Basic-only identity), but it also means the auto-filter label "Auto: Aspect filter" will appear in the chip (because `autoFilter.aspects` is defined) while no filtering is actually applied — misleading UX.

The test at line 102-105 in the test file asserts `computeAutoFilterLabel` returns `"Auto: Aspect filter"` for `{ aspects: [] }`, confirming this label mismatch ships as intended. If Basic-only identities are valid and the filter correctly passes all cards, the label should reflect the no-op, e.g. by returning `null` when the aspects array is empty.

**Fix:** Either treat an empty aspects result as "no meaningful filter" (return `null` from `computeAutoFilter` when the set is empty after Basic exclusion), or adjust `computeAutoFilterLabel` to return `null` when `autoFilter.aspects` exists but is empty:
```typescript
export function computeAutoFilterLabel(
  autoFilter: AutoFilter | null,
  isOverridden: boolean
): string | null {
  if (isOverridden || !autoFilter) return null;
  if (autoFilter.types) return 'Auto: Leader & Base';
  if (autoFilter.aspects?.length) return 'Auto: Aspect filter'; // only show when non-empty
  return null;
}
```

---

### WR-05: `topOffset` prop is declared in `CatalogClientProps` but is never read or forwarded

**File:** `src/components/catalog/catalog-client.tsx:26`

**Issue:** `topOffset?: string` is declared in the interface but is not destructured from props (line 54-64) and is never referenced in the component body. Any caller passing `topOffset` will silently have it ignored. This is dead interface surface that creates a false contract.

**Fix:** Either remove `topOffset` from `CatalogClientProps` if it is not needed, or destructure and apply it (e.g. to the main container's height calculation which currently hardcodes `calc(100svh-56px)`).

---

## Info

### IN-01: `onTouchStart` sets hover state but there is no `onTouchEnd` to clear it — card preview stays visible after a tap

**File:** `src/components/decks/deck-builder.tsx:518, 573`

**Issue:** Both the main-deck and sideboard card rows use `onTouchStart={() => setHoveredCard(item.card)}` to trigger the mobile bottom-bar preview, but there is no `onTouchEnd` or `onTouchCancel` to clear `hoveredCard`. On mobile, once a row is tapped the preview bar stays pinned permanently. The `onMouseLeave` and `onBlur` handlers only fire on pointer/focus events, not touch. A user has no way to dismiss the bar unless they tap another card row (which also has no dismissal path).

**Fix:** Add an `onTouchEnd` that clears the hovered card, or add a tap-to-dismiss on the mobile preview bar:
```tsx
onTouchStart={() => setHoveredCard(item.card)}
onTouchEnd={() => setHoveredCard(null)}
```

---

### IN-02: `id` in `createCard` test helper uses `Math.random()` — tests are non-deterministic

**File:** `src/lib/auto-filter.test.ts:7`

**Issue:** `id: Math.floor(Math.random() * 1000)` produces a different card id each test run. Although the `computeAutoFilter` function does not use `card.id`, if a future test ever relies on identity comparison the test will produce non-reproducible results. This is also a code quality smell in test factories.

**Fix:** Use a fixed default, e.g. `id: 1`, or accept an explicit override:
```typescript
const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: 1,
  ...overrides,
});
```

---

### IN-03: Stale comment on `SidebarFiltersProps` interface

**File:** `src/components/catalog/sidebar-filters.tsx:13`

**Issue:** Line 13 reads `// Stub props for now, to be wired in Plan 3`. The props are fully wired and this comment no longer reflects reality. It will mislead future readers.

**Fix:** Remove or update the comment.

---

### IN-04: Magic number `56` hardcoded in container height in both `catalog-client.tsx` and `deck-builder.tsx`

**File:** `src/components/catalog/catalog-client.tsx:228`, `src/components/decks/deck-builder.tsx:307`

**Issue:** Both components use `h-[calc(100svh-56px)]` where `56` is the height of the top navigation bar. This magic number appears in at least two places (and also in `sidebar-filters.tsx` line 86 as `h-[calc(100vh-3.5rem)]` — a third representation using a different unit). If the nav bar height changes, all three values must be updated in sync.

**Fix:** Define the nav bar height as a CSS custom property (e.g. `--nav-height: 3.5rem`) in a global stylesheet and reference it consistently: `h-[calc(100svh-var(--nav-height))]`.

---

_Reviewed: 2026-05-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
