# Milestone v6: Mobile, Performance & Polish

**Status:** ✅ Shipped 2026-06-03
**Phases:** 26–29
**Total Plans:** 16 (5 + 4 + 2 + 5)
**Timeline:** 2026-05-29 → 2026-06-03

## Overview

Make the deck builder fully usable on a phone without changing the desktop experience, resolve FCP/LCP/INP regressions on the `/decks` and `/cards/[set]/[id]` routes using live Vercel Speed Insights data, and clear the standing variant-enum and dead-code tech debt.

---

## Phases

### Phase 26: Mobile Deck Builder UX

**Goal:** The deck builder is fully usable on a phone — stats are accessible without overlap, touch targets are large enough to tap, and the toolbar fits small screens — without changing the desktop experience at all
**Depends on:** Phase 25.1 (v5 complete)
**Requirements:** MOBILE-01, MOBILE-02, MOBILE-03, MOBILE-04
**Success Criteria** (what must be TRUE):

  1. On a phone-width screen (< 480px), a user can open a deck and tap a card to add it to the deck without the stats sidebar obscuring the card list
  2. On a phone-width screen, a user can tap a visible stats summary (card count and valid/invalid badge) to expand the full stats panel — cost curve, aspect breakdown, and Save button are all reachable inside the panel
  3. The +/- buttons on card rows are large enough to tap accurately on a touchscreen — no mis-tap on an adjacent target
  4. The deck builder toolbar (deck name, tabs, Export, Back) displays fully and without overflow or clipping on screens below 480px wide
  5. Loading the deck builder on a desktop browser shows the same three-tab layout with inline stats sidebar that existed before this phase — zero desktop regression

**Plans:** 5/5 plans complete — completed 2026-05-29
**UI hint**: yes

### Phase 27: /decks Route Performance

**Goal:** /decks and /decks/[id] load measurably faster for returning users, card add/remove interactions do not freeze the UI, and any FCP/LCP/INP regressions visible in Vercel Speed Insights are identified and resolved
**Depends on:** Phase 26
**Requirements:** PERF-07, PERF-08, PERF-09
**Success Criteria** (what must be TRUE):

  1. Navigating to /decks after a previous visit loads the deck list from cache — no redundant server round-trip when the user's decks have not changed
  2. After creating, renaming, or deleting a deck, the /decks list reflects the change on the very next load — stale cache data is never shown
  3. Tapping "Add card" or "Remove card" in the deck builder does not produce a visible freeze or jank — the UI remains responsive throughout the interaction
  4. The Vercel Speed Insights dashboard has been reviewed for /decks route FCP, LCP, and INP data, specific regressions have been identified, and each identified regression has a corresponding fix applied in this phase

**Plans:** 4/4 plans complete — completed 2026-06-02

**Wave 1**

- [x] 27-00-PLAN.md — Wave 0 test stubs: decks.test.ts, api-deck-revalidate.test.ts, deck-builder.test.tsx; retarget page.test.tsx to DecksClient (PERF-07/PERF-08)
- [x] 27-01-PLAN.md — Per-user cacheTag on getDecks/getDeckWithCards + revalidateTag in POST/PATCH/DELETE + router.refresh in DecksClient (PERF-07)
- [x] 27-02-PLAN.md — startTransition around handleDeckUpdate dispatches + router.refresh in handleSave (PERF-08 + PERF-07)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 27-03-PLAN.md — Speed Insights /decks review checkpoint + targeted fixes or D-10 catalog-parity fallback (PERF-09)

### Phase 28: Tech Debt Sweep

**Goal:** Dead code is removed, variant enum gaps that cause silent data errors are filled, and the catalog correctly reflects owned counts after returning from a card detail page
**Depends on:** Phase 26
**Requirements:** DEBT-01, DEBT-03, DEBT-04
**Success Criteria** (what must be TRUE):

  1. `CollectionControls` no longer exists anywhere in the codebase — no component file, no imports, no references
  2. `Prestige Foil` appears as a selectable variant in any UI that lists variant options; `Serialized` is ranked correctly in the variant art precedence order
  3. After updating owned counts on a card's detail page and navigating back to the catalog, the catalog's owned-count overlay shows the updated number — no stale state visible

**Plans:** 2/2 plans complete — completed 2026-06-03

**Wave 1** *(all three tech-debt items are independent — no file overlap)*

- [x] 28-01-PLAN.md — Delete CollectionControls dead code + fill variant enum gaps (Prestige Foil option, Serialized precedence, schema comment) (DEBT-01, DEBT-03)
- [x] 28-02-PLAN.md — Add pageshow BFCache re-fetch listener to CatalogClient for fresh owned-count overlay (DEBT-04)

### Phase 29: Card Detail Page Performance

**Goal:** The `/cards/[set]/[id]` card detail page has measurably improved FCP, LCP, and INP — specific regressions identified via Vercel Speed Insights are resolved
**Depends on:** Phase 27
**Requirements:** PERF-10
**Success Criteria** (what must be TRUE):

  1. Vercel Speed Insights data for `/cards/[set]/[id]` has been reviewed and specific FCP, LCP, and INP regressions are identified
  2. Each identified regression has a corresponding fix applied — no regression remains unaddressed
  3. The card detail page builds without errors and the fix does not regress the trade offer, collection controls, or variant tracking sections

**Plans:** 5/5 plans complete — completed 2026-06-03

**Wave 1** *(parallel — exclusive file ownership)*

- [x] 29-01-PLAN.md — Split getCardByPrinting into cached public getCardDefinition + per-user cache on getSameSetPrintingsWithCounts; remove legacy hydration block (D-01, D-02, D-03)
- [x] 29-02-PLAN.md — Two-layer cache invalidation: revalidateTag in variant + trade routes, router.refresh() in both variant section components (D-04, D-05)
- [x] 29-03-PLAN.md — Card detail loading.tsx skeleton + replace invalid preload prop with priority on the above-fold image (D-06, D-07, D-08, D-09, D-10)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 29-04-PLAN.md — CHECKPOINT: user reviews Speed Insights for /cards/[set]/[id] and records FCP/LCP/INP findings (D-11 Wave 2a)
- [x] 29-05-PLAN.md — Apply targeted fixes per recorded findings (removed opacity transition from LCP image on initial paint) (D-11 Wave 2b, D-12)

---

## Deferred out of v6

- **DEBT-02**: DeckBuilder Add Cards tab variant art via `getPrintingArtMap()` — deferred; needs investigation on interaction with the virtualized list
- **DEBT-05**: LAW spotlight deck 9 unknown cards (absent from DB, commented TODOs) — deferred pending DB sync
