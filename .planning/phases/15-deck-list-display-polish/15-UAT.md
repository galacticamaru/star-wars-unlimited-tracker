---
status: complete
phase: 15-deck-list-display-polish
source: [15-01-SUMMARY.md, 15-02-SUMMARY.md, 15-03-SUMMARY.md]
started: 2026-05-14T00:00:00.000Z
updated: 2026-05-14T00:00:00.000Z
---

## Current Test

[testing complete]

## Tests

### 1. Type-grouped Deck List sections
expected: Open a deck with a mix of cards, switch to the Deck List tab. You should see separate labeled sections — "Ground Units (N)", "Space Units (N)", "Upgrades (N)", "Events (N)" — each with its own header showing the total quantity for that group. Sections with zero cards in the current deck should not appear at all. The old flat "Main Deck (N)" single heading should be gone.
result: pass

### 2. Leader card art display and Remove overlay
expected: With a leader selected, the leader slot in the Deck List tab shows the card's full art in a landscape-shaped frame. Hovering over the art reveals a dark overlay with a "Remove" button. Clicking Remove clears the leader and reverts the slot to "No Leader Selected" placeholder.
result: pass

### 3. Base card art display and Remove overlay
expected: With a base selected, the base slot shows the card's full art. Hovering reveals a "Remove" overlay identical to the leader slot. Clicking Remove clears the base.
result: pass

### 4. Desktop hover art preview panel
expected: On desktop, hover over any main-deck card row. A card art image should appear in a narrow panel to the LEFT of the card list. Moving the mouse away from the row should make the panel go blank.
result: pass

### 5. Sideboard card hover preview
expected: On desktop, hover over a card in the Sideboard section. The same left-side art preview panel should show that card's art — same behavior as main-deck rows.
result: pass

### 6. Mobile tap art preview bar
expected: On a mobile viewport (or devtools mobile mode), tap any card row. A fixed bar should appear at the bottom of the screen with a small thumbnail of the card's art and the card's name. Tapping a different card row should update the bar to that card.
result: pass

### 7. Aspects panel in deck sidebar
expected: In the right-side stats sidebar, scroll down past the Types and Arenas panels. You should see an "Aspects" panel listing each non-Basic aspect name with its count, sorted from highest to lowest. "Basic" should never appear in this list. For a deck with no non-Basic aspects (e.g., only Basic cards), the panel should be completely absent.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
