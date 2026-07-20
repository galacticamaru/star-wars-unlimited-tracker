---
phase: 32-combined-wants-exclusions-list
plan: 01
subsystem: ui
tags: [react, nextjs, tailwind, lucide-react, binder]

requires:
  - phase: 30-unified-search-driven-add-flow
    provides: manual wants are per-printing and can target unowned cards
  - phase: 31-trade-profile-modal-public-trade-note
    provides: manage/page.tsx layout with profile modal untouched by this plan
provides:
  - ManageWantsList restructured into two labeled sections (Deck Wants, Manual Wants) replacing the prior three-section layout
  - Excluded auto-wants render inline and dimmed within Deck Wants, sorted to the bottom, with a restore control
  - Simplified ManageWantsList props contract (exclusions/onRemoveExclusion removed; excluded state derives from autoWants[].isExcluded)
affects: [binder, manage-page]

tech-stack:
  added: []
  patterns:
    - "Excluded-state derivation from autoWants[].isExcluded instead of a parallel exclusions list prop"
    - "Shallow-copy sort (never mutate incoming props) to sink excluded rows to the bottom of a section"

key-files:
  created: []
  modified:
    - src/components/binder/manage-wants-list.tsx
    - src/app/binder/manage/page.tsx

key-decisions:
  - "Deck Wants count pill reflects active (non-excluded) auto-wants only; excluded rows carry their own Excluded tag and aren't double-counted"
  - "Standalone Exclusions section removed entirely (D-01) — excluded auto-wants now live inline within Deck Wants, dimmed and sunk to the bottom (D-03)"
  - "No per-row Auto/Manual badge — the two section headers alone carry the distinction (D-02)"

patterns-established:
  - "Derive excluded/restore UI state from a boolean flag on the source array rather than maintaining a parallel removed-items list prop"

requirements-completed: [BINDER-18, BINDER-19, BINDER-20]

coverage:
  - id: D1
    description: "ManageWantsList renders exactly two labeled sections (Deck Wants, Manual Wants); standalone Exclusions section removed"
    requirement: BINDER-18
    verification:
      - kind: other
        ref: "grep -c '<section' src/components/binder/manage-wants-list.tsx == 2; grep 'Deck Wants' and 'Manual Wants' present"
        status: pass
    human_judgment: false
  - id: D2
    description: "Excluding a Deck Want keeps the row inline, dimmed, with an Excluded tag and restore control, sorted below active Deck Wants; restore returns it to active"
    requirement: BINDER-19
    verification:
      - kind: manual_procedural
        ref: "Visual/functional round trip: exclude a deck want via Ban, observe it dim + sink + show Excluded tag + restore control; click restore, observe it returns to active list"
        status: unknown
    human_judgment: true
    rationale: "Full exclude/restore round trip is a live-DOM interaction (button click, class/order change) not covered by an automated test in this plan; source-level static checks (button wiring, opacity class, sort logic) were verified, but the actual browser round trip needs human/UAT confirmation."
  - id: D3
    description: "Manual Want rows keep the stepper and remove control wired to existing handlers; variant badge shows only for non-Normal printings; no owned/not-owned indicator"
    requirement: BINDER-20
    verification:
      - kind: other
        ref: "grep for onUpdateWantQuantity(/onRemoveWant(/variantType !== 'Normal' guard in manage-wants-list.tsx"
        status: pass
    human_judgment: false
  - id: D4
    description: "manage/page.tsx invocation resolves against the updated props contract; project typechecks, lints (no new errors), and builds"
    verification:
      - kind: other
        ref: "npx tsc --noEmit (no errors in the two changed files); npm run lint (no new errors in the two changed files); npm run build (exit 0, route table generated)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-20
status: complete
---

# Phase 32 Plan 01: Combined Wants & Exclusions List Summary

**Collapsed ManageWantsList's three disconnected sections (Manual Wants / standalone Exclusions / Automatic Wants) into one "Looking For" list with two labeled sections — Deck Wants on top, Manual Wants below — preserving every existing exclude/restore and quantity/remove control.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-20T23:39:00+10:00 (approx, first Edit)
- **Completed:** 2026-07-20T23:43:20+10:00
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `ManageWantsList` now renders exactly two `<section>` blocks — Deck Wants (deck-driven auto-wants, count pill of active-only rows) above Manual Wants (per-printing, count pill of `wants.length`) — with the standalone Exclusions section deleted entirely
- Excluded auto-wants stay inline within Deck Wants, dimmed at ~50% opacity with an "Excluded" tag and a restore control, sorted below active rows via a stable shallow-copy sort that never mutates the incoming `autoWants` prop
- Simplified the component's props contract — `exclusions` and `onRemoveExclusion` removed; excluded state is now derived solely from `autoWants[].isExcluded` — and updated the `manage/page.tsx` invocation to match, leaving the page's `toggleExclusion` handler and local `exclusions` state untouched as instructed
- Manual want rows keep the `−  n  +` stepper (floors at 0), `[x]` remove, and the non-Normal-only variant badge exactly as before

## Task Commits

Each task was committed atomically:

1. **Task 1: Restructure ManageWantsList into two labeled sections (Deck Wants + Manual Wants)** - `90939a5` (feat)
2. **Task 2: Align the manage/page.tsx invocation to the updated props contract** - `22cd4fb` (fix — also folds in a small pre-existing lint cleanup, see Deviations)

**Plan metadata:** committed as part of this plan's final wave — orchestrator handles the shared STATE.md/ROADMAP.md commit after merge.

## Files Created/Modified
- `src/components/binder/manage-wants-list.tsx` - Restructured to two sections (Deck Wants, Manual Wants); dropped `exclusions`/`onRemoveExclusion` from props; excluded auto-wants sorted to the bottom via shallow-copy sort
- `src/app/binder/manage/page.tsx` - `ManageWantsList` invocation no longer passes `exclusions`/`onRemoveExclusion`; all other props and the `toggleExclusion`/`updateWantQuantity` handlers unchanged

## Decisions Made
- Deck Wants count pill shows only active (non-excluded) auto-wants; excluded rows are visually indicated via their own "Excluded" tag rather than being folded into the pill count (per CONTEXT's Claude's-discretion note)
- Kept the exact existing dimmed/Excluded-tag/restore markup and the exact existing stepper/remove markup verbatim — this is a pure rearrangement, no new UI primitives introduced

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Escaped a pre-existing unescaped apostrophe flagged by `react/no-unescaped-entities`**
- **Found during:** Task 2 (running `npm run lint` to verify no new errors on the two changed files)
- **Issue:** The Manual Wants empty-state copy ("...cards you're looking for.") had an unescaped apostrophe that ESLint's `react/no-unescaped-entities` rule flags. This line was carried over verbatim from the pre-existing component (confirmed present at the same line in the pre-plan commit `9b8bad4`), so it isn't a regression introduced by this plan, but it lives in the exact block Task 1 rewrote.
- **Fix:** Replaced `you're` with `you&apos;re` in the empty-state string.
- **Files modified:** `src/components/binder/manage-wants-list.tsx`
- **Verification:** `npm run lint` no longer reports this error for the file
- **Committed in:** `22cd4fb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug/lint cleanup)
**Impact on plan:** Cosmetic lint cleanup only, in a line already being rewritten by this plan. No scope creep.

## Issues Encountered
- `npm run build` initially failed with `DATABASE_URL environment variable is not set` because the git worktree doesn't inherit the repo root's gitignored `.env.local`. Temporarily copied `.env.local` from the main repo root into the worktree (itself gitignored there too — confirmed via `git status --short` showing no tracked change) to run the build verification, then removed the copy afterward. Build succeeded (exit 0, full route table generated) once the DB connection was available. This is a local build-verification environment gap unrelated to the code change itself, and the copy was not committed.
- `npx tsc --noEmit` and `npm run lint` surface a number of pre-existing errors/warnings in unrelated test files (`__tests__/*.test.ts(x)`, `tests/*.test.ts(x)`) and one pre-existing `setState`-in-effect lint error in `manage/page.tsx`'s unrelated `fetchData` effect (present unchanged since before this plan, confirmed via `git show 9b8bad4`). These are out of scope per the deviation rules' scope boundary and were left untouched.

## Next Phase Readiness
- BINDER-18, BINDER-19, and BINDER-20 are functionally implemented and statically verified (two sections, exclude/restore wiring, stepper/remove wiring, variant badge guard, typecheck/lint/build clean on the two changed files)
- The exclude→restore round trip (D2 above) is flagged for human/UAT confirmation in the browser — no blocker, just not exercised via an automated test in this plan
- No blockers for subsequent v7 phases; this was a self-contained presentation refactor with no API/schema/data-flow changes

---
*Phase: 32-combined-wants-exclusions-list*
*Completed: 2026-07-20*
