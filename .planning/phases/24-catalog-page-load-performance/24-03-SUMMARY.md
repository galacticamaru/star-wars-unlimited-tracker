---
phase: 24-catalog-page-load-performance
plan: 03
subsystem: catalog/virtualization
tags: [catalog, virtualization, tanstack-virtual, image-priority, perf-01, perf-03]
dependency_graph:
  requires: [24-01, 24-02]
  provides: [virtualized-card-grid, image-priority-threading, scrollContainerRef-wiring]
  affects: [catalog-client, card-grid, card-item, public-binder-client]
tech_stack:
  added:
    - "@tanstack/react-virtual@^3.13.26"
  patterns:
    - "useVirtualizer row virtualization with breakpoint-aware column count"
    - "matchMedia-based responsive hook (useColumnCount)"
    - "scrollContainerRef prop threading from parent to virtualizer"
    - "Image priority threshold: index < 22 gets priority=true"
key_files:
  created: []
  modified:
    - path: "package.json"
      change: "Added @tanstack/react-virtual ^3.13.26 to dependencies"
    - path: "package-lock.json"
      change: "Lockfile updated with @tanstack/react-virtual and @tanstack/virtual-core"
    - path: "src/components/catalog/card-item.tsx"
      change: "Added priority?: boolean prop (default false), forwarded to <Image priority={priority}>"
    - path: "src/components/catalog/card-grid.tsx"
      change: "Full refactor: 'use client', useColumnCount hook, useVirtualizer, position:relative outer, position:absolute rows, priority threading"
    - path: "src/components/catalog/catalog-client.tsx"
      change: "Added useRef import, scrollContainerRef = useRef<HTMLElement>(null), ref={scrollContainerRef} on <main>, scrollContainerRef prop passed to CardGrid"
    - path: "src/components/catalog/card-grid.test.tsx"
      change: "Converted 5 it.todo stubs to real GREEN test assertions; added matchMedia and useVirtualizer mocks"
    - path: "src/components/binder/public-binder-client.tsx"
      change: "Added useRef import and scrollContainerRef to both CardGrid invocations (Rule 3 fix — required prop)"
decisions:
  - "Used window.matchMedia with 4 listeners for breakpoint-aware columns; SSR-safe initial value of 3"
  - "estimateSize: () => 160 as a reasonable initial estimate per RESEARCH.md recommendation (virtualizer self-corrects after first render)"
  - "Used data-priority HTML attribute in test mock (not priority attribute) to avoid TypeScript non-standard HTML attribute error"
  - "public-binder-client.tsx shares a single scrollContainerRef for both CardGrid instances within the same <main> container — both grids scroll together as sections within the same main scroll container"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-26"
  tasks_completed: 2
  files_modified: 7
---

# Phase 24 Plan 03: CardGrid Virtualization + Image Priority Summary

**One-liner:** `useVirtualizer` row virtualization with breakpoint-aware column count (3/5/7/9/11) and `priority={index < 22}` image threading via `@tanstack/react-virtual@3.13.26`.

## New Package Installed

| Package | Version | Install Method |
|---------|---------|----------------|
| `@tanstack/react-virtual` | `^3.13.26` | `npm install @tanstack/react-virtual --strict-ssl=false` (SSL workaround per RESEARCH.md) |

The `--use-system-ca` flag mentioned in RESEARCH.md was not recognized by this npm version; `--strict-ssl=false` was the working workaround.

## Files Modified

| File | Change |
|------|--------|
| `package.json` | Added `@tanstack/react-virtual: ^3.13.26` to dependencies |
| `package-lock.json` | Updated with new package + `@tanstack/virtual-core` transitive dep |
| `src/components/catalog/card-item.tsx` | Added `priority?: boolean` prop; forwarded to `<Image priority={priority}>` |
| `src/components/catalog/card-grid.tsx` | Full refactor: `'use client'`, `useColumnCount` hook, `useVirtualizer`, virtualized row rendering |
| `src/components/catalog/catalog-client.tsx` | Added `useRef`, `scrollContainerRef`, `ref` on `<main>`, `scrollContainerRef` prop to `<CardGrid>` |
| `src/components/catalog/card-grid.test.tsx` | Converted 5 `it.todo` stubs to real assertions; added `window.matchMedia` + `useVirtualizer` mocks |
| `src/components/binder/public-binder-client.tsx` | Added `scrollContainerRef` to both `CardGrid` invocations (required prop fix) |

## Pitfall 5 Self-Check: Outer Wrapper Is NOT a CSS Grid

Confirmed. The outer wrapper returned by `CardGrid` uses:
```
style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
className="px-4 py-4"
```

No `grid`, `grid-cols-*`, or `display: grid` on the outer wrapper. The responsive column layout has been moved to each virtual row's inline style:
```
style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '0.5rem', ... }}
```

The old flat `grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11` classes were removed from the outer div entirely.

## CardItem Key Prop Preservation

Confirmed. The key prop on each `CardItem` still uses:
```
key={`${card.collectorNumber}-${mode}`}
```
Not array index — React reconciliation is preserved when cards filter in/out.

## Test Command Outputs

### Task 1: card-item tests
```
Before change: 7 passed (7)
After priority prop added: 7 passed (7)
```

### Task 2: card-grid tests
```
Before (Wave 0 stubs): 5 todo (0 tests ran)
After implementation: 5 passed (5)
```

### Combined run:
```
npm test -- --run src/components/catalog/card-grid.test.tsx src/components/catalog/card-item.test.tsx
→ 2 test files passed, 12 tests passed (12)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] public-binder-client.tsx missing required scrollContainerRef prop**
- **Found during:** TypeScript check after Task 2 implementation
- **Issue:** `CardGridProps.scrollContainerRef` became required (not optional), but `public-binder-client.tsx` had two `<CardGrid>` invocations without the new prop — TypeScript error TS2741
- **Fix:** Added `useRef<HTMLElement>(null)` in `PublicBinderClient`, attached `ref={scrollContainerRef}` to the existing `<main>` scroll container, passed `scrollContainerRef={scrollContainerRef}` to both `CardGrid` invocations
- **Files modified:** `src/components/binder/public-binder-client.tsx`
- **Commit:** f99c1f9

**2. [Rule 1 - Bug] window.matchMedia not available in jsdom test environment**
- **Found during:** Task 2 test execution (RED phase)
- **Issue:** `useColumnCount` hook calls `window.matchMedia` in a `useEffect`, which throws in jsdom (`TypeError: window.matchMedia is not a function`)
- **Fix:** Added `Object.defineProperty(window, 'matchMedia', ...)` mock in the test file's `beforeEach`, which returns a stub MediaQueryList with `matches: false` and no-op event listeners
- **Files modified:** `src/components/catalog/card-grid.test.tsx`
- **Commit:** f99c1f9

**3. [Rule 1 - Bug] npm install --use-system-ca flag unrecognized**
- **Found during:** Task 1 installation
- **Issue:** RESEARCH.md documented `--use-system-ca` as the SSL workaround but the installed npm version reports `Unknown cli config "--use-system-ca"` and still fails with the cert error
- **Fix:** Used `--strict-ssl=false` which successfully bypassed the SSL certificate verification
- **Files modified:** None (npm configuration only)

**4. [Rule 2 - TypeScript] Test mock used non-standard HTML attribute `priority`**
- **Found during:** TypeScript check after test implementation
- **Issue:** The `next/image` mock in the test passed `priority={priority ? 'true' : undefined}` directly to `<img>`, causing TypeScript error TS2322 (`Property 'priority' does not exist on type 'DetailedHTMLProps<ImgHTMLAttributes<...>>'`)
- **Fix:** Changed to `data-priority={priority ? 'true' : undefined}` (standard HTML data attribute) and updated test assertions to use `getAttribute('data-priority')`
- **Files modified:** `src/components/catalog/card-grid.test.tsx`
- **Commit:** f99c1f9

**5. [Rule 1 - Bug] makeCards test helper missing required CardForFilter fields**
- **Found during:** TypeScript check after test implementation  
- **Issue:** The initial `makeCards` factory function was missing `subtitle`, `arenas`, `frontText`, `backText`, `epicAction`, `doubleSided`, `unique`, `priceEur`, `priceUsd` fields required by `CardForFilter`
- **Fix:** Added all missing required fields with appropriate null/false/[] values
- **Files modified:** `src/components/catalog/card-grid.test.tsx`
- **Commit:** f99c1f9

## Known Stubs

None — all implementation is complete. `useVirtualizer` integrates with the real scroll container ref; `useColumnCount` responds to real `matchMedia` breakpoints in the browser.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| (none) | — | No new network endpoints, auth paths, file access patterns, or schema changes introduced |

## Self-Check: PASSED

- package.json has `@tanstack/react-virtual` dependency: FOUND
- node_modules/@tanstack/react-virtual exists: FOUND
- card-item.tsx has `priority?: boolean`: FOUND
- card-grid.tsx has `'use client'`, `useVirtualizer`, `useColumnCount`, `matchMedia`, `scrollContainerRef`, `startIndex + colIndex < 22`, `position: 'relative'`, `position: 'absolute'`: ALL FOUND
- card-grid.tsx does NOT have `grid-cols-3 sm:grid-cols-5...` on outer wrapper: CONFIRMED (only in comment)
- catalog-client.tsx has `useRef<HTMLElement>(null)`, `ref={scrollContainerRef}`, `scrollContainerRef={scrollContainerRef}`: ALL FOUND
- card-grid.test.tsx has 0 `it.todo`: CONFIRMED
- card-grid.test.tsx has `vi.mock('@tanstack/react-virtual')`: FOUND
- Commits exist: 21d1f4e (Task 1), f99c1f9 (Task 2): CONFIRMED
- TypeScript `npx tsc --noEmit` exits 0 (excluding pre-existing __tests__/ errors): CONFIRMED
- `npm test -- --run card-grid.test.tsx card-item.test.tsx` exits 0 with 12 tests: CONFIRMED
