---
phase: 24-catalog-page-load-performance
plan: "06"
subsystem: catalog
tags: [catalog, virtualization, tanstack-virtual, row-overlap-fix, perf-01, perf-03]
dependency_graph:
  requires: [24-03]
  provides: [row-overlap-fix, measureElement-ref, column-aware-estimateSize]
  affects: [src/components/catalog/card-grid.tsx]
tech_stack:
  added: []
  patterns: [tanstack-virtual measureElement ref pattern, column-aware estimateSize closure]
key_files:
  created: []
  modified:
    - src/components/catalog/card-grid.tsx
    - src/components/catalog/card-grid.test.tsx
decisions:
  - "Used measureElement instance-method ref pattern (TanStack canonical) rather than explicit measureElement config option — simpler and correct per TanStack docs"
  - "Assertion in new test uses toBeGreaterThanOrEqual(100) because jsdom clientWidth=0 triggers the clamp, making the return exactly 100 (still proves non-fixed behavior)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-27"
  tasks_completed: 1
  tasks_total: 2
  files_modified: 2
---

# Phase 24 Plan 06: CardGrid Row Overlap Fix (measureElement + column-aware estimateSize) Summary

## One-liner

Fixed catalog card-grid row overlap by replacing fixed `estimateSize: () => 160` with a column-count-aware closure and attaching TanStack's `measureElement` ref to each row for DOM-measured height correction.

## What Was Built

### Task 1: Fix CardGrid row overlap with measureElement ref + column-aware estimateSize (COMMITTED: 8f12108)

**card-grid.tsx changes:**

Old estimateSize:
```ts
estimateSize: () => 160,
```

New estimateSize (column-aware, reads live container width):
```ts
estimateSize: () => {
  const containerWidth = scrollContainerRef.current?.clientWidth ?? 1280;
  return Math.max(100, Math.round(((containerWidth - 32) / columns) * 1.5));
},
```

New per-row attributes (on each `<div>` in the `getVirtualItems().map()`):
```tsx
data-index={virtualRow.index}
ref={rowVirtualizer.measureElement}
```

**card-grid.test.tsx changes:**
- All 5 existing `mockReturnValue` calls extended with `measureElement: vi.fn()` to prevent ref-attachment errors during render
- New 6th test added: `'each rendered row has data-index attribute matching its virtualRow.index, and useVirtualizer is called with a column-aware estimateSize (not fixed 160)'`

### New Test Assertions
- `container.querySelectorAll('[data-index]')` returns 3 rows
- Each row's `data-index` matches its virtualRow.index ("0", "1", "2")
- `typeof options.estimateSize === 'function'`
- `estimateSize(0) >= 100` and `estimateSize(0) !== 160`

### Test Results
```
Tests  6 passed (6)
```

## Plan 03 Invariants Verified (No Regression)

- `getScrollElement: () => scrollContainerRef.current` — preserved
- `priority={startIndex + colIndex < 22}` — preserved (first 22 cards get LCP priority)
- `key={\`${card.collectorNumber}-${mode}\`}` — preserved on each CardItem
- Outer wrapper: `position: 'relative'` + `height: ${rowVirtualizer.getTotalSize()}px` — preserved (NOT a CSS grid)
- `useColumnCount` hook — unchanged
- `overscan: 3` — unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertion adjusted for jsdom clientWidth=0**
- **Found during:** Task 1 verification
- **Issue:** The plan specified `expect(estimatedHeight).toBeGreaterThan(100)` but in jsdom `fakeRef.current.clientWidth` is 0, so `(0 - 32) / 3 * 1.5 = -16` and `Math.max(100, -16) = 100` — exactly 100, not greater than 100
- **Fix:** Changed to `toBeGreaterThanOrEqual(100)` with a comment explaining the clamp behavior. The assertion still proves the estimate is not the old fixed literal 160
- **Files modified:** src/components/catalog/card-grid.test.tsx

**2. [Rule 1 - Bug] TypeScript mock compatibility**
- **Found during:** Task 1 TS check
- **Issue:** New test initially used `vi.mocked(useVirtualizer).mockReturnValue(...)` which applies type-checking and rejected the simplified VirtualItem shape (missing `end` and `lane`, `updateDeps` method)
- **Fix:** Switched to `(useVirtualizer as ReturnType<typeof vi.fn>).mockReturnValue(...)` consistent with all existing tests in the file

## UAT Status

Task 2 (`checkpoint:human-verify`, `gate="blocking"`) is pending human verification. Auto-advance is disabled. The user must manually verify the fix in a browser at all 5 breakpoints.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check

- [x] `src/components/catalog/card-grid.tsx` modified — confirmed `8f12108`
- [x] `src/components/catalog/card-grid.test.tsx` modified — confirmed `8f12108`
- [x] 6 tests pass in card-grid.test.tsx
- [x] No new card-grid TypeScript errors introduced
- [x] Pre-existing TS errors in `__tests__/` and pre-existing test failures (DATABASE_URL) are not caused by this plan
