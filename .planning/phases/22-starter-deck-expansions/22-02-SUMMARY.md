---
phase: "22"
plan: "02"
subsystem: "data"
tags: ["starter-decks", "IBH", "SEC", "spotlight", "quick-add"]
dependency_graph:
  requires:
    - "22-01"
  provides:
    - "ibh-leia-rebel entry in starterDecks[]"
    - "ibh-vader-imperial entry in starterDecks[]"
    - "sec-padme-amidala entry in starterDecks[]"
  affects:
    - "src/app/api/collection/starter-deck/route.ts (reads starterDecks[])"
    - "Quick Add dropdown on /collection"
tech_stack:
  added: []
  patterns:
    - "Static data file with StarterDeck[] shape"
    - "IBH unique-collector-number convention (qty: 1 for all entries)"
key_files:
  modified:
    - "src/data/starter-decks.ts"
decisions:
  - "IBH qty: 1 for all entries — each IBH-NNN is a distinct physical card copy in the product"
  - "SEC Padmé uses standard multi-copy qtys (1x/2x/3x) per card"
metrics:
  duration: "< 5 minutes"
  completed: "2026-05-21"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 22 Plan 02: IBH Starter Decks and SEC Padmé Amidala Spotlight Summary

Appended two IBH preconstructed starter deck entries and the SEC Padmé Amidala spotlight deck entry to `starterDecks[]` in `src/data/starter-decks.ts`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Append IBH starter decks and SEC Padmé spotlight | d8b09c0 | src/data/starter-decks.ts |

## What Was Built

Three new `StarterDeck` objects were appended to the `starterDecks[]` array:

1. **ibh-leia-rebel** — "Leia Organa – Get to Your Transports! (IBH Starter)" — 52 cards, all `qty: 1`, `setCode: 'IBH'`, `deckType: 'starter'`
2. **ibh-vader-imperial** — "Darth Vader – Don't Fail Me Again (IBH Starter)" — 52 cards, all `qty: 1`, `setCode: 'IBH'`, `deckType: 'starter'`
3. **sec-padme-amidala** — "Padmé Amidala (SEC Spotlight)" — 30 cards with standard 1x/2x/3x quantities, `setCode: 'SEC'`, `deckType: 'spotlight'`

Both IBH decks use `qty: 1` on every entry because each IBH-NNN collector number represents a distinct physical card copy in the preconstructed product. This is intentional and correct — the Quick Add API upserts each entry independently.

## Acceptance Criteria Verification

- `grep -c "ibh-leia-rebel"` → 1 ✓
- `grep -c "ibh-vader-imperial"` → 1 ✓
- `grep -c "sec-padme-amidala"` → 1 ✓
- `grep -c "IBH-001"` → 1 ✓
- `grep -c "IBH-053"` → 1 ✓
- `grep -c "SEC-016"` → 1 ✓
- `grep -c "SEC-256"` → 1 ✓
- `npx tsc --noEmit` — zero new errors introduced; only pre-existing `__tests__/` errors (confirmed pre-existing via git stash baseline comparison) ✓

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all three deck entries are fully wired data.

## Threat Flags

No new security-relevant surface introduced. The file is static data consumed by the existing Quick Add API route; no new endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- File exists: `src/data/starter-decks.ts` ✓
- Commit exists: d8b09c0 ✓
- `ibh-leia-rebel` present: 1 occurrence ✓
- `ibh-vader-imperial` present: 1 occurrence ✓
- `sec-padme-amidala` present: 1 occurrence ✓
- File ends with `];` ✓
