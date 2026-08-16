---
phase: 32-combined-wants-exclusions-list
reviewed: 2026-07-20T13:55:45Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/app/binder/manage/page.tsx
  - src/components/binder/manage-wants-list.tsx
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 32: Code Review Report

**Reviewed:** 2026-07-20T13:55:45Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

This phase refactored `ManageWantsList` into two labeled sections ("Deck Wants" +
"Manual Wants"), removed the standalone "Exclusions" section, and dropped the
`exclusions` / `onRemoveExclusion` props from the component and its call site in
`page.tsx`. The presentation change itself is clean: `autoWants` are sorted with a
non-mutating shallow copy, the excluded/active render branches are preserved from the
old "Automatic Wants" section, keys are unique per list, and all imported icons remain
in use. The JSX apostrophe escape fix is correct.

The one substantive concern is a behavioral regression: removing the Exclusions
section eliminates the only UI surface for a subset of exclusion records. To ground
this I traced the data source in `src/db/queries/trade.ts` — `exclusions` and
`autoWants` are populated from independent queries, and they can legitimately diverge.
Two lower-severity cleanup items round out the review (dead client state and a
count/empty-state mismatch).

## Warnings

### WR-01: Orphaned exclusions become invisible and unmanageable after removing the Exclusions section

**File:** `src/components/binder/manage-wants-list.tsx:43-171` (removal of the Exclusions section); `src/app/binder/manage/page.tsx:483-489` (dropped `exclusions`/`onRemoveExclusion` props)

**Issue:** The new UI can only display and un-exclude a card if that card appears in
`autoWants`. But `autoWants` and the exclusion records are sourced independently
(`src/db/queries/trade.ts`):

- `exclusions` is `SELECT ... FROM tradeExclusions WHERE userId = ...` — every
  exclusion row the user has (lines 26-34).
- `autoWants` is built from `autoWantsRaw`, which only includes cards where
  `shortfall > 0` for a **current** deck (lines 118-130), and `isExcluded` is set by
  intersecting with `exclusionsSet` (line 163).

An exclusion whose card is no longer a current deck-want-with-shortfall — e.g. the
user removed the deck that generated the want, or acquired enough copies so
`shortfall === 0` — exists in `tradeExclusions` but is absent from `autoWants`.
Because exclusions can only be toggled from the "Deck Wants" list, such an exclusion
now renders nowhere and can never be removed through the UI. Previously the standalone
"Exclusions" section (driven by the full `exclusions` array) surfaced exactly these
records so the user could restore them. This is a functional regression, not just a
visual one: the exclusion silently persists server-side and continues to hide the card
from the public binder with no way to reverse it.

**Fix:** Keep a way to surface exclusions that have no matching active auto-want.
Options: (a) render any `exclusions` entry whose `cardDefinitionId` is not present in
`autoWants` as an additional excluded row inside the "Deck Wants" section, or (b)
retain a compact "Exclusions" subsection scoped to only those orphaned entries. If the
product intent is that exclusions should be auto-pruned when their deck-want
disappears, that cleanup must happen server-side (delete the `tradeExclusions` row when
the shortfall resolves) — otherwise stale rows accumulate unreachably. Confirm which
behavior is intended before shipping.

## Info

### IN-01: `tradeData.exclusions` client state is now written but never read

**File:** `src/app/binder/manage/page.tsx:305-333`

**Issue:** After the Exclusions section was removed, nothing renders
`tradeData.exclusions`. `toggleExclusion` still optimistically maintains that array
(lines 310 and 324), and the `Exclusion` interface (lines 39-43) plus the `exclusions`
field on `TradeData` (line 56) exist solely to support those now-dead writes. The
`autoWants[].isExcluded` optimistic update in the same function is what actually drives
the UI, so the `exclusions` bookkeeping is dead code. This isn't a correctness bug
(the server is the source of truth and a refetch would reconcile), but it is
misleading maintenance surface. Note this interacts with WR-01: if you adopt fix (a)/(b)
there, the `exclusions` array becomes live again and should be kept.

**Fix:** If WR-01 is resolved by re-surfacing orphaned exclusions, keep this state and
wire it to the render. If instead exclusions are pruned server-side, remove the dead
`exclusions` optimistic updates, the `Exclusion` interface, and the `exclusions` field
from `TradeData` to avoid drift.

### IN-02: "Deck Wants" badge can show 0 while the section still lists items

**File:** `src/components/binder/manage-wants-list.tsx:41-56`

**Issue:** The badge uses `activeAutoWantCount` (non-excluded only, line 41) while the
empty-state guard uses `autoWants.length === 0` (line 52). When every deck want is
excluded, the header reads "Deck Wants 0" but the grid still renders the excluded rows
below it. The count and the visible content disagree, which reads as a glitch.

**Fix:** Either append the excluded count to the badge (e.g. `0 · 3 excluded`) or add a
short qualifier so a zero active count above a populated list is self-explanatory. Low
priority / cosmetic.

---

_Reviewed: 2026-07-20T13:55:45Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
