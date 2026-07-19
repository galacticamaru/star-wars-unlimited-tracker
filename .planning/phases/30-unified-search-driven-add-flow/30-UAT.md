---
status: testing
phase: 30-unified-search-driven-add-flow
source: [30-VERIFICATION.md]
started: 2026-07-19T01:21:17Z
updated: 2026-07-19T01:21:17Z
---

## Current Test

number: 1
name: Fetch-timing / retry invariant on Manage Binder search
expected: |
  Load /binder/manage. The Network tab shows NO /api/cards/all or
  /api/collection/owned-cards request on page load. Type a 1-character then a
  2-character search term; the catalog + owned-cards pair fires exactly once
  (on the 2-char keystroke), not on every keystroke. Force an error (go offline),
  confirm the error + Retry state renders; click Retry and confirm exactly one
  more paired fetch fires (not a duplicate), and it does not re-fire on ordinary
  subsequent keystrokes.
awaiting: user response

## Tests

### 1. Fetch-timing / retry invariant
expected: On /binder/manage, no catalog/owned-cards fetch on mount; the catalog + owned-cards pair fires exactly once on the first 2-character keystroke; after forcing an error, Retry re-fires exactly once (no duplicate) and does not re-fire on later keystrokes.
result: [pending]

### 2. Unowned-variant sheet gating (visual)
expected: Search for and select a card the current user does NOT own. In the opened variant sheet, the "Add to trade binder" stepper is visibly disabled with a clear reason (e.g. "You don't own this variant"), while the "Add as want" stepper remains fully usable for the same variant. Disabled styling reads as informational, not destructive.
result: [pending]

### 3. Search card state machine (visual)
expected: Exercise the "Add Cards & Wants" card's full state machine in the browser — the pre-gate hint (<2 chars typed), the loading spinner during fetch, the "No cards found" empty state for a non-matching term, and the "Showing top 20 matches" cap note for a broad search term. Each state renders correctly.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
