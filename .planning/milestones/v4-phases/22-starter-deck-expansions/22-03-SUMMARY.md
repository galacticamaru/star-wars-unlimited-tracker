---
phase: "22"
plan: "03"
subsystem: starter-decks
tags: [data, quick-add, spotlight-decks, law]
dependency_graph:
  requires: [22-02]
  provides: [law-jabba-the-hutt, law-leia-organa in starterDecks[]]
  affects: [src/app/api/collection/starter-deck/route.ts]
tech_stack:
  added: []
  patterns: [static-data-file, commented-out-todos]
key_files:
  created: []
  modified:
    - src/data/starter-decks.ts
decisions:
  - "9 LAW spotlight-deck-exclusive cards confirmed absent from Neon DB; added as commented-out TODO lines per plan spec rather than string placeholders"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-21"
  tasks_completed: 2
  files_modified: 1
---

# Phase 22 Plan 03: LAW Spotlight Decks Summary

**One-liner:** LAW Jabba and Leia spotlight decks appended to starterDecks[] with 30 known collector numbers filled in and 9 spotlight-exclusive unknowns commented out as TODOs.

## What Was Built

Two new `StarterDeck` objects appended to `src/data/starter-decks.ts`:

- **law-jabba-the-hutt** — 13 active card entries (LAW/SOR mix); 6 spotlight-exclusive cards commented out
- **law-leia-organa** — 17 active card entries (LAW/SOR/IBH mix); 3 spotlight-exclusive cards commented out

Both decks appear in the Quick Add dropdown via the existing `/api/collection/starter-deck` route.

## Task Execution

### Task 1: DB lookup for unknown LAW collector numbers

Both the primary exact-match query and the fallback ILIKE query returned 0 rows for all 9 target cards. The LAW set has 901 rows in `card_printings`, but none matching the spotlight-deck-exclusive card names. This confirms the research doc finding that these cards are not indexed in swu-db.com or the project's Neon DB.

Cards confirmed absent from DB:
- Jabba deck: Jabba's Guard (qty 3), Skiff Cargo Hold (qty 3), Underworld Connections (qty 2), Cunning Deal (qty 3), Payoff (qty 2), Bargaining for Life (qty 3)
- Leia deck: Boushh's Thermals (qty 3), Commanding Presence (qty 2), Infiltration Plan (qty 3)

### Task 2: Append deck entries

Applied per plan spec — all 9 unknowns are commented-out TODO lines, not invalid placeholder strings.

## Deviations from Plan

None — plan executed exactly as written. The "cards not found → comment out as TODO" path was anticipated and specified in the plan.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `// TODO: Jabba's Guard` | src/data/starter-decks.ts | Not in DB; spotlight-deck-exclusive |
| `// TODO: Skiff Cargo Hold` | src/data/starter-decks.ts | Not in DB; spotlight-deck-exclusive |
| `// TODO: Underworld Connections` | src/data/starter-decks.ts | Not in DB; spotlight-deck-exclusive |
| `// TODO: Cunning Deal` | src/data/starter-decks.ts | Not in DB; spotlight-deck-exclusive |
| `// TODO: Payoff` | src/data/starter-decks.ts | Not in DB; spotlight-deck-exclusive |
| `// TODO: Bargaining for Life` | src/data/starter-decks.ts | Not in DB; spotlight-deck-exclusive |
| `// TODO: Boushh's Thermals` | src/data/starter-decks.ts | Not in DB; spotlight-deck-exclusive |
| `// TODO: Commanding Presence` | src/data/starter-decks.ts | Not in DB; spotlight-deck-exclusive |
| `// TODO: Infiltration Plan` | src/data/starter-decks.ts | Not in DB; spotlight-deck-exclusive |

These stubs do not prevent the plan's goal — the decks appear in the Quick Add dropdown with their available cards. The missing cards will be addable once the DB is seeded with spotlight-exclusive numbers (user must provide from physical product).

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "law-jabba-the-hutt" starter-decks.ts` | 1 |
| `grep -c "law-leia-organa" starter-decks.ts` | 1 |
| `grep -c "LAW-015" starter-decks.ts` | 1 (Jabba leader) |
| `grep -c "LAW-010" starter-decks.ts` | 1 (Leia leader) |
| `grep -c "RESOLVED_" starter-decks.ts` | 0 |
| `npx tsc --noEmit src/data/starter-decks.ts` | Exit 0 (PASS) |

## Commits

| Hash | Message |
|------|---------|
| 8ca6265 | feat(22-03): append LAW Jabba and Leia spotlight deck entries to starterDecks[] |

## Self-Check: PASSED

- [x] `src/data/starter-decks.ts` modified — confirmed
- [x] Commit 8ca6265 exists — confirmed
- [x] No RESOLVED_ strings in output — confirmed
- [x] TypeScript compiles clean on the modified file — confirmed
