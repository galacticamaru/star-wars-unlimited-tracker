---
phase: 16-empty-deck-guided-onboarding
plan: "02"
subsystem: ui-component
tags:
  - react
  - shadcn
  - badge
  - sidebar-filters
  - presentational
dependency_graph:
  requires:
    - 16-01 (computeAutoFilterLabel from src/lib/auto-filter.ts)
  provides:
    - src/components/catalog/sidebar-filters.tsx (autoFilterLabel prop + Badge chip render)
  affects:
    - Wave 3 plan (16-03): catalog-client must pass autoFilterLabel through sidebarProps
    - MobileFilterSheet: auto-propagates via existing {...props} spread (no change needed)
tech_stack:
  added: []
  patterns:
    - Conditional render pattern (autoFilterLabel && <Badge />) — no visibility:hidden
    - Badge className override pattern (variant=outline + custom primary-family classes)
    - role=status for live-region accessibility without interruption
key_files:
  created: []
  modified:
    - src/components/catalog/sidebar-filters.tsx
decisions:
  - Badge import added adjacent to other @/components/ui/* imports
  - autoFilterLabel has no default in destructure (undefined/null/empty-string all falsy — same behavior)
  - Chip placement: after <h2>Filters</h2>, before search Input — flex col gap-4 parent provides spacing automatically
  - dark:text-primary used (not dark:text-primary-foreground) — matches plan acceptance criteria and narrative in UI-SPEC
metrics:
  duration: "~5 minutes"
  completed: "2026-05-15"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 1
---

# Phase 16 Plan 02: SidebarFilters Auto-Filter Chip Summary

**One-liner:** Extended `SidebarFilters` with `autoFilterLabel?: string | null` prop that conditionally renders a primary-tinted Badge chip below the Filters heading with exact UI-SPEC styling, role=status, and aria-label.

## What Was Built

**`src/components/catalog/sidebar-filters.tsx`** — 4 targeted edits, 14 lines added:

### New prop signature

```typescript
interface SidebarFiltersProps {
  // ... existing props unchanged ...
  isAuthenticated?: boolean;
  autoFilterLabel?: string | null;  // NEW — undefined or null = chip not rendered
}
```

### Destructure (no default — falsy values all suppress render)

```typescript
export function SidebarFilters({
  // ... existing destructure unchanged ...
  isAuthenticated = false,
  autoFilterLabel,          // NEW — no default
}: SidebarFiltersProps) {
```

### JSX insertion (between h2 and search Input)

```tsx
<h2 className="text-xl font-bold font-heading mb-2">Filters</h2>

{autoFilterLabel && (
  <Badge
    variant="outline"
    className="border-primary/40 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
    aria-label={`Auto-filter active: ${autoFilterLabel}`}
    role="status"
  >
    {autoFilterLabel}
  </Badge>
)}

{/* Search */}
```

### Badge import added

```typescript
import { Badge } from '@/components/ui/badge';
```

## MobileFilterSheet — Not Modified (and why)

`MobileFilterSheet` at line 35 already uses `<SidebarFilters {...props} />` where `type MobileFilterSheetProps = React.ComponentProps<typeof SidebarFilters>`. Adding `autoFilterLabel` to the `SidebarFiltersProps` interface makes it available automatically through the spread — zero changes needed. Verified with `git diff --stat src/components/catalog/mobile-filter-sheet.tsx` (no lines changed).

## Downstream Consumer: Plan 03

Plan 03 (catalog-client) must pass `autoFilterLabel` through `sidebarProps` to `SidebarFilters`. The value comes from `computeAutoFilterLabel` (Plan 01, `src/lib/auto-filter.ts`) which returns:
- `'Auto: Leader & Base'` when no leader or no base (or leader-only)
- `'Auto: Aspect filter'` when both leader and base are selected
- `null` when `isAutoFilterOverridden` is true

Plan 03 is responsible for computing the label and wiring it into the catalog-client's sidebar props.

## Acceptance Criteria — All Met

| Check | Result |
|-------|--------|
| `grep -c "autoFilterLabel" sidebar-filters.tsx` returns 5 | 5 |
| `grep -c "import { Badge }..."` returns 1 | 1 |
| `grep "autoFilterLabel?: string | null"` matches | matched |
| `grep 'variant="outline"'` matches | matched |
| `grep -F "border-primary/40 bg-primary/10 ..."` matches | matched |
| `grep 'role="status"'` matches | matched |
| `grep "Auto-filter active:"` matches | matched |
| `grep "{autoFilterLabel &&"` matches | matched |
| `npx tsc --noEmit` exits 0 | passed |
| `mobile-filter-sheet.tsx` unchanged | confirmed |
| Badge chip appears exactly once | 1 render site |

## Deviations from Plan

None — plan executed exactly as written. All four edits applied to the exact lines specified. TypeScript check passes with no new errors.

## Known Stubs

None. This component is purely presentational — it renders the string it is given. No data source is wired here; the consumer (Plan 03 catalog-client) is responsible for computing and passing `autoFilterLabel`.

## Threat Flags

None. The Badge chip renders a hardcoded string literal (`computeAutoFilterLabel` returns one of two string constants, not user input). React auto-escapes JSX children. No new network, auth, or file access paths introduced.

## Self-Check

- [x] `src/components/catalog/sidebar-filters.tsx` modified (14 insertions, 0 deletions)
- [x] Task commit `1621eab` exists in git log
- [x] `grep -c "autoFilterLabel" src/components/catalog/sidebar-filters.tsx` = 5
- [x] `npx tsc --noEmit` exits 0
- [x] `npx vitest run src/lib/auto-filter.test.ts` — 12 tests passing, 0 failing
- [x] `git diff --stat src/components/catalog/mobile-filter-sheet.tsx` — 0 lines changed

## Self-Check: PASSED
