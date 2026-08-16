# Requirements: Star Wars Unlimited Tracker — v8

**Defined:** 2026-08-16
**Milestone:** v8 Catalog Interaction & Sync Reliability
**Core Value:** See exactly which cards you own while building decks, and know instantly what you're missing.

## v8 Requirements

Requirements for this milestone. Each maps to exactly one roadmap phase.

### Tile Interaction Contract

The tile shows art and reports state — nothing else. One contract at every breakpoint;
only the container changes. Settled by sketches 001–003.

- [ ] **TILE-01**: Card tile renders art and state indicators only — no mutation controls appear on the tile at any breakpoint
- [ ] **TILE-02**: Tapping a card tile selects it rather than navigating — the tile-wide link is removed at every breakpoint, so a mistap no longer costs the user their grid position
- [ ] **TILE-03**: User can open a card's detail page from the grid via a dedicated focusable affordance, so detail pages stay reachable and shareable
- [ ] **TILE-04**: Every interactive target in the card grid and its control surfaces is at least 44px

### Catalog Drawer

Ports the binder's `VariantTradeSheet` pattern to catalog tiles, removing the
detail-page round trip per card.

- [ ] **CATALOG-05**: Tapping a catalog card tile opens a variant drawer showing that card's collection, trade, and want sections
- [ ] **CATALOG-06**: User can adjust owned, trade-offer, and want quantities for any variant from the drawer without leaving the catalog
- [ ] **CATALOG-07**: Adjusting a card's owned count in the drawer immediately makes that card available to offer for trade — without a page reload
- [ ] **CATALOG-08**: The drawer's collection, trade, and want sections read from one shared state source, so a change in one is reflected in the others while the drawer is open

### Deck Selector

The deck builder's tile serves a different job — 50 cards a session, so speed
beats depth. Inline controls, redesigned for touch.

- [ ] **SELECT-01**: User can add and remove cards from a deck using controls that are always visible — no hover dependency on any device
- [ ] **SELECT-02**: On mobile, the selected card's add/remove controls and the deck count share one merged bottom bar
- [ ] **SELECT-03**: On desktop, the selected card's add/remove controls appear in the existing sidebar above the deck stats
- [ ] **SELECT-04**: The deck builder's stats trigger participates in the layout flow rather than overlapping content

### Grid & Write State

One vocabulary for how the grid reports itself, and one for how a write reports
failure. Settled by sketch 005.

- [ ] **UISTATE-01**: Card grids present one consistent treatment across idle, loading, empty, and error states
- [ ] **UISTATE-02**: A loading grid shows skeleton tiles rather than a spinner
- [ ] **UISTATE-03**: A write that fails surfaces the error inline on the row that failed, with the value visibly reverting and a retry action available

### Card Sync Reliability

- [ ] **SYNC-01**: The nightly card sync processes every non-token set within its execution budget
- [ ] **SYNC-02**: Every set in the catalog reflects upstream data within 24 hours of a successful sync run
- [ ] **SYNC-03**: A sync run that does not process every set reports failure rather than success
- [ ] **SYNC-04**: Operator can determine catalog freshness — which sets last synced and when — without querying the database by hand

### Carried Debt

- [ ] **DEBT-02**: DeckBuilder Add Cards tab displays variant art via `getPrintingArtMap()`
- [ ] **DEBT-05**: The LAW spotlight deck's 9 unresolved cards are matched against catalog data and the deck list corrected

## Future Requirements

Acknowledged, deferred, not in this roadmap.

### Want List & Collection

- **WANT-03**: Export / share want list
- **COLLECT-04**: CSV export of collection
- **COLLECT-05**: SWUDB-format CSV import

### Filters

- **MARKET-05**: Market price threshold filter

### Error Contract

- **UISTATE-04**: Non-drawer optimistic writes (deck-builder selector, remaining binder surfaces) gain an error vocabulary — open risk 6 from the sketch wrap-up. Inline row errors need a row to attach to; surfaces without one still fail silently

### Sync

- **SYNC-05**: Incremental / resumable sync — per-set checkpointing, re-sync only changed sets, cards and prices split into separate invocations

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| 2-column mobile catalog grid | Tested in sketch 001 — cut visible cards from ~9 to ~4. Density beat control comfort |
| On-tile mutation controls at any breakpoint | A stepper needs ~180px; mobile tiles are ~118px and desktop deck-builder tiles ~68px. Fails at every width |
| Denser unified drawer table | Rejected in sketch 004 — produced 26px cells |
| Progressive disclosure in the drawer | Rejected in sketch 004 — layout shift |
| Global toast for failed writes | Rejected in sketch 005 — a 4-second toast recreates the silent revert it was meant to fix, and cannot attribute a failure among 12 steppers |
| Removing card detail pages | They stay as shareable URLs, and cost nothing — they are the routed wrapper around the same body the drawer renders |
| Hover-to-adjust on desktop | Deliberately traded away for a single interaction contract across breakpoints |
| Full sync rearchitecture | Batching plus loud failure is sufficient to close the timeout; incremental/resumable deferred to SYNC-05 |
| More than 1 cron/day | Vercel Hobby tier constraint |

## Open Risks Carried Into Planning

Accepted at sketch selection, unresolved. Planning inputs — not settled guidance.
Source: `.planning/sketches/WRAP-UP-SUMMARY.md`.

1. Corner ⓘ is 22px, below the 44px floor (TILE-03/TILE-04 tension). Long-press is the real target; needs device testing. Fallback is promoting ⓘ into the control surface
2. The deck count is both a display and a button — discoverability unverified
3. Long-press has no accessible equivalent; the corner ⓘ must be a real focusable button
4. Long-press can fire during a slow scroll — needs a movement threshold to cancel
5. `useColumnCount()` reads window width while `estimateSize` reads container width (`card-grid.tsx:17-27` vs `:78`). With the 320px sidebar present they disagree — this is the mechanism behind the ~68px desktop tiles. Confirm whether intentional or a latent sizing bug
6. Non-drawer optimistic writes have no error vocabulary — deferred as UISTATE-04
7. Multi-failure error stacking is untested — offline mid-session produces several red rows at once, never seen on a real device with a real network drop
8. Prop contract mismatch — the detail page passes no `onQuantityChange` to `VariantTradeSection` (`page.tsx:67`) while the sheet does
9. Section membership disagreement — the detail page renders Collection + Trade; the sheet renders all three. Whether the drawer and detail page should agree is undecided

## Sequencing Constraints

- **CATALOG-08 is a blocking prerequisite for CATALOG-05/06/07.** `VariantTradeSection` gates on `ownedCount` while `VariantCollectionSection` mutates it locally. Lifting state also collapses three `router.refresh()` calls into one and gives UISTATE-03's inline error map a home — one refactor serving both
- **CATALOG-07 subsumes the pending todo** `2026-07-20-stale-trade-availability-after-collection-add-on-binder-mana.md` (the `onOwnedCountChange` threading bug). Promoting the drawer to the catalog's primary mutation surface turns that binder edge case into the core interaction
- **DEBT-02 may get cheaper as a side effect of SELECT-01** — the selector redesign touches exactly the tile that needs `getPrintingArtMap()`
- **DEBT-05 is an investigation, not a sync fix.** LAW is fully synced (901 printings, matching the API). Its recorded cause is disproven; the 9 unknowns are a name/subtitle matching problem

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TILE-01 | TBD | Pending |
| TILE-02 | TBD | Pending |
| TILE-03 | TBD | Pending |
| TILE-04 | TBD | Pending |
| CATALOG-05 | TBD | Pending |
| CATALOG-06 | TBD | Pending |
| CATALOG-07 | TBD | Pending |
| CATALOG-08 | TBD | Pending |
| SELECT-01 | TBD | Pending |
| SELECT-02 | TBD | Pending |
| SELECT-03 | TBD | Pending |
| SELECT-04 | TBD | Pending |
| UISTATE-01 | TBD | Pending |
| UISTATE-02 | TBD | Pending |
| UISTATE-03 | TBD | Pending |
| SYNC-01 | TBD | Pending |
| SYNC-02 | TBD | Pending |
| SYNC-03 | TBD | Pending |
| SYNC-04 | TBD | Pending |
| DEBT-02 | TBD | Pending |
| DEBT-05 | TBD | Pending |

**Coverage:**
- v8 requirements: 21 total
- Mapped to phases: 0 ⚠️ (roadmap not yet created)
- Unmapped: 21 ⚠️

---
*Requirements defined: 2026-08-16*
*Last updated: 2026-08-16 after v8 milestone scoping*
