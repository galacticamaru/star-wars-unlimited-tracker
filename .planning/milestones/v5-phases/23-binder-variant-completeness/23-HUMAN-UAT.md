---
status: complete
phase: 23-binder-variant-completeness
source: [23-VERIFICATION.md]
started: 2026-05-26T05:00:00Z
updated: 2026-05-26T12:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Looking For Variant Badges (BINDER-07)
expected: Non-Normal manual-want tiles show a badge top-left (e.g. 'FOIL' in black/70 background); Normal manual-wants and auto-wants show no badge
result: pass

### 2. Card Detail Trade Section (BINDER-08)
expected: Section labeled 'AVAILABLE FOR TRADE' with per-printing +/- controls appears when logged in; invisible when logged out
result: pass

### 3. VariantTradeSection Optimistic Update (BINDER-08)
expected: Clicking + increments count immediately; refreshing the page shows persisted value from DB
result: pass

### 4. Manage Binder Owned-Card Grid (BINDER-09)
expected: Cards with userCollections.count = 0 do not appear; only collection cards are shown
result: pass

### 5. VariantTradeSheet Sheet Interaction (BINDER-09)
expected: Sheet slides in from right, lists only printings where ownedCount > 0 with +/- controls; zero-quantity rows stay visible
result: pass

### 6. ManualWantsAddFlow Chip Select + POST (BINDER-07)
expected: Selecting a card then a variant chip and clicking 'Add Want' fires POST /api/binder/wants with cardPrintingId; new want appears in the list with variant badge
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
