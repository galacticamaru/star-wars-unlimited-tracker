---
phase: 31-trade-profile-modal-public-trade-note
plan: 03
subsystem: ui
tags: [dialog, react, better-auth, binder]

# Dependency graph
requires:
  - phase: 31-trade-profile-modal-public-trade-note
    plan: "01"
    provides: "user.tradeNote nullable text column + typed authClient.updateUser({ tradeNote })"
  - phase: 31-trade-profile-modal-public-trade-note
    plan: "02"
    provides: "Dialog and Textarea primitives (src/components/ui/dialog.tsx, src/components/ui/textarea.tsx)"
provides:
  - "ProfileModal component (src/components/binder/profile-modal.tsx) — username + trade-note editing behind a Dialog"
  - "Manage Binder page header 'Trade Profile' button that opens ProfileModal; inline Trade Profile Card removed"
affects: [31-04-public-trade-note-display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Modal-owned form state re-seeds from props via useEffect keyed on `open`, rather than the page owning the field state (moves the dirty-check + seeding logic into the modal itself)"

key-files:
  created:
    - src/components/binder/profile-modal.tsx
    - src/components/binder/profile-modal.test.tsx
  modified:
    - src/app/binder/manage/page.tsx

key-decisions:
  - "Header 'Trade Profile' button is a plain <button> styled with buttonVariants({ variant: 'outline' }) directly (matching the sibling 'View Public Binder' Link's pattern), not the Button component with a variant prop — avoids applying buttonVariants twice"
  - "Save button disabled-state assertions in tests check the native `.disabled` boolean property directly rather than a jest-dom `toBeDisabled()` matcher, since this repo has no jest-dom setup (confirmed via grep across existing *.test.tsx files, none use jest-dom matchers)"

patterns-established:
  - "Trade-profile write path stays a single authClient.updateUser({ username, displayUsername, tradeNote }) call — no new /api route (D-10)"

requirements-completed: [BINDER-15, BINDER-16]

coverage:
  - id: D1
    description: "ProfileModal renders username Input seeded from currentUsername, the public-URL helper text, and a trade-note Textarea (140-char cap, live counter) seeded from currentTradeNote"
    requirement: "BINDER-15"
    verification:
      - kind: unit
        ref: "npx vitest run src/components/binder/profile-modal.test.tsx (seeding + counter tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Save calls authClient.updateUser with { username: lowercased+trimmed, displayUsername: trimmed, tradeNote: trimmed } in one request; empty note sends tradeNote: ''"
    requirement: "BINDER-16"
    verification:
      - kind: unit
        ref: "npx vitest run src/components/binder/profile-modal.test.tsx (Save call + empty-note tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Save is disabled when neither field changed or while saving; failure keeps modal open with inline error copy, success calls onOpenChange(false)"
    requirement: "BINDER-16"
    verification:
      - kind: unit
        ref: "npx vitest run src/components/binder/profile-modal.test.tsx (disabled-state + error/success tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Manage Binder page: inline Trade Profile Card removed, header 'Trade Profile' button (UserCog icon) added before 'View Public Binder' link, ProfileModal mounted"
    requirement: "BINDER-15"
    verification:
      - kind: other
        ref: "grep -c handleUpdateUsername src/app/binder/manage/page.tsx == 0; grep ProfileModal and UserCog both present"
        status: pass
      - kind: unit
        ref: "npx tsc --noEmit — no errors attributable to manage/page.tsx or profile-modal.tsx"
        status: pass
    human_judgment: true

# Metrics
duration: 3min
completed: 2026-07-20
status: complete
---

# Phase 31 Plan 03: Trade Profile Modal & Manage Page Wiring Summary

**`ProfileModal` composes the Plan 02 Dialog/Textarea primitives into a single Save Profile flow (username + ≤140-char trade note via one `authClient.updateUser` call), and the Manage Binder page now opens it from a header button instead of a permanent inline Card.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-20T19:45:28+10:00 (Task 1 RED commit)
- **Completed:** 2026-07-20T19:46:54+10:00 (Task 2 commit)
- **Tasks:** 2/2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- Built `ProfileModal` (`src/components/binder/profile-modal.tsx`) on the Plan 02 `Dialog`/`Textarea` primitives: username `Input` + public-URL helper text + trade-note `Textarea` with a 140-char clamp (`.slice(0,140)` + native `maxLength`) and a live `{length}/140` counter
- Single Save Profile button persists both fields in one `authClient.updateUser({ username, displayUsername, tradeNote })` call (D-08/D-09); an empty textarea saves `tradeNote: ''` to clear the note (D-05); Save is disabled while saving or when neither field changed from its seeded value
- Fields re-seed from `currentUsername`/`currentTradeNote` props on every `open` transition (not just once on mount), via a `useEffect` keyed on `open`
- On `updateUser` error the modal stays open with inline error copy and preserved field values; on success it closes via `onOpenChange(false)`
- Deleted the Manage Binder page's inline "Trade Profile" `Card` entirely (no placeholder/empty column) along with `handleUpdateUsername`, `isUpdatingUsername`, and the page-level `username` state/effect it required
- Added a header "Trade Profile" button (`UserCog` icon, `buttonVariants({ variant: "outline" })`) before the existing "View Public Binder" link, unconditionally rendered so a user with no username yet can still open the modal; mounted `ProfileModal` wired to `profileOpen` state and `session.user`

## Task Commits

Each task was committed atomically (TDD RED/GREEN for Task 1):

1. **Task 1: Build the ProfileModal with tests**
   - RED: `a65da43` (test) — failing test suite written against the not-yet-existing `ProfileModal`, confirmed to fail on import before any implementation existed
   - GREEN: `a340421` (feat) — `ProfileModal` implementation, all 8 tests passing
2. **Task 2: Rework the Manage Binder header and mount the modal** - `9785a43` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/components/binder/profile-modal.tsx` - `ProfileModal` component: Dialog shell, username Input, public-URL helper, trade-note Textarea + counter, inline error text, single Save Profile button with the D-08/D-09 save handler
- `src/components/binder/profile-modal.test.tsx` - 8 behavior tests covering seeding, 140-char clamp + live counter, the single `updateUser` call shape, empty-note clearing, disabled-state (unchanged / in-flight), and error/success outcomes — mocks `@/lib/auth-client`
- `src/app/binder/manage/page.tsx` - Removed the inline Trade Profile Card, `handleUpdateUsername`, `isUpdatingUsername`, and the username-seeding `useEffect`; added the header "Trade Profile" button + `profileOpen` state + mounted `ProfileModal`

## Decisions Made
- Rendered the real `Dialog`/`DialogContent`/`Textarea`/`Input`/`Button` components in the test (no mocking of the `@/components/ui/*` primitives) — Base UI's `@base-ui/react/dialog` Portal-based rendering works correctly under the project's `jsdom` vitest environment with no additional setup, so the test exercises the actual composed DOM rather than stubs
- Header button is a plain `<button className={cn(buttonVariants({ variant: "outline" }))}>` (mirroring how the "View Public Binder" `Link` is already styled) rather than `<Button variant="outline">`, to avoid double-applying `buttonVariants`
- Test assertions for the Save button's disabled state read the native `.disabled` boolean directly instead of a `toBeDisabled()` jest-dom matcher, since this repo has no `@testing-library/jest-dom` setup (confirmed by grep — no existing `*.test.tsx` file uses jest-dom matchers)

## Deviations from Plan

None - plan executed exactly as written. The TDD RED/GREEN gate was followed literally: the test file was committed first and verified to fail (import error against the not-yet-existing component) before the implementation commit landed.

## Issues Encountered

Two `toBeDisabled()` assertions initially failed with `Invalid Chai property: toBeDisabled` because this repo has no jest-dom matcher setup wired into vitest. Rule 1 (bug) fix: rewrote both assertions to check `(button as HTMLButtonElement).disabled` directly, matching the pattern already implied by how other tests in this repo check DOM state without jest-dom. Verified: all 8 tests pass after the fix. This was fixed within the same RED→GREEN cycle before either commit landed, so it required no separate commit.

Pre-existing, unrelated `tsc --noEmit` errors exist in `__tests__/api-deck-validation.test.ts` and `__tests__/collection-page.test.tsx` (missing Jest types, unrelated Next.js param typing) — confirmed out of scope via grep against the full `tsc` output returning no matches for `manage/page.tsx` or `profile-modal.tsx`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `ProfileModal` and the Manage Binder page wiring are complete; BINDER-15 (profile behind a modal) and the write half of BINDER-16 (setting the note) are both delivered
- Plan 04 (public trade-note display) can proceed independently — it only needs `getUserIdByUsername` extended to select `tradeNote` (already typed and live per Plan 01) and a conditional callout block in `public-binder-client.tsx`; no dependency on this plan's UI beyond the already-shipped write path
- No blockers

---
*Phase: 31-trade-profile-modal-public-trade-note*
*Completed: 2026-07-20*

## Self-Check: PASSED
All created/modified files verified present on disk; all task commit hashes (a65da43, a340421, 9785a43) verified present in git log.
