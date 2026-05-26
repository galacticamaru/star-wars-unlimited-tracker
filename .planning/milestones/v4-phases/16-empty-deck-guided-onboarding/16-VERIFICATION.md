---
phase: 16-empty-deck-guided-onboarding
verified: 2026-05-15T11:35:00Z
status: human_needed
score: 3/3 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open a new empty deck in the browser. Navigate to the Add Cards tab."
    expected: "Card browser shows only Leader and Base cards. The sidebar displays a chip reading 'Auto: Leader & Base' with the primary-tinted Badge styling."
    why_human: "nuqs URL state injection and React render behavior cannot be fully exercised without a browser and a running dev server."
  - test: "Select a leader card from the filtered list. Verify the filter still shows Leader+Base cards (not yet narrowed)."
    expected: "Filter remains on Leader+Base types. Chip still reads 'Auto: Leader & Base'."
    why_human: "Requires interactive browser session to confirm the leader-only intermediate state (D-01 state 2) is stable."
  - test: "Now select a base card. Observe the card browser and sidebar chip."
    expected: "Filter switches to the combined aspects of the leader and base (excluding Basic). Chip changes to 'Auto: Aspect filter'. Cards shown match only those aspects."
    why_human: "Requires real Card data with known aspects to verify the union computation produces the correct filtered results in the UI."
  - test: "With both leader and base selected, manually toggle a type or aspect filter in the sidebar."
    expected: "The 'Auto: Aspect filter' chip disappears. The user's manual filter is applied and stays applied — the auto-filter does not re-apply."
    why_human: "Override detection (D-03) and the chip disappearing (D-09 isOverridden path) require interactive verification."
  - test: "With the auto-filter overridden, click the Remove button on the leader or base card."
    expected: "Filter resets to Leader+Base types. Chip reappears reading 'Auto: Leader & Base'. The override is cleared."
    why_human: "Override reset on leader/base change (D-04) requires interactive session to confirm all 6 dispatch sites behave consistently."
  - test: "Navigate to the Deck List tab with an empty main deck."
    expected: "Empty deck state shows a button reading 'Add Cards' (not 'Switch to Catalog')."
    why_human: "D-11 CTA rename can be spot-checked visually as the final confirmation of the label change."
---

# Phase 16: Empty Deck Guided Onboarding — Verification Report

**Phase Goal:** A user starting with an empty deck is guided — the card browser intelligently filters first to Leader and Base cards, then narrows to the aspects of the chosen leader and base combination
**Verified:** 2026-05-15T11:35:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | When a deck has no leader or base selected, the card browser automatically pre-filters to show only Leader and Base card types | VERIFIED | `computeAutoFilter(null, null)` and `computeAutoFilter(leader, null)` both return `{ types: ['Leader', 'Base'] }` (tests 1–3 of 12 pass). DeckBuilder useMemo feeds this to CatalogClient. useEffect in CatalogClient writes to nuqs `setSelectedTypes(['Leader','Base'])` and clears aspects when not overridden. filterCards() consumes nuqs selectedTypes. Full data-flow chain verified. |
| 2 | After a leader and base are selected, the card browser automatically filters to cards matching the combined aspects of that leader+base pair | VERIFIED | `computeAutoFilter(leader, base)` returns `{ aspects: union(leader.aspects, base.aspects) }` excluding 'Basic' (tests 4–7 of 12 pass). DeckBuilder useMemo recomputes when leader/base change. CatalogClient useEffect switches from types to aspects filter branch (clears types, sets aspects). filterCards() consumes nuqs selectedAspects. D-08 'Basic' exclusion verified by `if (a !== 'Basic') combined.add(a)` in auto-filter.ts and by dedicated test. |
| 3 | The user can override the auto-filter at any time without the browser reverting unexpectedly | VERIFIED | `handleTypesChange`/`handleAspectsChange` in CatalogClient fire `onFilterManualChange?.()` when the auto-filter controls that dimension and is not yet overridden. DeckBuilder's `onFilterManualChange={() => setIsAutoFilterOverridden(true)}` sets the flag. CatalogClient useEffect has guard `if (isAutoFilterOverridden || !autoFilter) return;`. 6 dispatch sites (2 in handleDeckUpdate, 4 Remove buttons) all call `setIsAutoFilterOverridden(false)` to reset on leader/base change. All logic path-traced in code. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/auto-filter.ts` | AutoFilter type + computeAutoFilter + computeAutoFilterLabel | VERIFIED | Exists, 47 lines, 3 exports (interface + 2 functions). Imports Card from deck-validation. Basic exclusion implemented. Label strings are single source of truth. |
| `src/lib/auto-filter.test.ts` | 12 unit tests covering D-01 states, D-08 exclusion, D-09 labels | VERIFIED | Exists, 107 lines. `// @vitest-environment node` on line 1. 12 `it()` blocks. All 12 pass under `npx vitest run src/lib/auto-filter.test.ts`. Exact strings 'Auto: Leader & Base' and 'Auto: Aspect filter' present. `not.toContain('Basic')` assertion on line 71. |
| `src/components/catalog/sidebar-filters.tsx` | autoFilterLabel prop + Badge chip render | VERIFIED | `autoFilterLabel?: string | null` in interface (line 46). Destructured without default (line 82). Badge chip renders conditionally via `{autoFilterLabel && ...}` (line 88). `variant="outline"`, exact className, `role="status"`, `aria-label` template all present. Badge import on line 11. 5 occurrences of `autoFilterLabel` in file. MobileFilterSheet untouched (propagates via existing `{...props}` spread). |
| `src/components/catalog/catalog-client.tsx` | Auto-filter injection useEffect + override handlers + autoFilterLabel threading | VERIFIED | AutoFilter imported (line 6). 4 new props in interface (lines 26–29). useEffect with exact deps `[autoFilter, isAutoFilterOverridden]` (line 95). Guard `if (isAutoFilterOverridden \|\| !autoFilter) return` present. handleTypesChange/handleAspectsChange both present with override detection. sidebarProps includes `autoFilterLabel` (line 223). Old direct `setSelectedTypes`/`setSelectedAspects` wiring removed (0 occurrences in onTypesChange/onAspectsChange). eslint-disable comment present. |
| `src/components/decks/deck-builder.tsx` | isAutoFilterOverridden state + autoFilter/autoFilterLabel useMemos + dispatch resets + CatalogClient props + CTA rename | VERIFIED | Import on line 7. useState(false) on line 131. autoFilter useMemo with deps `[leader, base, isAutoFilterOverridden]` (lines 186–189). autoFilterLabel useMemo with deps `[autoFilter, isAutoFilterOverridden]` (lines 192–195). 6 occurrences of `setIsAutoFilterOverridden(false)` (lines 249, 252, 421, 433, 461, 472). 1 occurrence of `setIsAutoFilterOverridden(true)` in onFilterManualChange (line 377). All 4 CatalogClient props wired (lines 375–378). 'Switch to Catalog' = 0 occurrences. 'Add Cards' = 2 occurrences (tab button line 325, CTA line 488). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/auto-filter.ts` | `src/lib/deck-validation.ts` | `import type { Card }` | WIRED | Line 1: `import type { Card } from './deck-validation';` |
| `src/components/catalog/catalog-client.tsx` | `src/lib/auto-filter.ts` | `import type { AutoFilter }` | WIRED | Line 6: `import type { AutoFilter } from '@/lib/auto-filter';` |
| `src/components/catalog/catalog-client.tsx` | `src/components/catalog/sidebar-filters.tsx` | sidebarProps with autoFilterLabel | WIRED | `autoFilterLabel` in sidebarProps (line 223), spread to `<SidebarFilters {...sidebarProps} />` (line 230) and `<MobileFilterSheet {...sidebarProps} />` (line 235) |
| `src/components/decks/deck-builder.tsx` | `src/lib/auto-filter.ts` | `import { computeAutoFilter, computeAutoFilterLabel }` | WIRED | Line 7: `import { computeAutoFilter, computeAutoFilterLabel } from '@/lib/auto-filter';` |
| `src/components/decks/deck-builder.tsx` | `src/components/catalog/catalog-client.tsx` | 4 auto-filter props on CatalogClient | WIRED | Lines 375–378: `autoFilter={autoFilter}`, `isAutoFilterOverridden={isAutoFilterOverridden}`, `onFilterManualChange={() => setIsAutoFilterOverridden(true)}`, `autoFilterLabel={autoFilterLabel}` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `sidebar-filters.tsx` | `autoFilterLabel` | Prop from CatalogClient via sidebarProps | Yes — string literal from `computeAutoFilterLabel`, never user input | FLOWING |
| `catalog-client.tsx` | `selectedTypes` / `selectedAspects` (nuqs) | useEffect writes from `autoFilter.types` / `autoFilter.aspects` | Yes — Set-union computed from real Card.aspects arrays | FLOWING |
| `catalog-client.tsx` | `filtered` | `filterCards(cards, { selectedTypes, selectedAspects, ... }, collection)` | Yes — real card list filtered against nuqs state | FLOWING |
| `deck-builder.tsx` | `autoFilter` | `useMemo(() => computeAutoFilter(leader, base), ...)` where `leader`/`base` are Card objects from `cardMap.get(state.leaderCardDefinitionId)` | Yes — derived from real Card objects passed as allCards prop | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 12 unit tests for computeAutoFilter / computeAutoFilterLabel | `npx vitest run src/lib/auto-filter.test.ts` | 12/12 passed | PASS |
| All core lib tests (auto-filter, filter-cards, deck-validation) | `npx vitest run src/lib/auto-filter.test.ts src/lib/filter-cards.test.ts src/lib/deck-validation.test.ts` | 42/42 passed | PASS |
| TypeScript compilation | `npx tsc --noEmit` | Exit 0 — no type errors | PASS |
| Failing test suites are pre-existing | 5 suites fail on `DATABASE_URL not set` | All fail on infrastructure error, not Phase 16 code | PASS (pre-existing) |
| 'Switch to Catalog' removed from deck-builder.tsx | grep count | 0 occurrences | PASS |
| 'Add Cards' appears exactly twice in deck-builder.tsx | grep count | 2 occurrences (tab button + CTA) | PASS |
| setIsAutoFilterOverridden(false) at exactly 6 call sites | grep count | 6 occurrences | PASS |
| setIsAutoFilterOverridden(true) at exactly 1 site | grep count | 1 occurrence (onFilterManualChange) | PASS |
| autoFilterLabel reaches SidebarFilters | grep sidebarProps | autoFilterLabel shorthand present in sidebarProps | PASS |
| Old direct type/aspect wiring removed from sidebarProps | grep count | 0 occurrences of `onTypesChange: setSelectedTypes` and `onAspectsChange: setSelectedAspects` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REQ-DECK-09 | 16-01, 16-02, 16-03, 16-04 | User is guided through building an empty deck — card browser auto-filters to Leader and Base cards first, then filters by the combination of chosen leader's and base aspects after selection | SATISFIED | Full implementation across 4 plans: pure functions (16-01), UI chip (16-02), CatalogClient injection (16-03), DeckBuilder orchestration (16-04). All 3 ROADMAP success criteria verified in code. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `catalog-client.tsx` | 84 | Comment references "stale comment" — the commit `f4acaad` cleaned up a stale comment and unused prop (`topOffset`). No stubs remain. | Info | None — cleanup confirms codebase health |

No TODO/FIXME/placeholder patterns found in any Phase 16 modified files. No empty implementations. No hardcoded empty data flowing to render.

### Deviation from Plan (Informational — Not a Gap)

`catalog-client.tsx` useEffect (lines 85–95) deviates from the plan spec by using `else if` branches instead of separate `if` branches, and adds complementary clears (`setSelectedAspects([])` when types are set, `setSelectedTypes([])` when aspects are set). This is a strictly better implementation that prevents types and aspects from stacking to produce zero results when the auto-filter transitions between states. The comment on line 84 documents this intentional deviation. The must-have truth is still fully satisfied — the effect still writes `autoFilter.types` / `autoFilter.aspects` to nuqs when `isAutoFilterOverridden` is false and `autoFilter` is non-null.

### Human Verification Required

The automated verification confirms all code is implemented correctly and the data-flow chain is complete. The following behavioral scenarios require a browser with a running dev server to confirm the end-to-end user experience:

#### 1. Empty Deck Auto-Filter (SC-1)

**Test:** Open a new empty deck. Navigate to the Add Cards tab.
**Expected:** Card browser shows only Leader and Base cards. Sidebar displays a chip reading "Auto: Leader & Base" in primary-tinted outline Badge style.
**Why human:** nuqs URL state injection and React hydration cannot be exercised without a browser and running Next.js dev server.

#### 2. Leader-Only Intermediate State (D-01 state 2)

**Test:** From the empty deck filtered view, select a leader card. Observe whether the filter stays on Leader+Base types.
**Expected:** Filter remains on Leader+Base after leader selection. Chip still reads "Auto: Leader & Base".
**Why human:** Requires interactive session to confirm the intermediate state is stable after the SET_LEADER dispatch + reset sequence.

#### 3. Both Selected — Aspect Filter (SC-2)

**Test:** With a leader selected, now select a base card. Observe the card browser and chip.
**Expected:** Filter switches to the combined aspects of leader+base (excluding Basic). Chip changes to "Auto: Aspect filter". Only aspect-matching cards are shown.
**Why human:** Requires real Card data with known aspects to confirm the union produces correct filtered results.

#### 4. Override Without Revert (SC-3)

**Test:** With both leader and base selected, manually toggle a type or aspect filter in the sidebar.
**Expected:** "Auto: Aspect filter" chip disappears. User's manual filter is applied and stays — the auto-filter does not re-apply.
**Why human:** Override detection (D-03) and chip disappearance (D-09 isOverridden=true path) require interactive verification.

#### 5. Override Reset on Leader/Base Change (D-04)

**Test:** With the auto-filter overridden (chip absent), click Remove on the leader or base.
**Expected:** Filter resets to Leader+Base types. Chip reappears reading "Auto: Leader & Base". Override is cleared.
**Why human:** Confirms the 6 dispatch-site resets produce the expected user-visible result in context.

#### 6. Empty Deck CTA Text (D-11)

**Test:** Navigate to the Deck List tab with an empty main deck.
**Expected:** Button reads "Add Cards" (not "Switch to Catalog").
**Why human:** Quick visual confirmation of the label rename in the actual rendered UI.

### Gaps Summary

No gaps found. All must-have truths are VERIFIED with code evidence. All artifacts exist, are substantive, and are wired. Data flows from DeckBuilder → CatalogClient → nuqs → filterCards → render. The 6 human verification items are required because the phase produces interactive browser behavior (nuqs URL state, React effect timing, filter UI) that cannot be confirmed without running the application. No blockers identified.

---

_Verified: 2026-05-15T11:35:00Z_
_Verifier: Claude (gsd-verifier)_
