---
phase: 11-new-home-page
plan: "03"
subsystem: ui
tags: [next.js, react, routing, typescript]

# Dependency graph
requires:
  - phase: 11-new-home-page
    plan: "01"
    provides: getTopCardsByPrice query
  - phase: 11-new-home-page
    plan: "02"
    provides: HeroSection and HighValueGrid components
provides:
  - HomePage RSC at / route replacing old CatalogPage
affects:
  - / (root route now serves new home page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RSC plain-object serialization: map Drizzle result to primitive-only object before passing to client component"

key-files:
  created: []
  modified:
    - src/app/page.tsx

key-decisions:
  - "Replaced CatalogPage entirely with HomePage RSC; no auth gate per D-06 (public page)"
  - "force-dynamic retained to prevent static prerender — page makes a live DB call"
  - "plainCards serialization map is identity projection — getTopCardsByPrice already excludes timestamp columns"

requirements-completed:
  - REQ-HOME-01
  - REQ-HOME-02
  - REQ-HOME-03

# Metrics
duration: 5min
completed: 2026-05-12
---

# Phase 11 Plan 03: Root Route Wiring Summary

**New HomePage RSC wired at / — HeroSection + HighValueGrid composed via getTopCardsByPrice(10); TypeScript clean and all 9 component tests passing; awaiting human visual verification**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-12T11:05:00Z
- **Completed:** 2026-05-12T11:10:00Z
- **Tasks:** 1 of 2 complete (Task 2 is a human-verify checkpoint — pending)
- **Files modified:** 1

## Accomplishments

- Replaced the entire content of `src/app/page.tsx` — old `CatalogPage` removed; new `HomePage` async RSC installed
- `export default async function HomePage()` calls `getTopCardsByPrice(10)`, maps results to plain objects, renders `<HeroSection />` and `<HighValueGrid cards={plainCards} />`
- `export const dynamic = 'force-dynamic'` retained to prevent static prerendering
- All auth imports removed — home page is fully public per D-06
- `npx tsc --noEmit` exits 0
- 9 home component tests (hero-section + high-value-grid) pass

## Task Commits

1. **Task 1: Replace src/app/page.tsx with new HomePage RSC** - `bc609d9` (feat)

## Files Created/Modified

- `src/app/page.tsx` — Replaced CatalogPage with HomePage RSC; 13 insertions, 37 deletions

## Decisions Made

- Replaced CatalogPage entirely with HomePage RSC — no transitional shim needed because `/cards/page.tsx` already carries the catalog
- `force-dynamic` retained — page performs a live DB call at request time
- plainCards serialization map is an identity projection — no timestamp columns to exclude

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Pre-existing DATABASE_URL test failures in unrelated suites (auth-config, cron-route, api-deck-validation, decks page, prices sync) were present before this plan and are not caused by the page.tsx change.

## Pending: Task 2 — Human Visual Verification

Task 2 is a `checkpoint:human-verify` gate. The following must be confirmed visually:

1. **Home page hero (REQ-HOME-02):** Navigate to `http://localhost:3000/` — confirm hero section with title, subtitle, and 3 CTAs; NOT the card catalog
2. **Highest Value Cards grid (REQ-HOME-03):** Confirm 10 card tiles with prices; click a tile and confirm navigation to `/cards/[SET]/[NUMBER]`; back button returns to `/`
3. **Navigation (REQ-HOME-01 + D-09, D-10):** "SWU Tracker" brand links to `/`; "Catalog" link goes to `/cards` and is active on `/cards` but not on `/`
4. **Card detail back-link (REQ-HOME-01):** From `/cards`, open any card; "Back to catalog" returns to `/cards` not `/`
5. **Responsive grid (REQ-HOME-03):** 2 cols at 375px, 3 cols at 768px, 5 cols at 1280px

## Known Stubs

None — all components are fully implemented. The Wave 0 test stubs in the DB integration suite (`getTopCardsByPrice` it.todo blocks in catalog.test.ts) require a live database and are intentionally deferred.

## Threat Surface Scan

No new threat surface beyond what was documented in the plan's threat model (T-11-06, T-11-07, T-11-08 — all accepted).

## Self-Check: PASSED

- [x] src/app/page.tsx — EXISTS and contains `export default async function HomePage`
- [x] src/app/page.tsx — does NOT contain `CatalogPage`
- [x] src/app/page.tsx — does NOT contain `getAllCards`
- [x] src/app/page.tsx — does NOT contain `import { auth }`
- [x] commit bc609d9 — FOUND
- [x] npx tsc --noEmit — exits 0
- [x] 9 component tests — all pass

---
*Phase: 11-new-home-page*
*Completed: 2026-05-12*
