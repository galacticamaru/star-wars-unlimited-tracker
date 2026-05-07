---
status: complete
phase: 05-want-list
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md]
started: 2026-05-07T00:00:00Z
updated: 2026-05-07T00:01:00Z
---

## Current Test

## Current Test

[testing complete]

## Tests

### 1. NavBar appears on every page
expected: Navigate to /, /collection, and /decks. A persistent navigation bar should appear at the top of each page with links for Catalog, Collection, and Decks. It should be sticky (stays visible when scrolling).
result: pass

### 2. NavBar active link highlighting
expected: Visit each page (/, /collection, /decks). The link matching the current page should appear visually distinct — bold text and a primary-color border/underline. The other two links should appear in their inactive style.
result: pass

### 3. Want List tab in Deck Builder
expected: Open any deck in the Deck Builder. A "Want List" tab should appear in the toolbar alongside the other deck sections. Clicking it should switch the view to the want list.
result: pass

### 4. NEED / OWN / SHORT chips on want list cards
expected: In the Want List tab of a deck that has cards you don't fully own, each card tile should show three stat chips below it: NEED (quantity required by the deck), OWN (how many you have), and SHORT (how many you still need). Cards should also have a red border/glow.
result: issue
reported: "yes but the styling is very small and cards and chips overlap on each other when there are multiple cards"
severity: major

### 5. Cards grouped by type in Want List tab
expected: In the Want List tab, cards should be grouped by type in this order: Leader → Base → Unit → Event → Upgrade. Each group should be clearly separated or labeled.
result: pass

### 6. Want List empty states
expected: Open a deck that is empty (no cards). The Want List tab should show an "Empty Deck" message rather than an empty grid. If you open a deck where you own all required cards, it should show an "All Cards Owned" message.
result: pass

### 7. "What I Need to Buy" section on /decks dashboard
expected: Go to /decks. If you have at least one deck and are missing cards, a "What I Need to Buy" section should appear below the deck list. It should show an aggregated view of all cards you need across all your decks, grouped by type.
result: pass

### 8. Combined want list section hidden when no shortfall
expected: On /decks, if you fully own all cards needed by all your decks (or have no decks), the "What I Need to Buy" section should not be visible at all — no empty container, no heading.
result: pass

### 9. Summary line on /decks combined want list
expected: In the "What I Need to Buy" section on /decks, there should be a summary line reading something like "X cards needed, Y total copies short" that gives an at-a-glance count.
result: pass

## Summary

total: 9
passed: 8
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Each card tile in want-list mode shows NEED/OWN/SHORT chips below the card image with no overlap"
  status: fixed
  reason: "User reported: yes but the styling is very small and cards and chips overlap on each other when there are multiple cards"
  severity: major
  test: 4
  root_cause: "Grid used up to 9 columns inside the Deck Builder panel — too dense for chips to fit below each card without overlapping"
  fix: "Reduced max columns (3→6 in WantListTab, 3→8 on /decks), added flex-wrap + whitespace-nowrap to chips, bumped chip font from 9px to 10px"
  fix_commit: "c926500"
