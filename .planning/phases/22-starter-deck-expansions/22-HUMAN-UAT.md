---
status: partial
phase: 22-starter-deck-expansions
source: [22-VERIFICATION.md]
started: 2026-05-21T00:00:00.000Z
updated: 2026-05-21T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Quick Add dropdown contains all 6 new decks
expected: Start dev server, open `/collection` — the Quick Add dropdown includes all 4 TS26 decks (Improvised Tactics, Aggressive Negotiations, Blood Brothers, Master and Apprentice) and both IBH decks (Leia Organa, Darth Vader)
result: [pending]

### 2. TS26 deck adds cards correctly
expected: Select "Blood Brothers (TS26)" from Quick Add, click "Add to Collection" — response shows `cardsAdded > 0` (requires TS26 cards to be seeded in the Neon DB)
result: [pending]

### 3. IBH deck adds cards correctly
expected: Select the IBH Leia starter from Quick Add, click "Add to Collection" — response shows `cardsAdded > 0` (IBH is an existing supported set — live DB confirmation)
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
