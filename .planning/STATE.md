---
gsd_state_version: 1.0
milestone: v4
milestone_name: Deck Builder & Collection Depth
status: complete
stopped_at: v4 milestone archived — all 11 phases (34 plans) complete and documented
last_updated: "2026-05-23T00:00:00.000Z"
last_activity: 2026-05-23 — v4 milestone shipped — PR #16 opened (feat/v4-milestone → main)
progress:
  total_phases: 11
  completed_phases: 11
  total_plans: 34
  completed_plans: 34
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-23)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus**: Planning next milestone (v5)

## Milestone v4 — COMPLETE

All 11 phases shipped:
- Phase 15–16.1: Deck builder display polish and guided onboarding
- Phase 17–17.1: Per-variant collection tracking + card sync grouping fix
- Phase 18: Catalog variant art + starter deck quick-add
- Phase 19–20: Unified variant filters + CSV variant import
- Phase 21: Per-variant trade offerings schema migration + binder badges
- Phase 22: Expanded starter/spotlight deck lists (TS26, IBH, LAW, SEC, LOF, JTL)

## Performance Metrics

**Velocity:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1 MVP | 7 | 22 | 5 days |
| v2 Multi-User | 5 | 16 | 1 day |
| v3 Catalog & Polish | 4 | 12 | 1 day |
| v4 Deck Builder & Collection | 11 | 34 | 10 days |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Want List | Export / share want list (WANT-03) | v5+ | v4 planning |
| Collection | SWUDB CSV import (COLLECT-05) | v5+ | v4 planning |
| Collection | CSV export (COLLECT-04 v2) | v5+ | v4 planning |
| Filters | Market price threshold filter (REQ-MARKET-05) | v5+ | v4 planning |
| Tech Debt | CollectionControls dead code deletion | v5+ | v4 close |
| Tech Debt | DeckBuilder Add Cards tab variant art (getPrintingArtMap) | v5+ | v4 close |
| Tech Debt | Prestige Foil in VARIANT_OPTIONS + Serialized in VARIANT_PRECEDENCE | v5+ | v4 close |
| Tech Debt | Catalog state not invalidated after card detail mutation | v5+ | v4 close |
| Tech Debt | LAW spotlight deck 9 unknown cards (commented TODOs in starter-decks.ts) | v5+ | v4 close |
