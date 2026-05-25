# Milestone v5: Trade Binder & Performance

**Status:** 🚧 In Progress
**Phases:** 23–25
**Total Plans:** TBD

## Overview

Close the variant gap in the public binder "Looking For" section, overhaul the binder add-to-trade workflow with card detail page integration, redesign the Manage Binder UX for collection-driven card discovery, and measurably improve catalog browsing and operational performance across filter interactions, page load, image rendering, bulk imports, and deck creation.

---

## Phases

### Phase 23: Binder Variant Completeness

**Goal:** All binder surfaces accurately reflect variant identity — Looking For tiles show variant badges, the Card Detail page exposes trade offer management, and the Manage Binder page lets users discover tradeable cards from their own collection
**Depends on:** Phase 22 (v4 complete)
**Requirements:** BINDER-07, BINDER-08, BINDER-09
**Plans:** TBD — filled during /gsd-plan-phase

**Success Criteria** (what must be TRUE):
1. A visitor to a public binder's "Looking For" section sees a variant badge (Normal / Foil / Showcase / Hyperspace / Hyperspace Foil) on each tile, matching the badge style used on "Available for Trade" tiles
2. An authenticated user on any card's detail page can see an "Available for Trade" section that shows current trade offer state per variant and can set, edit, or remove a quantity without visiting the Manage Binder page
3. An authenticated user on the Manage Binder page can browse and search their owned cards directly (filtered list of collection cards) and add any of them to their trade binder — no full catalog navigation required
4. Adding or removing a trade offer from the Card Detail page is reflected immediately in the Manage Binder page without requiring a full page reload

**UI hint**: yes

---

### Phase 24: Catalog & Page Load Performance

**Goal:** Catalog filter interactions feel near-instant, above-fold content appears faster on first load, and card images appear without layout shift or blank flicker
**Depends on:** Phase 23
**Requirements:** PERF-01, PERF-02, PERF-03
**Plans:** TBD — filled during /gsd-plan-phase

**Success Criteria** (what must be TRUE):
1. Changing any catalog filter (set, rarity, variant, owned-only) reflects new results in ≤200ms without a visible loading spinner or full page reload
2. The catalog page and public binder page show their above-fold content measurably faster on first load — LCP is reduced compared to baseline
3. Card images below the fold load lazily and never cause layout shift — containers have fixed dimensions before images resolve
4. The first visible row of card images loads with priority (no waiting behind below-fold images) and displays a blur placeholder or skeleton while the image fetches

**UI hint**: yes

---

### Phase 25: Operation Performance

**Goal:** Bulk operations (Quick Add, CSV Import) give real-time feedback and never time out, and creating a new deck reaches the empty skeleton instantly
**Depends on:** Phase 23
**Requirements:** PERF-04, PERF-05
**Plans:** TBD — filled during /gsd-plan-phase

**Success Criteria** (what must be TRUE):
1. While a Quick Add (starter deck) or CSV Import is processing, the user sees a live progress indicator (row count or percentage) — the UI is never frozen or silent during a long operation
2. Quick Add and CSV Import complete successfully for collections up to 1,000 cards without a timeout error, even on a slow connection
3. After clicking "New Deck", the empty Deck Builder skeleton (with guided onboarding visible) appears within ≤500ms — no perceptible blank or loading state before onboarding renders

---

## Milestone Summary

**Requirements mapped:** 8/8

| Requirement | Phase |
|-------------|-------|
| BINDER-07 | Phase 23 |
| BINDER-08 | Phase 23 |
| BINDER-09 | Phase 23 |
| PERF-01 | Phase 24 |
| PERF-02 | Phase 24 |
| PERF-03 | Phase 24 |
| PERF-04 | Phase 25 |
| PERF-05 | Phase 25 |

---

*For current project status, see .planning/ROADMAP.md*
