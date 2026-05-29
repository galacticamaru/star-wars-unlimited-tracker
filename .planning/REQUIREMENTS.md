# Requirements: Star Wars Unlimited Tracker

**Defined:** 2026-05-29
**Core Value:** See exactly which cards you own while building decks, and know instantly what you're missing.

## v6 Requirements

Requirements for the v6 Mobile, Performance & Polish milestone. Phases continue from v5 (Phase 26+).

### Mobile UX

- [x] **MOBILE-01**: User can access deck stats (card count, aspect breakdown, validity) on mobile via a bottom sheet that peeks with a summary and expands to show full sidebar content
- [x] **MOBILE-02**: Add/remove card buttons in the deck builder are tappable on touch screens (minimum 44px target size)
- [x] **MOBILE-03**: Deck builder toolbar and tabs display without overflow or clipping on screens below 480px wide
- [x] **MOBILE-04**: Existing desktop deck builder layout is fully preserved — no regression on md breakpoint and above

### Performance

- [ ] **PERF-07**: `/decks` and `/decks/[id]` data fetches use per-user `cacheTag` with `revalidateTag` called in all deck mutation handlers (create, update, delete)
- [ ] **PERF-08**: Card add/remove interactions in the deck builder use `startTransition` and `useDeferredValue` to prevent INP regressions
- [ ] **PERF-09**: Vercel Speed Insights FCP/LCP/INP data for `/decks` routes is reviewed and specific identified regressions are resolved
- [ ] **PERF-10**: `/cards/[set]/[id]` card detail page has measurably improved FCP, LCP, and INP — specific regressions identified via Speed Insights are resolved

### Tech Debt

- [ ] **DEBT-01**: `CollectionControls` component and its dead imports are removed from the codebase
- [ ] **DEBT-03**: `Prestige Foil` added to `VARIANT_OPTIONS`; `Serialized` added to `VARIANT_PRECEDENCE`
- [ ] **DEBT-04**: Catalog collection state re-fetches correctly after card detail page owned-count mutations (no stale overlay after returning to catalog)

---

## Future Requirements (Deferred)

### Deferred from v6

- **DEBT-02**: DeckBuilder Add Cards tab displays variant art via `getPrintingArtMap()` — deferred; more investigation needed on interaction with virtualized list
- **DEBT-05**: LAW spotlight deck unknowns resolved (9 cards absent from DB, commented TODOs cleared) — deferred pending DB sync

### Previously Deferred

| ID | Description | Deferred At |
|----|-------------|-------------|
| WANT-03 | Export / share want list (link or downloadable file) | v4 planning |
| COLLECT-05 | SWUDB CSV import format support | v4 planning |
| COLLECT-04v2 | CSV export of full collection | v4 planning |
| REQ-MARKET-05 | Market price threshold filter in catalog | v4 planning |

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Drag-and-drop card ordering on mobile | Touch drag conflicts with scroll; tap +/- is the correct mobile pattern |
| Bottom tab navigation bar on mobile | Scope risk; Sheet approach solves the core problem without restructuring navigation |
| `use cache: remote` for deck queries | Requires Vercel paid Runtime Cache — not available on Hobby tier |
| Card trading / marketplace | Different product |
| Mobile native app | Web-first; responsive design covers mobile browsers |
| Camera scanning | ML complexity; CSV import covers collection migration |

---

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MOBILE-01 | Phase 26 | Complete |
| MOBILE-02 | Phase 26 | Complete |
| MOBILE-03 | Phase 26 | Complete |
| MOBILE-04 | Phase 26 | Complete |
| PERF-07 | Phase 27 | Pending |
| PERF-08 | Phase 27 | Pending |
| PERF-09 | Phase 27 | Pending |
| PERF-10 | Phase 29 | Pending |
| DEBT-01 | Phase 28 | Pending |
| DEBT-03 | Phase 28 | Pending |
| DEBT-04 | Phase 28 | Pending |

**Coverage:**
- v6 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-29*
*Last updated: 2026-05-29 — traceability confirmed after roadmap creation*
