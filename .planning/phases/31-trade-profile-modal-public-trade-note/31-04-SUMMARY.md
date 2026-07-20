---
phase: 31-trade-profile-modal-public-trade-note
plan: 04
subsystem: ui
tags: [drizzle, react, xss-safe-rendering, public-binder, lucide-react]

# Dependency graph
requires:
  - phase: 31-trade-profile-modal-public-trade-note
    provides: "user.tradeNote nullable text column live in Neon (31-01)"
provides:
  - "getUserIdByUsername returns { id, tradeNote } | null (extended read shape for the public binder path)"
  - "PublicBinderClient renders a conditional trade-note callout under the username header"
  - "[username]/page.tsx passes profile.tradeNote from the server read straight into the client, no client fetch"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Public RSC read path stays independent of Better Auth's session API — raw Drizzle select extended with one extra column, no new query function"
    - "Conditional callout guarded on the whole element ({tradeNote && <div>...</div>}) so an empty/null value renders zero DOM nodes, matching the existing card-grid/empty-state pattern of stubbing child components in jsdom tests"

key-files:
  created:
    - src/db/queries/binder.test.ts
    - src/components/binder/public-binder-client.test.tsx
  modified:
    - src/db/queries/binder.ts
    - src/components/binder/public-binder-client.tsx
    - src/app/binder/[username]/page.tsx
    - tests/binder-flow.test.ts
    - .planning/phases/31-trade-profile-modal-public-trade-note/deferred-items.md

key-decisions:
  - "Renamed the RSC local variable from userId to profile ({ id, tradeNote }) to make the shape change self-documenting at the call site, per RESEARCH Pattern 4"
  - "Added data-testid=\"trade-note-callout\" to the callout div (not specified in the plan's code example) to make the null/empty-render-nothing assertion robust in tests without relying on brittle text-absence checks"

requirements-completed: [BINDER-17]

coverage:
  - id: D1
    description: "getUserIdByUsername returns { id, tradeNote } for a matching user, null otherwise — the public read carries the note"
    requirement: "BINDER-17"
    verification:
      - kind: unit
        ref: "src/db/queries/binder.test.ts#getUserIdByUsername() > returns { id, tradeNote } when a matching user row is found"
        status: pass
      - kind: unit
        ref: "src/db/queries/binder.test.ts#getUserIdByUsername() > returns null when no user row matches"
        status: pass
    human_judgment: false
  - id: D2
    description: "PublicBinderClient renders the trade note as a callout under the username header when tradeNote is set, and renders XSS-safe (plain text, never dangerouslySetInnerHTML)"
    requirement: "BINDER-17"
    verification:
      - kind: unit
        ref: "src/components/binder/public-binder-client.test.tsx#renders the note text inside a callout when tradeNote is set"
        status: pass
      - kind: unit
        ref: "src/components/binder/public-binder-client.test.tsx#renders the note as literal text, not parsed HTML (XSS-safe)"
        status: pass
      - kind: other
        ref: "grep -c dangerouslySetInnerHTML src/components/binder/public-binder-client.tsx -> 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "PublicBinderClient renders NO callout DOM node when tradeNote is null or empty string — no reserved space (D-07)"
    requirement: "BINDER-17"
    verification:
      - kind: unit
        ref: "src/components/binder/public-binder-client.test.tsx#renders no callout element when tradeNote is null"
        status: pass
      - kind: unit
        ref: "src/components/binder/public-binder-client.test.tsx#renders no callout element when tradeNote is an empty string"
        status: pass
    human_judgment: false
  - id: D4
    description: "[username]/page.tsx wires profile.tradeNote from the raw-Drizzle read into PublicBinderClient with no client-side fetch; notFound() still fires for unknown usernames"
    requirement: "BINDER-17"
    verification:
      - kind: other
        ref: "grep -q 'tradeNote={profile.tradeNote}' src/app/binder/[username]/page.tsx -> OK"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit — zero errors touching binder.ts, public-binder-client.tsx, or [username]/page.tsx"
        status: pass
    human_judgment: true
    rationale: "End-to-end manual verification (set a note in the profile modal from Plan 03, visit /binder/[username], confirm the callout appears; clear it, confirm it disappears with no reserved gap) requires a live Neon session and cannot be exercised by unit tests alone — deferred to phase-level UAT."

duration: 4min
completed: 2026-07-20
status: complete
---

# Phase 31 Plan 04: Public Trade Note Display Summary

**Extended `getUserIdByUsername` to carry `tradeNote` alongside `id`, and rendered it as an XSS-safe, zero-footprint-when-empty callout on the public `/binder/[username]` page — closing BINDER-17.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-20T19:44:56+10:00 (Task 1 RED commit)
- **Completed:** 2026-07-20T19:48:02+10:00 (Task 3 commit)
- **Tasks:** 3/3
- **Files modified:** 7 (2 test files created, 3 source files modified, 1 pre-existing integration test fixed, 1 deferred-items log updated)

## Accomplishments
- `getUserIdByUsername` now selects `{ id: user.id, tradeNote: user.tradeNote }` and returns the row object (or `null`), changing its return type from `number | null` to `{ id: number; tradeNote: string | null } | null` — the one call site (`[username]/page.tsx`) is fully updated, preserving the raw-Drizzle, session-API-free public read path (RESEARCH Pattern 4)
- `PublicBinderClient` renders a `MessageSquareText`-prefixed callout directly under the username header, guarded on the whole element (`{tradeNote && (...)}`) so a null/empty note produces zero DOM nodes — no reserved space, no empty box (D-06/D-07)
- The note is interpolated as plain JSX text (`{tradeNote}`) — verified by both a passing unit test (markup-like input renders as literal text, not a parsed `<strong>` element) and a file-scoped negative grep confirming no `dangerouslySetInnerHTML` anywhere in the file (T-31-01)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend getUserIdByUsername to return tradeNote** — RED `619e3c3` (test), GREEN `40c1a02` (feat)
2. **Task 2: Add the conditional trade-note callout to PublicBinderClient** — RED `9d77445` (test), GREEN `0b24384` (feat)
3. **Task 3: Wire tradeNote through the public RSC page** — `ead2bfd` (feat)

**Plan metadata:** (pending — worktree docs commit follows this summary)

_Note: Tasks 1 and 2 are `tdd="true"`, each producing a separate RED (failing test) and GREEN (implementation) commit._

## Files Created/Modified
- `src/db/queries/binder.ts` — `getUserIdByUsername` extended to select and return `tradeNote`
- `src/db/queries/binder.test.ts` — new; narrow-mock query-shape test (only mocks this function's `select().from().where().limit()` chain, per 21-REVIEW.md fragility caution)
- `src/components/binder/public-binder-client.tsx` — `tradeNote?: string | null` prop + conditional callout, `MessageSquareText` icon
- `src/components/binder/public-binder-client.test.tsx` — new; jsdom test covering render-when-set, render-nothing-when-null/empty, and XSS-safe text interpolation
- `src/app/binder/[username]/page.tsx` — local renamed `userId` → `profile`; `getPublicBinderData(profile.id)`; `tradeNote={profile.tradeNote}` passed to the client
- `tests/binder-flow.test.ts` — Rule 1 fix: updated the pre-existing integration test's mock row and assertions to match the new `{ id, tradeNote }` return shape
- `.planning/phases/31-trade-profile-modal-public-trade-note/deferred-items.md` — logged pre-existing, out-of-scope `tsc --noEmit` failures in unrelated test files

## Decisions Made
- Bundled the `tests/binder-flow.test.ts` fix into Task 1's GREEN commit rather than a separate commit — it's a direct, mechanical consequence of the same return-shape change, not independent work
- Added `data-testid="trade-note-callout"` to the callout `<div>` (not present in the plan's code example) purely to make the "no callout DOM node" test assertion explicit and robust, rather than relying on absence-of-text checks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing `tests/binder-flow.test.ts` broke on the new `getUserIdByUsername` return shape**
- **Found during:** Task 1 (`npx tsc --noEmit` check after the GREEN implementation)
- **Issue:** This existing integration test's mock row was `[{ id: userId }]` and it asserted `resolvedUserId === userId` — both incompatible with the new `{ id, tradeNote }` object return.
- **Fix:** Updated the mock row to `[{ id: userId, tradeNote: null }]`, renamed the local to `resolvedProfile`, and changed the assertion to `toEqual({ id: userId, tradeNote: null })`; downstream `getPublicBinderData` call now uses `resolvedProfile!.id`.
- **Files modified:** `tests/binder-flow.test.ts`
- **Verification:** `npx vitest run tests/binder-flow.test.ts` passes
- **Committed in:** `40c1a02` (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix was a direct, mechanical consequence of Task 1's intentional return-shape change — no scope creep, no behavior change beyond what the plan specified.

## Issues Encountered
None beyond the deviation documented above. Two out-of-scope, pre-existing `tsc --noEmit` failures (unrelated test files with no import path to this plan's files) were found during verification and logged to `deferred-items.md` rather than fixed, per the scope-boundary rule.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- BINDER-17 is fully implemented: `getUserIdByUsername` carries `tradeNote`, `PublicBinderClient` renders it XSS-safely with zero footprint when empty, and `[username]/page.tsx` wires it through with no client-side fetch
- Manual UAT step remains (per the plan's `<verification>` section): set a note via the profile modal (Plan 03), visit `/binder/[username]`, confirm the callout appears; clear it, confirm it disappears with no reserved gap — this requires a live Neon session and is deferred to phase-level UAT (see D4's `human_judgment: true` rationale above)
- This was the last plan in Wave 2; Phase 31's BINDER-17 requirement is code-complete pending that manual verification

---
*Phase: 31-trade-profile-modal-public-trade-note*
*Completed: 2026-07-20*

## Self-Check: PASSED
All created/modified files verified present on disk; all task commit hashes (619e3c3, 40c1a02, 9d77445, 0b24384, ead2bfd) verified present in git log.
