---
gsd_state_version: 1.0
milestone: v8
milestone_name: Catalog Interaction & Sync Reliability
current_phase: 34
current_phase_name: card-sync-reliability
status: executing
stopped_at: Phase 34 context gathered
last_updated: "2026-08-20T05:08:16.686Z"
last_activity: 2026-08-16
last_activity_desc: Phase 34 execution started
progress:
  total_phases: 17
  completed_phases: 0
  total_plans: 7
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-16)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus**: v8 roadmap approved — Phase 34 (Card Sync Reliability) ready to plan

## Current Position

Phase: 34 (card-sync-reliability) — EXECUTING
Plan: 1 of 7
Status: Ready to execute
Last activity: 2026-08-16 — Phase 34 execution started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1 MVP | 7 | 22 | 5 days |
| v2 Multi-User | 5 | 16 | 1 day |
| v3 Catalog & Polish | 4 | 12 | 1 day |
| v4 Deck Builder & Collection | 11 | 34 | 10 days |
| v5 Trade Binder & Performance | 4 | 14 | 4 days |
| v6 Mobile, Performance & Polish | 4 | 16 | 5 days |
| v7 Trade Binder Improvements | 4 | 10 | 15 days |
| Phase 27 P03 | 10min | 1 tasks | 2 files |
| Phase 31 P02 | 5min | 2 tasks | 2 files |
| Phase 31 P01 | 5min | 3 tasks | 6 files |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Want List | Export / share want list (WANT-03) | v8+ | v4 planning |
| Collection | SWUDB CSV import (COLLECT-05) | v8+ | v4 planning |
| Collection | CSV export (COLLECT-04 v2) | v8+ | v4 planning |
| Filters | Market price threshold filter (REQ-MARKET-05) | v8+ | v4 planning |
| Error Contract | Non-drawer optimistic write error vocabulary (UISTATE-04) | v8+ | v8 scoping (sketch wrap-up open risk 6) |
| Sync | Incremental / resumable sync, per-set checkpointing (SYNC-05) | v8+ | v8 scoping |

## Accumulated Context

### Roadmap Evolution

- Phase 25.1 inserted after Phase 25: Speed Insights Integration (URGENT)
- v6 roadmap defined 2026-05-29: Phases 26 (Mobile UX), 27 (/decks Performance), 28 (Tech Debt Sweep)
- DEBT-02 and DEBT-05 deferred out of v6 scope at the time; both now closed out in v8 (see below)
- v7 roadmap defined 2026-07-05: Phases 30–33 (Unified Add Flow, Trade Profile Modal, Combined Wants, ASH Spotlight Decks)
- **v8 roadmap defined 2026-08-16 — initial draft was Phases 34–37, 21 requirements, no research phase (design already settled by sketches 001–005):**
  - Phase 34 (Card Sync Reliability, 5 reqs: SYNC-01..04 + DEBT-05) sequenced FIRST — fully independent of the UI phases, no shared files, and fixes a live silent production failure (six weeks of catalog drift). DEBT-05's cause is disproven (LAW fully synced); folded in as a small standalone matching-bug investigation rather than its own single-requirement phase.
  - Phase 35 (Shared Variant State Foundation, 3 reqs: CATALOG-08, CATALOG-07, UISTATE-03) is the BLOCKING refactor the sketch wrap-up called out — lifts VariantCollectionSection/VariantTradeSection/VariantWantSection onto one shared state source, collapses three router.refresh() calls into one, and gives UISTATE-03's inline error map a home. Verified through the existing binder VariantTradeSheet + card detail page consumers (catalog drawer doesn't exist yet). Also fixes the pending todo (stale trade availability after collection add).
  - Original draft combined TILE-01..04, CATALOG-05/06, SELECT-01..04, and DEBT-02 into one 11-requirement Phase 36, reasoning that TILE-02's `<Link>` removal affects catalog and deck-builder tiles simultaneously (one shared component) and couldn't ship for one mode without the other's replacement interaction ready.
- **v8 roadmap REVISED 2026-08-16 per user feedback — Phase 36 was too large (11/21 requirements in one phase). Split into two, renumbering the milestone to Phases 34–38:**
  - **Phase 36 (Touch-Viable Tile Contract & Catalog Drawer, 6 reqs: TILE-01..04, CATALOG-05/06)** now owns the shared tile component change outright and ships the catalog drawer. Resolves the "can't split TILE-02" concern explicitly rather than by combining everything: this phase gives the deck-builder selector a minimal, functional off-tile add/remove stepper as an interim (not the merged bottom bar or sidebar) so deck building never breaks, even though the polished selector surface isn't built yet. This interim is an explicit success criterion and called out in the phase's Notes.
  - **Phase 37 (Touch-Viable Deck Selector, 5 reqs: SELECT-01..04, DEBT-02)** depends on Phase 36; deletes the interim stepper and replaces it with the merged ~64px mobile bottom bar + desktop sidebar controls. DEBT-02 (variant art) rides along since it touches the same tile.
  - **Phase 38 (Grid State Vocabulary, 2 reqs: UISTATE-01, UISTATE-02)** — unchanged content, renumbered from Phase 37.
  - Open risks redistributed: 1, 3, 4, 5 (corner ⓘ, long-press accessibility/cancel, useColumnCount vs estimateSize) → Phase 36; risk 2 (deck count dual-purpose) → Phase 37; risk 7 (multi-failure stacking) stayed noted in Phase 35, cross-referenced in Phase 36; UISTATE-04 out-of-scope note moved to Phase 37 (where the selector's non-drawer writes now land); "controls off tile preserves estimateSize" note stayed on Phase 36; "two mutation surfaces accepted" note moved to Phase 37 (completes the ambient-bar side of that pair).

### Key Architectural Notes for v8

- `src/components/catalog/card-item.tsx` is the shared tile component consumed by both `/cards` (catalog mode) and the deck builder's card browser (selector mode) — the reason Phase 36 owns the tile-wide `<Link>` removal for both modes, with an interim off-tile stepper covering the deck builder until Phase 37 lands the real selector redesign
- `VariantCollectionSection`, `VariantTradeSection`, `VariantWantSection` (`src/components/catalog/`) are consumed today by `variant-trade-sheet.tsx` (binder) and `/cards/[set-code]/[card-number]/page.tsx` (detail page) — Phase 35 refactors these three, Phase 36 adds the catalog drawer as a third consumer
- `src/app/api/cron/sync-cards/route.ts` exports no `maxDuration` and awaits one round trip per card definition/printing (~8,400+) — root cause of the sync timeout Phase 34 fixes
- Catalog sync state measured 2026-08-16: 33 sets, 8,404 printings, 2,596 definitions; only 3–4 sets carry a fresh cron timestamp, the rest frozen since the 2026-07-05 manual `db:seed`
- Measured tile sizes: mobile 390px → 3 cols → ~118px tile; desktop `lg` deck builder → 9 cols → ~68px tile; a stepper needs ~180px — Phase 36/37 constraint, controls never live on the tile
- No @radix-ui imports — Base UI (@base-ui/react) + shadcn/ui only, per project constraint
- Two-layer cache invalidation (`revalidateTag()` + `router.refresh()`) remains the pattern for any new mutation endpoints in v8
- Skill `sketch-findings-star-wars-unlimited-tracker` auto-loads validated tile/drawer/state patterns during UI implementation of Phases 35–38

## Session

**Last session:** 2026-08-16T02:59:40.344Z
**Stopped at:** Phase 34 context gathered
**Resume file:** .planning/phases/34-card-sync-reliability/34-CONTEXT.md

## Decisions

- [v8 roadmap]: SYNC-01..04 + DEBT-05 sequenced as Phase 34 (first) — independent, zero file overlap with UI phases, closes a live production data-drift issue
- [v8 roadmap]: CATALOG-08 + CATALOG-07 + UISTATE-03 combined into Phase 35 (Shared Variant State Foundation) as the sketch wrap-up's BLOCKING refactor, ahead of the catalog drawer
- [v8 roadmap, revised]: Original combined touch-interaction phase (11 reqs) split into Phase 36 (TILE-01..04 + CATALOG-05/06 — tile contract + catalog drawer) and Phase 37 (SELECT-01..04 + DEBT-02 — deck selector), because the phase was disproportionately large. The tile-component coupling that originally justified combining them is instead resolved explicitly: Phase 36 ships a minimal interim off-tile selector stepper so deck building isn't broken by the `<Link>` removal, and Phase 37 replaces that stepper with the full redesigned surface
- [v8 roadmap]: UISTATE-01/02 kept separate from UISTATE-03 (different concern: grid read-state vs. row write-state) as Phase 38, sequenced last

## Operator Next Steps

- Roadmap approved (Phases 34–38, 21/21 requirements mapped). Start Phase 34 with `/gsd-plan-phase 34`
