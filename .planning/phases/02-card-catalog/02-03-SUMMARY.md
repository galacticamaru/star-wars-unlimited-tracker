---
phase: 02-card-catalog
plan: 03
subsystem: ui
tags: [next.js, react, server-component, dynamic-route, next-image]

# Dependency graph
requires:
  - phase: 02-card-catalog
    plan: 01
    provides: getCardByPrinting() query, remotePatterns next.config.ts
  - phase: 02-card-catalog
    plan: 02
    provides: CardItem link pattern /cards/{setCode}/{cardNumber}, buttonVariants
provides:
  - src/app/cards/[set-code]/[card-number]/page.tsx — Server Component detail page for a single card
affects:
  - Phase 3+ — users can view card details before any collection features are added

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Next.js 16 async params — Promise<{...}> must be awaited before destructuring
    - preload prop replaces deprecated priority prop on next/image (Next.js 16)
    - buttonVariants applied to Link directly (no asChild) — established pattern from Wave 2
    - Server Component detail page — no 'use client', no onLoad/onError on Image

key-files:
  created:
    - src/app/cards/[set-code]/[card-number]/page.tsx

key-decisions:
  - "buttonVariants applied to Link directly — base-ui Button has no asChild prop (same fix as Wave 2 filter-dropdown Rule 1 deviation)"
  - "preload prop used for LCP image (replaces deprecated priority in Next.js 16, confirmed in image.md)"
  - "No 'use client' — Server Component renders all metadata server-side; no placeholder animation needed (single card, image loads fast)"
  - "Grey div fallback for null frontArtUrl — consistent with D-02 placeholder color (bg-muted)"
  - "Merged main into worktree branch before execution — worktree was missing Wave 1+2 outputs (Rule 3 deviation)"

patterns-established:
  - "Pattern: buttonVariants + cn() applied to next/link directly when base-ui asChild not available"
  - "Pattern: Server Component detail page — await params, getCardByPrinting, notFound(), render all metadata"

requirements-completed:
  - CATALOG-01

# Metrics
duration: 2min
completed: 2026-05-05
---

# Phase 2 Plan 03: Card Detail Page Summary

**Server Component detail page at /cards/[set-code]/[card-number] — awaits async params, queries single card via getCardByPrinting, renders 320px image + full metadata panel side by side**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-05T12:05:26Z
- **Completed:** 2026-05-05T12:07:30Z
- **Tasks:** 1 (Task 2 is checkpoint:human-verify, stopping here)
- **Files modified:** 1

## Accomplishments
- Created `src/app/cards/[set-code]/[card-number]/page.tsx` as a Server Component
- Awaits `params` as `Promise<{ 'set-code': string; 'card-number': string }>` (Next.js 16 breaking change)
- Calls `getCardByPrinting(setCode, cardNumber)` and returns `notFound()` for unknown cards
- Renders side-by-side layout: 320px fixed image column + flex-1 metadata column
- All 9 metadata fields rendered per UI-SPEC.md §Card Detail Page: name, subtitle, type/arenas/aspects chips, traits/keywords, cost/power/hp stat chips, front text, back text (double-sided), epic action (Leader), set/collector/rarity/artist footer
- `preload` prop on LCP image (replaces deprecated `priority` per Next.js 16 image.md)
- Grey `bg-muted` div fallback for null `frontArtUrl` (D-02)
- Back button using `buttonVariants` classes applied directly to `<Link>` (base-ui no-asChild pattern)

## Task Commits

Each task was committed atomically:

1. **Task 1: Card detail page** - `3c0a754` (feat)

## Files Created/Modified
- `src/app/cards/[set-code]/[card-number]/page.tsx` — Server Component detail page

## Decisions Made
- `buttonVariants` applied directly to `<Link>` for back button — base-ui `ButtonPrimitive` has no `asChild` prop. This is consistent with the established Wave 2 pattern (Rule 1 fix in filter-dropdown.tsx).
- `preload` prop used (not `priority`) — `priority` is deprecated in Next.js 16 per `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`. `preload={true}` is the correct replacement for LCP images.
- No `'use client'` — Server Component renders all metadata server-side. No onLoad/onError needed on the single detail-page image (grey div fallback handles null frontArtUrl).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Merged main branch before execution to get Wave 1+2 outputs**
- **Found during:** Pre-execution file check
- **Issue:** Worktree branch was created from commit `4d88ccc` (before Wave 1+2 outputs were merged to main). Files (`src/components/ui/button.tsx`, `src/db/queries/card-detail.ts`, etc.) were absent from the worktree.
- **Fix:** `git merge main --no-edit` (fast-forward merge, no conflicts) to bring all Wave 1+2 outputs into the worktree.
- **Files modified:** 45 files via merge
- **Verification:** Wave 1+2 files confirmed present after merge
- **Committed in:** (merge commit, already part of branch history)

**2. [Rule 1 - Bug] Used buttonVariants on Link instead of Button asChild**
- **Found during:** Task 1 (implementation — applying Wave 2 established pattern)
- **Issue:** Plan specified `<Button variant="ghost" asChild>` wrapping `<Link>`. base-ui `ButtonPrimitive` does not support `asChild` — this was already established as Rule 1 fix in Wave 2 (`filter-dropdown.tsx`).
- **Fix:** Applied `buttonVariants({ variant: 'ghost' })` classes directly to the `<Link>` component via `cn()` — same pattern as filter-dropdown.tsx.
- **Files modified:** `src/app/cards/[set-code]/[card-number]/page.tsx`
- **Verification:** TypeScript compilation clean (Compiled successfully + Finished TypeScript)
- **Committed in:** 3c0a754

---

**Total deviations:** 2 auto-fixed (1 Rule 3 - Blocking, 1 Rule 1 - Bug)
**Impact on plan:** Both auto-fixes necessary. No scope change.

## Issues Encountered
- Pre-existing `npm run build` failure: DATABASE_URL not set causes runtime error at "Collecting page data" step for the cron route. TypeScript compilation passes cleanly (`Compiled successfully` + `Finished TypeScript`). Pre-existing issue documented in Wave 1 and Wave 2 SUMMARYs, out of scope for this plan.

## User Setup Required
None — no external service configuration required. The dev server needs `DATABASE_URL` in `.env.local` for the catalog/detail pages to load real data (set up in Phase 1).

## Next Phase Readiness
- Checkpoint Task 2: Human verification at http://localhost:3000 — click card → detail page renders
- Phase 2 complete when checkpoint approved

## Known Stubs
None — all metadata fields fully wired to `getCardByPrinting()` return type. Grey div fallback for null `frontArtUrl` is the correct D-02 implementation, not a stub.

## Threat Flags

No new threat surface beyond what is documented in the plan's threat_model:
- T-2-05: URL params → DB query — getCardByPrinting uses Drizzle parameterized queries (mitigated)
- T-2-06: frontArtUrl → next/image — remotePatterns restricts to cdn.swu-db.com (Wave 1, mitigated)
- T-2-07: card metadata XSS — all values rendered as React text nodes, no dangerouslySetInnerHTML (accepted)
- T-2-08: DATABASE_URL exposure — Server Component only, never in client bundle (mitigated)

## Self-Check: PASSED

File `src/app/cards/[set-code]/[card-number]/page.tsx` verified present on disk.
Commit `3c0a754` confirmed in git log.
TypeScript compilation: PASSED (Compiled successfully + Finished TypeScript in 3.1s).
Test suite: PASSED (19 passed, 20 todo).

---
*Phase: 02-card-catalog*
*Completed: 2026-05-05*
