---
status: partial
phase: 15-deck-list-display-polish
source: [15-VERIFICATION.md]
started: 2026-05-14T00:00:00.000Z
updated: 2026-05-14T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Leader and Base Card Art Display
expected: When a leader card is selected, the leader slot shows the card's full art image (not text). Same for base. When frontArtUrl is null, the text placeholder renders instead of a broken image.
result: [pending]

### 2. Hover Overlay Remove Button
expected: Hovering over a filled leader/base art slot reveals a dark overlay with a "Remove" button. Clicking Remove reverts the slot to the placeholder and the leader/base is cleared.
result: [pending]

### 3. Desktop Hover Art Preview Panel
expected: Hovering over any non-Leader/Base card row shows that card's art in a panel to the left of the card list (desktop only, hidden on mobile). Moving mouse away empties the panel.
result: [pending]

### 4. Mobile Fixed Bottom Bar
expected: On a touch device (or mobile viewport), tapping a card row shows a fixed bottom bar with the card's art thumbnail and name. The bar appears on tap and can be cleared by tapping another row.
result: [pending]

### 5. Aspects Panel with Real Deck Data
expected: In the deck sidebar, an "Aspects" panel appears showing non-Basic aspect names with their counts, sorted from highest to lowest. "Basic" is never listed. The panel is absent when the deck has no non-Basic aspects.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
