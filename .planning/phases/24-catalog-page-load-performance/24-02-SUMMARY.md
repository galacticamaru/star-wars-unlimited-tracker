---
phase: 24-catalog-page-load-performance
plan: "02"
subsystem: catalog
tags: [catalog, debounce, nuqs, search, perf-01]
one_liner: "150ms useEffect debounce on search input: local searchInput state gates nuqs URL writes, eliminating mid-keystroke filterCards re-runs"
dependency_graph:
  requires: [24-01]
  provides: [search-debounce]
  affects: [catalog-client, sidebar-filters]
tech_stack:
  added: []
  patterns: [inline-useEffect-debounce, local-state-mirrors-url-param]
key_files:
  created: []
  modified:
    - src/components/catalog/catalog-client.tsx
decisions:
  - "Used inline useEffect debounce (Pattern 3 from RESEARCH.md) rather than a shared hook — 3-line pattern, no abstraction needed"
  - "setSearch(searchInput || null) — null removes the `q` URL param entirely when input is empty (nuqs convention)"
  - "setSearch added to useEffect deps array alongside searchInput — nuqs setter is stable but included for exhaustive-deps correctness"
metrics:
  duration: "~2 minutes"
  completed: "2026-05-26T08:01:09Z"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 24 Plan 02: Search Input Debounce Summary

## What Was Built

Added a 150ms search input debounce to `CatalogClient` per PERF-01 (D-01, D-02). Every keystroke in the catalog search input now updates local `searchInput` state immediately (visible text reflects instantly), but the nuqs `q` URL parameter and the `filterCards` useMemo are only triggered after 150ms of typing inactivity. This eliminates mid-keystroke `filterCards` re-runs and full grid re-renders.

## File Modified

**`src/components/catalog/catalog-client.tsx`** — 11 insertions, 1 modification to existing line, net +11 lines

### Changes made (in order)

1. **Local state declaration** (after existing nuqs `search` declaration, line 100):
   ```ts
   const [searchInput, setSearchInput] = useState(search);
   ```
   Mirrors the nuqs `q` initial value so the input shows the URL-provided search term on first render.

2. **Debounce useEffect** (lines 102–107, 6-line block):
   ```ts
   useEffect(() => {
     const timer = setTimeout(() => {
       void setSearch(searchInput || null);
     }, 150);
     return () => clearTimeout(timer);
   }, [searchInput, setSearch]);
   ```
   Timer is cleared on every new keystroke (cleanup function). `searchInput || null` removes the `q` param from the URL when the input is cleared.

3. **handleClearAll reset** (line 162, added before existing `setSearch('')`):
   ```ts
   setSearchInput('');
   ```
   Resolves RESEARCH.md Pitfall 4 — without this, clicking "Clear All Filters" would clear nuqs `search` but leave `searchInput` non-empty, keeping the old text visible in the input box.

4. **sidebarProps wiring** (line 193):
   ```ts
   search: searchInput, onSearchChange: setSearchInput,
   ```
   The sidebar input now displays `searchInput` (instant local update) and calls `setSearchInput` on change. The sidebar's clear-X button calls `onSearchChange('')` = `setSearchInput('')` which is correct.

### Critical correctness check

The `filtered` useMemo at line 126 continues to depend on `search` (nuqs value, debounced) NOT `searchInput` (raw input value). Lines 130 and 146 both reference `search` — the debounce is intact and not defeated.

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `grep -c "useState(search)"` → 1 | 1 |
| `grep -c "searchInput"` → ≥4 | 4 |
| `setTimeout` present | line 103 |
| `150` present within 3 lines of setTimeout | line 105 |
| `clearTimeout` present | line 106 |
| `setSearchInput('')` present | line 162 |
| `search: searchInput` in sidebarProps | line 193 |
| `filtered` useMemo deps contain `search` (not `searchInput`) | lines 130, 146 |
| `useEffect` count ≥2 (import + usage) | 4 (import uses useMemo, useEffect, useState at line 3) |

## Test Command Outputs

```
npm test -- --run src/lib/filter-cards.test.ts src/components/catalog/catalog-client.browser.test.tsx
Test Files  1 passed | 1 skipped (2)
Tests  21 passed | 6 todo (27)
Exit code: 0
```

`npx tsc --noEmit` — 17 pre-existing TypeScript errors in `__tests__/` (jest-style legacy files, not vitest). Zero new errors introduced. Zero TypeScript errors in `src/components/catalog/catalog-client.tsx`.

## Deviations from Plan

None. Plan executed exactly as written.

- `useState` and `useEffect` were already imported at line 3 (confirmed before editing — no import change needed)
- `setSearch` added to the `useEffect` deps array: the plan showed `[searchInput]` only in one example but `[searchInput, setSearch]` in another; added both for exhaustive-deps correctness (nuqs setter is stable, this is safe)

## Known Stubs

None in files modified by this plan. The `catalog-client.browser.test.tsx` has `it.todo` stubs but those pre-date this plan and are tracked in VALIDATION.md.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The debounce is purely client-side state management. Threat model entries T-24-03, T-24-04, T-24-05 apply (see PLAN.md) — all accepted, no new surface.

## Self-Check: PASSED

- [x] `src/components/catalog/catalog-client.tsx` — modified and committed
- [x] Commit `783b849` exists: `feat(24-02): add 150ms search input debounce to CatalogClient`
- [x] No files deleted
- [x] Tests pass (21 passed, 6 todo, exit 0)
- [x] TypeScript: 0 new errors in modified file
