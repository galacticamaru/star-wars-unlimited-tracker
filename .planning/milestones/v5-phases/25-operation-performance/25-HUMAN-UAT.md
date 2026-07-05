---
status: partial
phase: 25-operation-performance
source: [25-VERIFICATION.md]
started: 2026-05-27T19:00:00Z
updated: 2026-05-27T19:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. CSV Import progress text
expected: Uploading a CSV file shows "Importing {N} cards..." immediately (N from PapaParse row count, set BEFORE POST fires — never shows 0)
result: [pending]

### 2. Quick Add timeout elimination
expected: Quick Add of a 1,000+ card starter deck completes in <30s without 504 timeout on Vercel + Neon
result: [pending]

### 3. Additive Quick Add semantics (live DB)
expected: Quick Adding a starter deck twice doubles variant counts — second add stacks on top of first (not overwrite)
result: [pending]

### 4. CSV 1,000-row timeout elimination
expected: CSV Import of a 1,000-row file completes without 504 timeout; user_collections totals match SUM of variants
result: [pending]

### 5. CSV overwrite semantics (live DB)
expected: Re-importing a CSV with different counts overwrites previous counts (not adds to them)
result: [pending]

### 6. Deck loading skeleton timing (≤500ms)
expected: Navigating from /decks to any /decks/[id] page shows animate-pulse skeleton immediately (≤500ms) before DeckBuilder content loads
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
