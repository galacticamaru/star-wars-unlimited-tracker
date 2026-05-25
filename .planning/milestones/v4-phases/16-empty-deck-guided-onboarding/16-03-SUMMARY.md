---
phase: 16-empty-deck-guided-onboarding
plan: "03"
subsystem: catalog-client
tags:
  - react
  - nuqs
  - catalog-client
  - useEffect
  - filter-injection
dependency_graph:
  requires:
    - 16-01 (AutoFilter interface from src/lib/auto-filter.ts)
  provides:
    - src/components/catalog/catalog-client.tsx (auto-filter injection + override detection + autoFilterLabel threading)
  affects:
    - Wave 3 plan: deck-builder (Plan 04 — must pass autoFilter, isAutoFilterOverridden, onFilterManualChange, autoFilterLabel as props)
tech_stack:
  added: []
  patterns:
    - Auto-filter prop injection via useEffect with stable deps guard (RESEARCH.md Pattern 1)
    - Override detection via wrapped change handlers (RESEARCH.md Pattern 2)
    - Props threading via existing sidebarProps spread (no MobileFilterSheet changes needed)
key_files:
  created: []
  modified:
    - src/components/catalog/catalog-client.tsx
decisions:
  - useEffect deps are [autoFilter, isAutoFilterOverridden] only — never the nuqs setters or values (RESEARCH.md Pitfall 1 infinite loop guard)
  - isAutoFilterOverridden defaults to false in destructure so guard checks work correctly when prop is absent
  - handleTypesChange and handleAspectsChange only fire onFilterManualChange when the auto-filter is controlling that specific filter dimension (not just when any filter is changed)
  - autoFilterLabel reaches MobileFilterSheet via the existing {...sidebarProps} spread — no MobileFilterSheet edits
metrics:
  duration: "~2 minutes"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 1
---

# Phase 16 Plan 03: CatalogClient Auto-Filter Integration Summary

**One-liner:** CatalogClient now accepts an auto-filter contract (4 new props) and applies it to nuqs URL state via a guarded useEffect, with manual override detection in wrapped type/aspect change handlers.

## What Was Built

Single file modified: `src/components/catalog/catalog-client.tsx`

### Four New Optional Props

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `autoFilter` | `AutoFilter \| null \| undefined` | `undefined` | Filter intent from parent (DeckBuilder) |
| `isAutoFilterOverridden` | `boolean` | `false` | Whether user has manually overridden the auto-filter |
| `onFilterManualChange` | `() => void \| undefined` | `undefined` | Callback fired when user manually changes a filter the auto-filter controls |
| `autoFilterLabel` | `string \| null \| undefined` | `undefined` | Human-readable label for the auto-filter chip |

### useEffect for Filter Injection

```typescript
useEffect(() => {
  if (isAutoFilterOverridden || !autoFilter) return;
  if (autoFilter.types !== undefined) {
    setSelectedTypes(autoFilter.types);
  }
  if (autoFilter.aspects !== undefined) {
    setSelectedAspects(autoFilter.aspects);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [autoFilter, isAutoFilterOverridden]);
```

**Why deps are `[autoFilter, isAutoFilterOverridden]` only:** Including `setSelectedTypes`, `setSelectedAspects`, `selectedTypes`, or `selectedAspects` in the deps array would create an infinite loop — the effect sets them, they change, the effect fires again. nuqs setter functions have stable identity across renders (RESEARCH.md A1), so they are safe to omit. The `// eslint-disable-next-line react-hooks/exhaustive-deps` comment is required and intentional.

### Wrapped Change Handlers (Override Detection)

```typescript
const handleTypesChange = (v: string[]) => {
  if (!isAutoFilterOverridden && autoFilter?.types !== undefined) {
    onFilterManualChange?.();
  }
  setSelectedTypes(v);
};

const handleAspectsChange = (v: string[]) => {
  if (!isAutoFilterOverridden && autoFilter?.aspects !== undefined) {
    onFilterManualChange?.();
  }
  setSelectedAspects(v);
};
```

These handlers:
1. Fire `onFilterManualChange` only when the auto-filter is active AND controlling that specific filter dimension (D-03)
2. Always call the underlying nuqs setter regardless — the manual change is applied whether or not the override signal fires
3. Replace the direct `setSelectedTypes`/`setSelectedAspects` references in `sidebarProps` — old direct wiring is fully removed

### autoFilterLabel Threading

`autoFilterLabel` is added to `sidebarProps` as a shorthand property. Since `MobileFilterSheet` already spreads all `{...sidebarProps}` into `SidebarFilters` (RESEARCH.md confirmed: mobile-filter-sheet.tsx line 35), no changes to either file were needed — the prop propagates automatically to both desktop and mobile UIs.

## Decisions Encoded

| Decision | Implementation |
|----------|----------------|
| D-02: auto-filter applies only in mode="selector" | Enforced by the caller (DeckBuilder, Plan 04) — it only passes the props when rendering CatalogClient in selector mode |
| D-03: override flag set on manual filter change | handleTypesChange/handleAspectsChange fire onFilterManualChange when auto-filter is active and not yet overridden |
| Pitfall 1 guard: no infinite loop | useEffect deps are exactly [autoFilter, isAutoFilterOverridden] — eslint-disable documents the intentional omission |

## Plan 04 Reminder (DeckBuilder)

DeckBuilder (Plan 04) MUST:
1. Compute `autoFilter` with `useMemo([leader, base, isAutoFilterOverridden])` — if not memoized, `autoFilter` gets a new object reference on every render, causing the useEffect to fire on every render (RESEARCH.md Pitfall 2)
2. Pass all four props to `CatalogClient`: `autoFilter={autoFilter}`, `isAutoFilterOverridden={isAutoFilterOverridden}`, `onFilterManualChange={() => setIsAutoFilterOverridden(true)}`, `autoFilterLabel={autoFilterLabel}`
3. Reset `isAutoFilterOverridden` to `false` at ALL `SET_LEADER` and `SET_BASE` dispatch sites (RESEARCH.md Pitfall 3)

## Deviations from Plan

None — plan executed exactly as written. All three edits per task applied as specified. TypeScript exits 0. All 42 relevant tests pass (auto-filter.test.ts, filter-cards.test.ts, deck-validation.test.ts).

Note on `grep -c "useEffect"` returning 3: the plan's acceptance criteria expected 2, but this count includes the `import { useMemo, useEffect, useState }` line. There are exactly 2 useEffect call-sites (lines 70 and 86), which is correct.

## Known Stubs

None. CatalogClient itself has no stubs — the auto-filter behavior is wired end-to-end through props. The feature is incomplete until Plan 04 passes the actual props from DeckBuilder.

## Threat Flags

None. This plan only adds client-side React state manipulation and prop threading. The security analysis in the plan's threat model (T-16-03-01 through T-16-03-03) confirms no new security surface.

## Self-Check

- [x] `src/components/catalog/catalog-client.tsx` modified with all three Task 1 edits
- [x] `src/components/catalog/catalog-client.tsx` modified with all three Task 2 edits
- [x] Task 1 commit `fcaded7` exists in git log
- [x] Task 2 commit `914d221` exists in git log
- [x] `npx tsc --noEmit` exits 0
- [x] 42 relevant tests pass (auto-filter, filter-cards, deck-validation)
- [x] `grep "import type { AutoFilter } from '@/lib/auto-filter';"` matches
- [x] `grep -F "}, [autoFilter, isAutoFilterOverridden]);"` matches
- [x] `grep -c "onTypesChange: setSelectedTypes"` returns 0 (old wiring removed)
- [x] `grep -c "onAspectsChange: setSelectedAspects"` returns 0 (old wiring removed)
- [x] `git diff --stat src/components/catalog/mobile-filter-sheet.tsx` shows zero lines (untouched)
- [x] `git diff HEAD~1 -- src/components/catalog/sidebar-filters.tsx` shows zero lines (untouched by this plan)

## Self-Check: PASSED
