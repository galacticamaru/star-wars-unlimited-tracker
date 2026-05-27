# Requirements: v5 — Trade Binder & Performance

> Milestone: v5
> Created: 2026-05-23
> Status: Active

## Milestone Goal

Close the variant gap in the public binder's "Looking For" section, overhaul the add-to-trade workflow with card detail page integration, redesign the Manage Binder UX, and measurably improve catalog browsing and deck creation performance.

---

## Requirements

### Trade Binder

- [x] **BINDER-07**: User visiting a public binder sees variant type badges (Normal / Foil / Showcase / Hyperspace / Hyperspace Foil) on "Looking For" tiles — mirrors the v4 Available for Trade badge work (Phase 19/21)
- [x] **BINDER-08**: Authenticated user can view and manage their trade offers directly from a Card Detail page — set quantity offered per variant, see current offer state, and toggle off — without navigating to Manage Binder
- [x] **BINDER-09**: Manage Binder page redesigned so user can discover tradeable cards from their own collection (filtered/searchable list of owned cards) rather than navigating the full catalog to find cards to offer

### Performance

- [ ] **PERF-01**: Catalog filter interactions feel near-instant — filter changes reflect in ≤200ms without full page reload or visible spinner
- [ ] **PERF-02**: Catalog and public binder pages have measurably reduced LCP — above-fold content visible faster on first load
- [ ] **PERF-03**: Card images load with no layout shift — lazy loading below fold, priority loading for first visible rows, blur placeholder or skeleton while loading
- [ ] **PERF-04**: Quick Add (starter decks) and CSV Import provide real-time progress feedback (row count or percentage) and complete without timeout for collections up to 1,000 cards
- [ ] **PERF-05**: Creating a new deck navigates to the Deck Builder empty skeleton in ≤500ms — no perceptible delay before the empty deck guided onboarding appears

---

## Future Requirements (Deferred)

| ID | Description | Deferred At |
|----|-------------|-------------|
| WANT-03 | Export / share want list (link or downloadable file) | v4 planning |
| COLLECT-05 | SWUDB CSV import format support | v4 planning |
| COLLECT-04v2 | CSV export of full collection | v4 planning |
| REQ-MARKET-05 | Market price threshold filter in catalog | v4 planning |

---

## Out of Scope

| Item | Reason |
|------|--------|
| Trade request / messaging flow | Different product — social coordination layer out of scope |
| Real-time price alerts | Significant backend complexity; not tied to core deck-building value |
| Camera scanning | ML complexity; CSV import covers collection migration |
| Mobile native app | Web-first; responsive design covers mobile browsers |
| Buy links / affiliate | Different product |

---

## Traceability

| Requirement | Phase | Plan(s) | Verified |
|-------------|-------|---------|---------|
| BINDER-07 | Phase 23 | — | — |
| BINDER-08 | Phase 23 | — | — |
| BINDER-09 | Phase 23 | — | — |
| PERF-01 | Phase 24 | — | — |
| PERF-02 | Phase 24 | — | — |
| PERF-03 | Phase 24 | — | — |
| PERF-04 | Phase 25 | 25-01, 25-02, 25-03 | — |
| PERF-05 | Phase 25 | 25-01, 25-03 | — |
