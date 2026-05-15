---
status: partial
phase: 16-empty-deck-guided-onboarding
source: [16-VERIFICATION.md]
started: 2026-05-15T11:35:00.000Z
updated: 2026-05-15T11:35:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Empty deck → auto-filter to Leader & Base
expected: Opening the card browser tab on a new empty deck automatically pre-filters to show only Leader and Base card types. A chip reading "Auto: Leader & Base" appears below the Filters heading.
result: [pending]

### 2. Leader selected (no base) → filter stays on Leader & Base
expected: After selecting a leader but before selecting a base, the filter remains on Leader+Base card types and the chip label stays "Auto: Leader & Base".
result: [pending]

### 3. Both leader and base selected → switches to aspect filter
expected: Once both a leader and base are selected, the filter switches to show cards matching the combined aspects of that leader+base pair. The chip label reads "Auto: Aspect filter".
result: [pending]

### 4. Manual filter toggle → override mode
expected: When the user manually changes the type or aspect filter, the auto-filter chip disappears and the custom filter remains in effect (no reversion).
result: [pending]

### 5. Remove leader or base → override resets, auto-filter re-applies
expected: Removing a leader or base resets the override flag and re-applies the appropriate auto-filter (back to Leader+Base if either is now missing).
result: [pending]

### 6. Empty deck CTA reads "Add Cards"
expected: The call-to-action button shown when a deck has no cards in the list tab reads "Add Cards" (not "Switch to Catalog").
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
