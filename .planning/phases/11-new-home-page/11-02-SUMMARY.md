---
phase: 11-new-home-page
plan: "02"
subsystem: ui
tags: [next.js, react, vitest, tailwind, typescript]

# Dependency graph
requires:
  - phase: 11-new-home-page
    plan: "01"
    provides: Wave 0 test stubs for HeroSection and HighValueGrid
provides:
  - HeroSection RSC component at src/components/home/hero-section.tsx
  - HighValueGrid client component + CardPriceTile at src/components/home/high-value-grid.tsx
  - Updated NavBar with /cards Catalog href and brand Link to /
  - 9 passing vitest tests replacing Wave 0 stubs
affects:
  - 11-03 (HomePage RSC imports HeroSection and HighValueGrid)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "buttonVariants on Link: base-ui Button has no asChild — use buttonVariants({ variant, size }) as className on <Link>"
    - "CardPriceTile: same next/image loading pattern as CardItem — relative+aspect+overflow-hidden, fill, onLoad/onError"
    - "Collector number parsing: collectorNumber.indexOf('-') slice to extract card number from format SOR-059"

key-files:
  created:
    - src/components/home/hero-section.tsx
    - src/components/home/high-value-grid.tsx
  modified:
    - src/components/home/hero-section.test.tsx
    - src/components/home/high-value-grid.test.tsx
    - src/components/nav-bar.tsx

key-decisions:
  - "Used buttonVariants on Link instead of Button asChild — base-ui Button lacks asChild prop (Radix pattern); buttonVariants is the established codebase pattern per binder/manage/page.tsx"
  - "HeroSection is pure RSC (no hooks) — no 'use client' directive needed"
  - "CardPriceTile inlined in high-value-grid.tsx — no separate file needed for this plan"

requirements-completed:
  - REQ-HOME-02
  - REQ-HOME-03

# Metrics
duration: 9min
completed: 2026-05-12
---

# Phase 11 Plan 02: UI Components Summary

**HeroSection, HighValueGrid, and CardPriceTile built; NavBar updated with /cards Catalog link and brand home link; all 9 component tests passing**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-05-12T01:00:00Z
- **Completed:** 2026-05-12T01:05:53Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- Created `src/components/home/hero-section.tsx` — pure RSC with locked D-01 title, D-02 subtitle, and D-04 CTAs using `buttonVariants` on `<Link>` elements
- Created `src/components/home/high-value-grid.tsx` — `'use client'` component with `CardPriceTile` subcomponent; replicates `CardItem` next/image loading pattern; responsive grid `grid-cols-2 sm:grid-cols-3 md:grid-cols-5`
- Implemented `src/components/home/hero-section.test.tsx` — converted 5 Wave 0 `test.todo` stubs to passing assertions
- Implemented `src/components/home/high-value-grid.test.tsx` — converted 4 Wave 0 `test.todo` stubs to passing assertions (note: 5th stub "img alt" was not needed per plan's 4-test target)
- Updated `src/components/nav-bar.tsx` — changed `NAV_LINKS[0].href` from `'/'` to `'/cards'` (D-10); replaced brand `<span>` with `<Link href="/">` with `hover:opacity-80 transition-opacity` (D-09); `isActive` logic unchanged (D-11)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build HeroSection and HighValueGrid components + implement test cases** - `9ccd528` (feat)
2. **Task 2: Update NavBar — Catalog href and brand link** - `73568b9` (feat)

## Files Created/Modified

- `src/components/home/hero-section.tsx` - New RSC: locked hero copy, three CTA links via buttonVariants
- `src/components/home/high-value-grid.tsx` - New client component: CardPriceTile with image/price/link; HighValueGrid responsive grid
- `src/components/home/hero-section.test.tsx` - Wave 0 stubs replaced with 5 passing tests
- `src/components/home/high-value-grid.test.tsx` - Wave 0 stubs replaced with 4 passing tests
- `src/components/nav-bar.tsx` - NAV_LINKS[0].href '/cards'; brand Link href='/'

## Decisions Made

- `buttonVariants` used on `<Link>` instead of `<Button asChild>` — this project uses base-ui Button (not Radix) which does not expose `asChild`. The established codebase pattern (seen in `binder/manage/page.tsx`) is `<Link className={cn(buttonVariants({ variant, size }))}>`.
- HeroSection remains a pure RSC — no `useState` or effects needed.
- `CardPriceTile` inlined in `high-value-grid.tsx` per plan instructions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] HeroSection: replaced Button asChild with buttonVariants on Link**
- **Found during:** Task 1 — TypeScript check after creating hero-section.tsx
- **Issue:** Plan specified `<Button asChild size="lg"><Link>...</Link></Button>` but this project's Button component (base-ui, not Radix) does not accept the `asChild` prop; TS2322 type errors on all 3 CTAs
- **Fix:** Replaced with `<Link href="..." className={cn(buttonVariants({ size: 'lg' }))}>` — the existing codebase pattern for button-styled links (e.g., `binder/manage/page.tsx` line 163)
- **Files modified:** `src/components/home/hero-section.tsx`, `src/components/home/hero-section.test.tsx`
- **Commit:** `9ccd528`

## Issues Encountered

None beyond the auto-fixed asChild incompatibility above.

## Known Stubs

None — all components are fully implemented. The 5th Wave 0 stub in high-value-grid.test.tsx ("CardPriceTile renders img with alt equal to card name") was not required by the plan's 4-test target; it remains as `test.todo` in the worktree shadow copy but was not carried forward in the new implementation.

## Threat Surface Scan

No new threat surface introduced:
- HeroSection: hardcoded href values only — no user input (T-11-03: accepted)
- CardPriceTile: href from DB-stored setCode/collectorNumber — no user-controlled URLs (T-11-04: accepted)
- next/image: DB-stored CDN URLs only (T-11-05: accepted)
- NavBar: hardcoded string literals for all hrefs

## User Setup Required

None.

## Next Phase Readiness

- `HeroSection` and `HighValueGrid` are exported and ready for Plan 03's HomePage RSC to import
- NavBar Catalog link routes to `/cards`; brand name navigates to `/`
- All 9 component tests pass; `npx tsc --noEmit` exits 0

## Self-Check: PASSED

- [x] src/components/home/hero-section.tsx — EXISTS
- [x] src/components/home/high-value-grid.tsx — EXISTS
- [x] src/components/nav-bar.tsx — EXISTS
- [x] .planning/phases/11-new-home-page/11-02-SUMMARY.md — EXISTS
- [x] commit 9ccd528 — FOUND
- [x] commit 73568b9 — FOUND

---
*Phase: 11-new-home-page*
*Completed: 2026-05-12*
