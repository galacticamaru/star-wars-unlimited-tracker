---
status: partial
phase: 09-Sideboard
source: [09-VERIFICATION.md]
started: 2026-05-11T00:00:00Z
updated: 2026-05-11T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Card quantity-1 move to sideboard
expected: Click "Move to SB" on a main deck card at quantity 1. Card disappears from the main list and appears in the sideboard section with quantity 1.
result: [pending]

### 2. Sideboard full (10) disables button
expected: Fill sideboard to exactly 10 cards. All "Move to SB" buttons become visually disabled AND the sidebar shows the validation error "Sideboard cannot exceed 10 cards".
result: [pending]

### 3. Empty sideboard shows no amber bars
expected: Open a deck with no sideboard. Cost curve shows only slate bars. Legend below the chart reads a slate swatch "Main" and amber swatch "Sideboard". No amber bars rendered.
result: [pending]

### 4. Stacked bars flush with no gap
expected: Move cards of different costs to sideboard. Amber bar sits flush on top of the slate bar (no gap between them). Cost columns with only main deck cards show only slate; columns with only sideboard cards show only amber.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
