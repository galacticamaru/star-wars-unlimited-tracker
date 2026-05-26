---
status: resolved
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
result: pass — art displays correctly. Leader slot aspect ratio fixed (aspect-[3/4] → aspect-[4/3]) after initial frame was portrait instead of landscape.

### 2. Hover Overlay Remove Button
expected: Hovering over a filled leader/base art slot reveals a dark overlay with a "Remove" button. Clicking Remove reverts the slot to the placeholder and the leader/base is cleared.
result: pass

### 3. Desktop Hover Art Preview Panel
expected: Hovering over any non-Leader/Base card row shows that card's art in a panel to the left of the card list (desktop only, hidden on mobile). Moving mouse away empties the panel.
result: pass

### 4. Mobile Fixed Bottom Bar
expected: On a touch device (or mobile viewport), tapping a card row shows a fixed bottom bar with the card's art thumbnail and name. The bar appears on tap and can be cleared by tapping another row.
result: pass

### 5. Aspects Panel with Real Deck Data
expected: In the deck sidebar, an "Aspects" panel appears showing non-Basic aspect names with their counts, sorted from highest to lowest. "Basic" is never listed. The panel is absent when the deck has no non-Basic aspects.
result: pass

## Summary

total: 5
passed: 5
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- Leader slot aspect ratio: was `aspect-[3/4]` (portrait/unit-side shape); fixed to `aspect-[4/3]` (landscape for leader-side art). Fixed in commit 488dd41.
- Sideboard hover handlers: sideboard card rows were missing hover handlers; fixed to match main-deck rows. Fixed in commit 488dd41.
