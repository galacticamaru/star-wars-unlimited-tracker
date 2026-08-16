---
phase: 34-card-sync-reliability
plan: 05
subsystem: api
tags: [nextjs, drizzle, vitest, react, collection]

# Dependency graph
requires:
  - phase: 34-card-sync-reliability
    provides: 34-01's printings-link fix (referenced conceptually; this plan's data gap is disproven/independent per DEBT-05 note in ROADMAP)
provides:
  - "POST /api/collection/starter-deck now returns cardsRequested and skipped alongside cardsAdded"
  - "Collection page renders a distinct partial-add banner naming the shortfall"
affects: [collection, starter-deck-quick-add]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive API response contract: new fields appended, existing field name/meaning/position preserved for old consumers"
    - "Reused existing amber warning treatment (text-amber-600/bg-amber-50, from deck-sidebar.tsx) for a non-error, non-full-success banner state"

key-files:
  created:
    - __tests__/starter-deck-route.test.ts
  modified:
    - src/app/api/collection/starter-deck/route.ts
    - src/app/collection/page.tsx
    - src/app/collection/page.test.tsx

key-decisions:
  - "Partial-add response stays a 200, not a 500 or 4xx — the work that succeeded genuinely succeeded; the shortfall is carried in the body"
  - "Partial-add banner uses an amber warning treatment (not the red error banner, not the green success banner) — the add did happen, so calling it a failure would be dishonest in the opposite direction"
  - "Only skipped.length is rendered on the page, never the raw collector-number strings — keeps the mitigation in T-34-26 (React default escaping, no dangerouslySetInnerHTML) trivially true by construction"

patterns-established:
  - "Silent-skip-to-reported-skip: when a per-item resolution loop can't find a match, push the identifier onto a returned array instead of `continue`-ing past it invisibly"

requirements-completed: [DEBT-05]

coverage:
  - id: D1
    description: "POST /api/collection/starter-deck reports every unresolved collector number in a skipped[] array and a cardsRequested total, while still adding everything that does resolve"
    requirement: "DEBT-05"
    verification:
      - kind: unit
        ref: "__tests__/starter-deck-route.test.ts#returns skipped: [] and cardsAdded === cardsRequested when every collector number resolves"
        status: pass
      - kind: unit
        ref: "__tests__/starter-deck-route.test.ts#reports the exact skipped collector numbers when two of three are missing"
        status: pass
      - kind: unit
        ref: "__tests__/starter-deck-route.test.ts#returns cardsAdded: 0 with a fully populated skipped array and status 200 when nothing resolves"
        status: pass
      - kind: unit
        ref: "__tests__/starter-deck-route.test.ts#calls batchIncrementVariantCounts with only the resolved printing ids"
        status: pass
    human_judgment: false
  - id: D2
    description: "Collection page success banner shows 'Added N of M cards from {deck} — K unavailable.' when skipped is non-empty, and keeps the original full-success wording when it's empty"
    requirement: "DEBT-05"
    verification:
      - kind: automated_ui
        ref: "src/app/collection/page.test.tsx#Quick Add partial-success status renders \"Added N of M cards from {deckName} — K unavailable.\" when some cards are skipped"
        status: pass
      - kind: automated_ui
        ref: "src/app/collection/page.test.tsx#Quick Add success status renders \"Added {N} cards from {deckName} to your collection.\" after success"
        status: pass
    human_judgment: false
  - id: D3
    description: "A real user running quick-add on a deck with an unresolvable card sees the shortfall in the UI rather than a plain success banner"
    requirement: "DEBT-05"
    verification: []
    human_judgment: true
    rationale: "Declared verification: backstop in the plan's must_haves — end-to-end user-visible copy against a deliberately unresolvable collector number, only observable manually per 34-VALIDATION.md's Manual-Only Verifications table"

duration: 4min
completed: 2026-08-16
status: complete
---

# Phase 34 Plan 05: Report Quick-Add Shortfall Summary

**`POST /api/collection/starter-deck` now names every collector number it couldn't add via `cardsRequested`/`skipped`, and the collection page's success banner switches to an amber "Added N of M — K unavailable" variant instead of a flat green success message when that happens.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-08-16T18:04:00+10:00 (approx, first task commit)
- **Completed:** 2026-08-16T18:05:39+10:00
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified — see below)

## Accomplishments
- Removed the silent `continue` on an unresolved collector number in the quick-add loop; it now pushes the number onto a returned `skipped: string[]` array while still adding every card that does resolve
- Added `cardsRequested` (sum of `card.qty` across the whole deck) to the response so the client can express "N of M" without re-deriving it
- Added `__tests__/starter-deck-route.test.ts` covering full-resolve, two-of-three-skipped, all-skipped (still 200, not 500), and that `batchIncrementVariantCounts` only receives resolved items — plus preserved 401/400 coverage
- Widened `deckResult` state on the collection page and added a second banner variant (amber, `AlertCircle`) for the partial case, leaving the existing green full-success banner and the red error banner both untouched
- Extended `page.test.tsx`'s existing success test to the new response shape and added a partial-success test plus a no-"unavailable"-on-full-success assertion

## Task Commits

Each task was committed atomically:

1. **Task 1: Report the skipped collector numbers from the quick-add route** - `d21cb1d` (feat)
2. **Task 2: Surface the shortfall in the collection page's success banner** - `c6933fa` (feat)

**Plan metadata:** (this commit, following SUMMARY.md write)

## Files Created/Modified
- `src/app/api/collection/starter-deck/route.ts` - Loop now pushes unresolved collector numbers to `skipped[]` instead of `continue`; accumulates `cardsRequested`; response adds `cardsRequested` and `skipped` alongside the unchanged `cardsAdded`
- `__tests__/starter-deck-route.test.ts` - New route test; mocks `@/lib/auth`, `next/headers`, `@/db`, `@/db/queries/collection`, `@/data/starter-decks` following the pattern in `__tests__/api-deck-validation.test.ts`
- `src/app/collection/page.tsx` - `deckResult` state widened with `cardsRequested`/`skipped` (defaulted to `[]`); success banner split into two conditional renders keyed on `skipped.length`
- `src/app/collection/page.test.tsx` - Existing success test's mock extended to the new response shape; added partial-success test and a full-success "no unavailable text" assertion

## Decisions Made
- Reused the codebase's existing amber warning pattern (`text-amber-600 bg-amber-50 border-amber-100`, seen in `src/components/decks/deck-sidebar.tsx:113`) for the partial-add banner rather than inventing new styling, since the sketch-findings skill's state vocabulary (`catalog-drawer-and-states.md`) covers the catalog drawer's `idle/loading/empty/error` states and this single collection-page banner tweak doesn't map onto that grid-state component — no direct precedent existed there, so the nearest in-repo warning convention was used instead
- Kept the partial-add response status at 200 per the plan's explicit instruction — the shortfall lives in the body, not the status code

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria and verify commands passed without needing an auto-fix.

## Issues Encountered

None. `npx tsc --noEmit` and `npx eslint` were clean for every file this plan touches. The full `npx vitest run` failing-file set (`__tests__/api-deck-validation.test.ts`, `__tests__/collection-page.test.tsx`, `__tests__/cron-route.test.ts`, `src/lib/sync/prices.test.ts`, `tests/auth-config.test.ts`, `tests/binder-queries.test.ts`, `tests/catalog-variant.test.ts`, `tests/data-isolation.test.ts`) is byte-identical to the 8-file baseline recorded in `34-VALIDATION.md` — no new regressions introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- DEBT-05's user-facing half is complete: the response contract and the banner copy both name the shortfall
- The `verification: backstop` truth ("a real user running quick-add on a deck with an unresolvable card sees the shortfall in the UI") remains a manual check per `34-VALIDATION.md`'s Manual-Only Verifications table — not blocking, but flagged for `/gsd-verify-work`
- No blockers for downstream Phase 34 plans; this plan's files (`starter-deck/route.ts`, `collection/page.tsx`) are not touched by any other wave-2 plan per the phase's file-overlap analysis

---
*Phase: 34-card-sync-reliability*
*Completed: 2026-08-16*

## Self-Check: PASSED

- FOUND: src/app/api/collection/starter-deck/route.ts
- FOUND: __tests__/starter-deck-route.test.ts
- FOUND: src/app/collection/page.tsx
- FOUND: src/app/collection/page.test.tsx
- FOUND: commit d21cb1d
- FOUND: commit c6933fa
- FOUND: commit b24e48d
