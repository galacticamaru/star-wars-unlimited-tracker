---
phase: 18-catalog-collection-enhancements
plan: "03"
subsystem: data
tags: [starter-decks, spotlight-decks, data-file, typescript]
dependency_graph:
  requires: [18-01]
  provides: [expanded-starter-decks-data]
  affects: [src/app/api/collection/starter-deck/route.ts]
tech_stack:
  added: []
  patterns: [static-data-file, deckType-discriminant-union]
key_files:
  created: []
  modified:
    - src/data/starter-decks.ts
decisions:
  - "All 128 spotlight deck collector numbers validated against live Neon DB before commit — 0 missing"
  - "deckType discriminant added as 'starter' | 'spotlight' | 'twin-suns' for future TS26 precons"
  - "5 spotlight decks added (JTL x2, LOF x2, SEC x1); SEC Padme, LAW Jabba, LAW Leia, TS26 x4 explicitly deferred with reasons"
metrics:
  duration: ~10 minutes
  completed: "2026-05-20"
---

# Phase 18 Plan 03: Expand Starter Decks — Spotlight Decks + deckType Field Summary

**One-liner:** Added `deckType` discriminant and 5 verified Spotlight Decks (JTL Boba Fett, JTL Han Solo, LOF Darth Maul, LOF Qui-Gon Jinn, SEC Palpatine) to `starter-decks.ts` after DB pre-flight validation confirmed all 128 collector numbers exist in production.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | DB Pre-flight — Validate Spotlight Deck Collector Numbers | 222cee1 | scripts/validate-spotlight-numbers.ts |
| 2 | Expand src/data/starter-decks.ts | 8008116 | src/data/starter-decks.ts |

## What Was Built

### Task 1: DB Pre-flight Validation

Wrote and ran `scripts/validate-spotlight-numbers.ts` to query the live Neon DB for all 128 collector numbers across the 5 target spotlight decks. All 128 numbers resolved to existing `card_printings` rows — the cleanest possible outcome, meaning no cards needed to be omitted from any deck.

**Query result:** 128 checked / 128 found / 0 missing

### Task 2: Expand starter-decks.ts

Three changes applied:

1. **Interface update:** `StarterDeck` now includes `deckType: 'starter' | 'spotlight' | 'twin-suns'`. The `twin-suns` variant is reserved for TS26 precons releasing 2026-07-11.

2. **Backfill existing entries:** All 6 Two-Player Starter Decks (sor-luke, sor-vader, shd-mando, shd-gideon, twi-ahsoka, twi-grievous) received `deckType: 'starter'`.

3. **5 Spotlight Decks appended:**
   - `jtl-boba-fett` — Boba Fett – By Any Means Necessary (JTL), 25 card entries
   - `jtl-han-solo` — Han Solo – May the Odds Be Ever In Your Favor (JTL), 27 card entries
   - `lof-darth-maul` — Darth Maul (LOF), 25 card entries
   - `lof-qui-gon-jinn` — Qui-Gon Jinn (LOF), 24 card entries
   - `sec-palpatine` — Chancellor Palpatine (SEC), 28 card entries

4. **Deferred decks comment block** documents the 7 decks not yet addable and the specific reason for each deferral.

## Deviations from Plan

None — plan executed exactly as written. The DB validation query yielded 0 missing numbers, so no cards were omitted from any spotlight deck.

## Verification

- `npm run lint -- src/data/starter-decks.ts`: exit 0
- `npx tsc --noEmit`: exit 0 (no TypeScript errors)
- Deck count: 11 (6 starter + 5 spotlight) — confirmed via `grep -c "id: '" src/data/starter-decks.ts`
- deckType distribution: 6x 'starter', 5x 'spotlight' — confirmed via grep

## Known Stubs

None — all 5 spotlight decks are fully wired with verified collector numbers from the live DB.

## Self-Check: PASSED

- [x] `src/data/starter-decks.ts` exists and has 11 entries
- [x] Commit 222cee1 exists (Task 1 — validation script)
- [x] Commit 8008116 exists (Task 2 — expanded starter-decks.ts)
- [x] StarterDeck interface has deckType field
- [x] All 6 original decks have deckType: 'starter'
- [x] All 5 new decks have deckType: 'spotlight'
- [x] Deferred decks comment block present
