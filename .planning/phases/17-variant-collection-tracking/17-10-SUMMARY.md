---
phase: 17-variant-collection-tracking
plan: "10"
subsystem: database
tags: [seed, re-seed, data-repair, gap-closure, human-verify]
dependency_graph:
  requires:
    - plan 17-09 (seed fix + data repair)
  provides:
    - DB state: 35 previously orphaned Foil rows now correctly linked
    - DB state: seed ran cleanly with 0 new orphaned rows created
  affects:
    - card_printings (DB table)
key_files:
  created: []
  modified: []
decisions:
  - "SEC-030F (Death Trooper Foil) is absent from swu-db.com API — not a code bug. Once the API adds it, next seed run will insert it via the fixed swudbId fallback."
  - "Supplementary card data source needed to address gaps in swu-db.com coverage — logged as a critical follow-up concern for future planning."
metrics:
  duration: "~15 minutes"
  completed: "2026-05-20"
---

# Phase 17 Plan 10: Re-seed + Human Verify Summary

Re-seeded the database with the fixed `upsertCards` Pass 2 logic. Verified previously-orphaned SOR Foil rows now appear correctly on card detail pages. SEC-030F absent from API (data source gap, not a code bug).

## Tasks Completed

| Task | Name | Result |
|------|------|--------|
| 1 | Re-seed database | 34 sets processed, 7,451 cards upserted, exit 0 |
| 2 | Human verification checkpoint | PASSED |

## Seed Results

- `setsProcessed`: 34 / 34 (all sets succeeded)
- `cardsUpserted`: 7,451
- `orphaned_after_seed`: **0** — seed fix working correctly, no new orphans created

## Human Verification

**Verified PASSED:**
- SOR cards with previously-orphaned Foil rows (e.g. Guardian of the Whills SOR-061, Mace Windu SOR-149, R2-D2 SOR-236) now show both Normal and Foil variant rows on the card detail page
- 35 orphaned rows from data repair are now correctly linked and visible

**Known gap:**
- SEC-030F (Death Trooper Foil) not returned by swu-db.com API — absent from card_printings
- This is a source data gap, not a code bug. Fix applies when API adds the card.
- User flagged need for supplementary data source to address swu-db.com coverage gaps

## Self-Check: PASSED

- Seed: exit 0, 34/34 sets
- No new orphaned rows post-seed
- Human verify: pass
- UAT Test 9: resolved (code and data correct; one card absent from API source)
