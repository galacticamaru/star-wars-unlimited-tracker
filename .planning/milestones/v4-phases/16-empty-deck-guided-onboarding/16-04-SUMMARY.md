---
phase: 16-empty-deck-guided-onboarding
plan: "04"
subsystem: deck-builder
tags:
  - react
  - deck-builder
  - useState
  - useMemo
  - cta-rename
  - auto-filter
dependency_graph:
  requires:
    - 16-01 (computeAutoFilter, computeAutoFilterLabel from src/lib/auto-filter.ts)
    - 16-03 (CatalogClient props contract: autoFilter, isAutoFilterOverridden, onFilterManualChange, autoFilterLabel)
  provides:
    - src/components/decks/deck-builder.tsx (Auto-filter orchestration + override reset + CTA rename)
  affects:
    - REQ-DECK-09 (guided onboarding — this plan is the final integration point)
tech_stack:
  added: []
  patterns:
    - useMemo with stable deps for memoized derivation from leader/base card objects (RESEARCH.md Pitfall 2 guard)
    - useState for ephemeral UI flag (D-05: no URL persistence)
    - Prop threading via explicit prop names (not spread) to preserve readability
key_files:
  created: []
  modified:
    - src/components/decks/deck-builder.tsx
decisions:
  - isAutoFilterOverridden useState with default false co-located with existing hover/view/errors state
  - autoFilter useMemo deps are exactly [leader, base, isAutoFilterOverridden] — leader and base get stable identity from cardMap useMemo upstream
  - autoFilterLabel useMemo deps are [autoFilter, isAutoFilterOverridden] — depends only on the memoized autoFilter object and the flag
  - onFilterManualChange is an inline arrow (not useCallback) — CatalogClient does not memoize on callback identity
  - All 6 SET_LEADER/SET_BASE dispatch call sites reset isAutoFilterOverridden to false — reducer switch cases are pure and untouched
metrics:
  duration: "~5 minutes"
  completed: "2026-05-15"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 1
---

# Phase 16 Plan 04: DeckBuilder Auto-Filter Integration Summary

**One-liner:** DeckBuilder now owns the auto-filter state machine — computing autoFilter/autoFilterLabel via useMemo, resetting the override flag at all 6 SET_LEADER/SET_BASE call sites, threading the 4-prop contract to CatalogClient, and renaming the empty-deck CTA to "Add Cards" (D-11).

## What Was Built

Single file modified: `src/components/decks/deck-builder.tsx`

### New Import

```typescript
import { computeAutoFilter, computeAutoFilterLabel } from '@/lib/auto-filter';
```

### New useState Declaration (line 131)

```typescript
const [isAutoFilterOverridden, setIsAutoFilterOverridden] = useState(false);
```

Default: `false` — auto-filter is active by default on every new deck session. D-05 mandates this lives in component state (not nuqs), so it resets on every page load.

### Two New useMemo Derivations (lines 186-198)

```typescript
// autoFilter: null when overridden, otherwise derived from current leader+base state
const autoFilter = useMemo(
  () => (isAutoFilterOverridden ? null : computeAutoFilter(leader, base)),
  [leader, base, isAutoFilterOverridden]
);

// autoFilterLabel: null when overridden or no auto-filter, otherwise chip text
const autoFilterLabel = useMemo(
  () => computeAutoFilterLabel(autoFilter, isAutoFilterOverridden),
  [autoFilter, isAutoFilterOverridden]
);
```

**Why useMemo is REQUIRED on autoFilter:** If computed inline (not memoized), `autoFilter` gets a new object reference on every render. The `useEffect` in CatalogClient depends on `autoFilter` — a new reference every render means the effect fires on every render, which means `setSelectedTypes`/`setSelectedAspects` are called on every keystroke in the search box (RESEARCH.md Pitfall 2). The `useMemo` with deps `[leader, base, isAutoFilterOverridden]` ensures stable identity when those three values are unchanged.

**Why autoFilterLabel's deps are `[autoFilter, isAutoFilterOverridden]`:** `autoFilterLabel` is derived from the already-memoized `autoFilter` — it only needs to recompute when the filter object changes or the override flag changes. No circular dependency because `autoFilterLabel` is not in `autoFilter`'s deps array.

### Six Dispatch-Site Resets (D-04)

All call sites that dispatch `SET_LEADER` or `SET_BASE` now pair the dispatch with `setIsAutoFilterOverridden(false)`:

| Line | Site | Change |
|------|------|--------|
| 249 | `handleDeckUpdate` — Leader branch | Added `setIsAutoFilterOverridden(false);` after dispatch |
| 252 | `handleDeckUpdate` — Base branch | Added `setIsAutoFilterOverridden(false);` after dispatch |
| 421 | Leader overlay Remove button onClick | Wrapped in block `{ dispatch(...); setIsAutoFilterOverridden(false); }` |
| 433 | Leader text-only Remove button onClick | Wrapped in block `{ dispatch(...); setIsAutoFilterOverridden(false); }` |
| 461 | Base overlay Remove button onClick | Wrapped in block `{ dispatch(...); setIsAutoFilterOverridden(false); }` |
| 472 | Base text-only Remove button onClick | Wrapped in block `{ dispatch(...); setIsAutoFilterOverridden(false); }` |

The reducer's `case 'SET_LEADER':` and `case 'SET_BASE':` switch cases are pure state transitions and were NOT modified — the override reset is React component state, not deck data.

### Four New CatalogClient Props (line 375-378)

```tsx
<CatalogClient
  cards={allCards}
  filterOptions={filterOptions}
  mode="selector"
  deckCounts={deckCounts}
  onDeckUpdate={handleDeckUpdate}
  autoFilter={autoFilter}
  isAutoFilterOverridden={isAutoFilterOverridden}
  onFilterManualChange={() => setIsAutoFilterOverridden(true)}
  autoFilterLabel={autoFilterLabel}
/>
```

| Prop | Role |
|------|------|
| `autoFilter` | The memoized filter intent (types or aspects object, or null when overridden) — CatalogClient applies it to nuqs state via its internal useEffect |
| `isAutoFilterOverridden` | Guard flag — CatalogClient's useEffect skips injection when true; handleTypesChange/handleAspectsChange skip override signal when already overridden |
| `onFilterManualChange` | Callback fired by CatalogClient when user manually changes a filter dimension the auto-filter controls — sets the flag to true (override) |
| `autoFilterLabel` | Chip text for the auto-filter Badge in SidebarFilters — "Auto: Leader & Base" or "Auto: Aspect filter" or null (chip hidden) |

`onFilterManualChange` is an inline arrow — not wrapped in `useCallback` because CatalogClient does not memoize on callback identity.

### D-11 CTA Rename (line 488)

```
Before: <Button onClick={() => setView('catalog')}>Switch to Catalog</Button>
After:  <Button onClick={() => setView('catalog')}>Add Cards</Button>
```

Label-only change. `onClick`, surrounding `<div>`, and `<p>` elements are unchanged. The tab button at line 307 (already named "Add Cards") was not modified.

## Verification Results

- `grep -c "setIsAutoFilterOverridden(false)"` = 6 (all dispatch sites)
- `grep -c "setIsAutoFilterOverridden(true)"` = 1 (onFilterManualChange)
- `grep -c "Switch to Catalog"` = 0 (old string fully removed)
- `grep -c "Add Cards"` = 2 (tab button at line 307 + renamed CTA at line 488)
- `npx tsc --noEmit` exits 0
- 42 unit tests pass (auto-filter, filter-cards, deck-validation)
- Production build: TypeScript and Turbopack compilation pass; DATABASE_URL missing error is pre-existing infrastructure issue unrelated to this plan

## Next Step

Run `/gsd-verify-work` to exercise the auto-filter state machine end-to-end in the browser. UAT should verify:
1. New deck with no leader/no base: card browser auto-filters to Leader & Base types, chip shows "Auto: Leader & Base"
2. Leader selected, no base: filter stays on Leader & Base
3. Both selected: filter shifts to combined leader+base aspects (excluding Basic), chip shows "Auto: Aspect filter"
4. Manual type/aspect change: chip disappears, user's filter preserved
5. Remove leader or base: override resets, auto-filter re-applies to ["Leader","Base"]
6. Empty deck state CTA reads "Add Cards"

## Deviations from Plan

### Minor: Plan verification count for `setIsAutoFilterOverridden` was 7, actual is 8

The plan's overall verification section stated `grep -c "setIsAutoFilterOverridden" src/components/decks/deck-builder.tsx` should return 7. The actual count is 8: 1 declaration + 2 in handleDeckUpdate + 4 Remove button onClicks + 1 in the `onFilterManualChange` prop. The plan's comment said "7 (1 declaration + 6 call sites...the onFilterManualChange arrow is a 7th)" — but that would be 8, not 7. The specific sub-counts (6 `false`, 1 `true`) are exactly as specified. This is a documentation discrepancy in the plan, not a code error. All implementation behavior is correct.

Otherwise: plan executed exactly as written. All three tasks applied as specified. TypeScript exits 0. All relevant unit tests pass.

## Known Stubs

None. The auto-filter state machine is fully wired end-to-end: DeckBuilder computes autoFilter/autoFilterLabel, passes them to CatalogClient, which applies them to nuqs state via its internal useEffect (Plan 03). SidebarFilters renders the chip via the autoFilterLabel prop (Plan 02).

## Threat Flags

None. This plan only adds client-side React state and prop threading. Per the plan's threat model: T-16-04-01 (all 6 dispatch sites reset the flag — verified), T-16-04-02 (useMemo with stable deps prevents identity instability — implemented), T-16-04-03 and T-16-04-04 are accepted. No new security surface.

## Self-Check

- [x] `src/components/decks/deck-builder.tsx` modified with all Task 1 edits (import, useState, 2 useMemos)
- [x] `src/components/decks/deck-builder.tsx` modified with all Task 2 edits (6 dispatch site resets)
- [x] `src/components/decks/deck-builder.tsx` modified with all Task 3 edits (4 CatalogClient props + CTA rename)
- [x] Task 1 commit `ff39e19` exists in git log
- [x] Task 2 commit `0d1318f` exists in git log
- [x] Task 3 commit `f37f7bb` exists in git log
- [x] `npx tsc --noEmit` exits 0
- [x] 42 relevant tests pass (auto-filter, filter-cards, deck-validation)
- [x] `grep -c "setIsAutoFilterOverridden(false)"` = 6
- [x] `grep -c "setIsAutoFilterOverridden(true)"` = 1
- [x] `grep -c "Switch to Catalog"` = 0
- [x] `grep -c "Add Cards"` = 2
- [x] CatalogClient receives all 4 contract props
- [x] DeckSidebar render is unchanged (verified: no new props added)

## Self-Check: PASSED
