# Roadmap: Star Wars Unlimited Tracker

## Milestones

- ✅ **v1 MVP** — Phases 1–5.2 (shipped 2026-05-07) · [Archive](milestones/v1-ROADMAP.md)
- ✅ **v2 Multi-User, Market, Decks & Trading** — Phases 6–10.1 (shipped 2026-05-12) · [Archive](milestones/v2-ROADMAP.md)
- ✅ **v3 Catalog, Home & Binder Polish** — Phases 11–14 (shipped 2026-05-13) · [Archive](milestones/v3-ROADMAP.md)
- ✅ **v4 Deck Builder & Collection Depth** — Phases 15–22 (shipped 2026-05-23) · [Archive](milestones/v4-ROADMAP.md)
- ✅ **v5 Trade Binder & Performance** — Phases 23–25.1 (shipped 2026-05-27) · [Archive](milestones/v5-ROADMAP.md)
- ✅ **v6 Mobile, Performance & Polish** — Phases 26–29 (shipped 2026-06-03) · [Archive](milestones/v6-ROADMAP.md)
- ✅ **v7 Trade Binder Improvements** — Phases 30–33 (shipped 2026-07-20) · [Archive](milestones/v7-ROADMAP.md)
- 🚧 **v8 Catalog Interaction & Sync Reliability** — Phases 34–38 (in progress)

## Phases

<details>
<summary>✅ v1 MVP (Phases 1–5.2) — SHIPPED 2026-05-07</summary>

See [milestones/v1-ROADMAP.md](milestones/v1-ROADMAP.md) for full details.

</details>

<details>
<summary>✅ v2 Multi-User, Market, Decks & Trading (Phases 6–10.1) — SHIPPED 2026-05-12</summary>

See [milestones/v2-ROADMAP.md](milestones/v2-ROADMAP.md) for full details.

</details>

<details>
<summary>✅ v3 Catalog, Home & Binder Polish (Phases 11–14) — SHIPPED 2026-05-13</summary>

- [x] **Phase 11: New Home Page** — Route refactor (/cards), Hero section, and High Value card grid (3/3 plans)
- [x] **Phase 12: Catalog Evolution** — Sticky sidebar filters, variant support (Showcase, Prestige, Serialized), TS26 set (3/3 plans)
- [x] **Phase 13: Advanced Filters** — Owned-only filter in catalog and deck builder (3/3 plans)
- [x] **Phase 14: Trade Binder Polish** — Full-width layouts and automatic want management (3/3 plans)

See [milestones/v3-ROADMAP.md](milestones/v3-ROADMAP.md) for full details.

</details>

<details>
<summary>✅ v4 Deck Builder & Collection Depth (Phases 15–22) — SHIPPED 2026-05-23</summary>

- [x] **Phase 15: Deck List Display Polish** — Card type grouping, aspect breakdown panel, and card art in the deck list view (3/3 plans) — 2026-05-14
- [x] **Phase 15.1: Cost Sort** — Deck list card rows ordered by cost ascending (1/1 plan) — 2026-05-15
- [x] **Phase 16: Empty Deck Guided Onboarding** — Auto-filter flow that guides users from leader+base selection through aspect-filtered card browsing (4/4 plans) — 2026-05-15
- [x] **Phase 16.1: Reorder Deck Tabs** — Tab order changed to Deck List → Add Cards → Want List; default tab is now Deck List (1/1 plan) — 2026-05-15
- [x] **Phase 17: Variant Collection Tracking** — Per-variant owned counts viewed and updated on the card detail page (10/10 plans) — 2026-05-18
- [x] **Phase 17.1: Card Sync Variant Grouping** — Refactor upsertCards to in-memory grouping; all variant types correctly linked in card_printings (2/2 plans) — 2026-05-20
- [x] **Phase 18: Catalog Collection Enhancements** — Catalog grid shows highest-owned variant art; quick-add all cards from a starter deck (3/3 plans) — 2026-05-20
- [x] **Phase 19: Variant Filter Enhancements** — Unified variant filtering across the entire app; Foil/Hyperspace Foil added; variant filters in binder (2/2 plans) — 2026-05-20
- [x] **Phase 20: CSV Variant Imports** — CSV import updated to support all four variant types via array-based variant lookup (1/1 plan) — 2026-05-20
- [x] **Phase 21: Binder Variant Badges** — Schema migration to support per-variant trade offerings; variant type badges on public binder cards (4/4 plans) — 2026-05-23
- [x] **Phase 22: Starter Deck Expansions** — Add TS26, IBH, and LAW/SEC spotlight decks to the Quick Add feature; corrected all starter/spotlight deck card lists (3/3 plans) — 2026-05-23

See [milestones/v4-ROADMAP.md](milestones/v4-ROADMAP.md) for full details.

</details>

<details>
<summary>✅ v5 Trade Binder & Performance (Phases 23–25.1) — SHIPPED 2026-05-27</summary>

- [x] **Phase 23: Binder Variant Completeness** — Looking For variant badges, Card Detail trade offer management, and collection-driven Manage Binder discovery (completed 2026-05-26)
- [x] **Phase 24: Catalog & Page Load Performance** — Filter response ≤200ms, reduced LCP, and layout-shift-free image loading (completed 2026-05-26)
- [x] **Phase 25: Operation Performance** — Progress feedback for Quick Add/CSV Import, timeout-proof bulk ops, and deck creation ≤500ms (completed 2026-05-27)
- [x] **Phase 25.1: Speed Insights Integration** (completed 2026-05-27)

See [milestones/v5-ROADMAP.md](milestones/v5-ROADMAP.md) for full details.

</details>

<details>
<summary>✅ v6 Mobile, Performance & Polish (Phases 26–29) — SHIPPED 2026-06-03</summary>

- [x] **Phase 26: Mobile Deck Builder UX** — Stats sidebar accessible via bottom sheet on mobile; touch targets and layout usable on screens below 480px wide (completed 2026-05-29)
- [x] **Phase 27: /decks Route Performance** — Per-user cache tagging, INP-safe card interactions, and Speed Insights-driven regression fixes for /decks routes (completed 2026-06-02)
- [x] **Phase 28: Tech Debt Sweep** — Dead code removed, variant enums completed, catalog invalidation verified (completed 2026-06-03)
- [x] **Phase 29: Card Detail Page Performance** — FCP, LCP, and INP improvements for /cards/[set]/[id] driven by Speed Insights data (completed 2026-06-03)

</details>

<details>
<summary>✅ v7 Trade Binder Improvements (Phases 30–33) — SHIPPED 2026-07-20</summary>

**Milestone Goal:** Make managing a trade binder fast and intuitive — collapse the separate Add Cards, Manual Wants, variant sheet, and exclusions surfaces into one search-driven flow, with a set-once profile tucked behind a modal.

- [x] **Phase 30: Unified Search-Driven Add Flow** — one catalog search replaces the Add Cards grid + Manual Wants box; owned variants go to the trade binder, any variant can become a want (completed 2026-07-19)
- [x] **Phase 31: Trade Profile Modal & Public Trade Note** — username/binder URL behind a profile modal; new public trade note settable and shown on the public binder (completed 2026-07-20)
- [x] **Phase 32: Combined Wants & Exclusions List** — one two-section Looking For list (Deck Wants / Manual Wants) with inline exclude/restore incl. orphaned exclusions and manual quantity/remove; BINDER-19 regression closed via gap plan 32-03 (completed 2026-07-20)
- [x] **Phase 33: Ashes of the Empire Spotlight Decks** — Luke Skywalker (ASH) & Emperor Palpatine (ASH) decks added to Quick Add; implemented directly, all 50 cards verified in the catalog DB (completed 2026-07-20)

Shipped via squashed code-only PR #21 into `main`. See [milestones/v7-ROADMAP.md](milestones/v7-ROADMAP.md) for full phase details.

</details>

### 🚧 v8 Catalog Interaction & Sync Reliability (Phases 34–38) — IN PROGRESS

**Milestone Goal:** Make card mutation happen where you are — tap a tile, adjust it, done — at every breakpoint; and make the nightly catalog sync actually finish and say so when it doesn't.

- [ ] **Phase 34: Card Sync Reliability** — Batched upserts complete the nightly sync inside its Vercel budget, a partial run reports failure instead of silently succeeding, and the LAW spotlight deck's matching bug is corrected (all 7 plans executed; verification gaps_found 2026-08-16 — see 34-VERIFICATION.md)
- [ ] **Phase 35: Shared Variant State Foundation** — Collection/trade/want sections share one state source; the stale-trade-availability bug is fixed; inline write-error handling has a home (BLOCKING prerequisite for Phase 36)
- [ ] **Phase 36: Touch-Viable Tile Contract & Catalog Drawer** — Tile tap opens the catalog variant drawer; tile-wide link removed at every breakpoint in both modes; deck-builder selector kept functional in the interim via a minimal off-tile stepper
- [ ] **Phase 37: Touch-Viable Deck Selector** — Phase 36's interim stepper is replaced by the merged ~64px mobile bottom bar and the desktop sidebar controls; DEBT-02 variant art rides along
- [ ] **Phase 38: Grid State Vocabulary** — One idle/loading/empty/error treatment across every card grid; skeleton tiles instead of a spinner while loading

## Phase Details

### Phase 23: Binder Variant Completeness

**Goal:** All binder surfaces accurately reflect variant identity — Looking For tiles show variant badges, the Card Detail page exposes trade offer management, and the Manage Binder page lets users discover tradeable cards from their own collection
**Depends on:** Phase 22 (v4 complete)
**Requirements:** BINDER-07, BINDER-08, BINDER-09
**Success Criteria** (what must be TRUE):

  1. A visitor to a public binder's "Looking For" section sees a variant badge (Normal / Foil / Showcase / Hyperspace / Hyperspace Foil) on each tile, matching the badge style used on "Available for Trade" tiles
  2. An authenticated user on any card's detail page can see an "Available for Trade" section that shows current trade offer state per variant and can set, edit, or remove a quantity without visiting the Manage Binder page
  3. An authenticated user on the Manage Binder page can browse and search their owned cards directly (filtered list of collection cards) and add any of them to their trade binder — no full catalog navigation required
  4. Adding or removing a trade offer from the Card Detail page is reflected immediately in the Manage Binder page without requiring a full page reload

**Plans:** 4/4 plans complete
**Wave 1**

- [x] 23-01-PLAN.md — Schema migration + DB/API foundation for printing-level manual wants (BINDER-07 data layer)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 23-02-PLAN.md — Looking For variant badge UI on public binder (BINDER-07 UI completion)
- [x] 23-03-PLAN.md — Card Detail "Available for Trade" section with server-rendered initial state + PATCH wiring (BINDER-08)
- [x] 23-04-PLAN.md — Manage Binder owned-card browse, Sheet panel, and manual-wants variant chip selector (BINDER-09 + BINDER-07 manual-wants UX)

**UI hint**: yes

### Phase 24: Catalog & Page Load Performance

**Goal:** Catalog filter interactions feel near-instant, above-fold content appears faster on first load, and card images appear without layout shift or blank flicker
**Depends on:** Phase 23
**Requirements:** PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):

  1. Changing any catalog filter (set, rarity, variant, owned-only) reflects new results in ≤200ms without a visible loading spinner or full page reload
  2. The catalog page and public binder page show their above-fold content measurably faster on first load — LCP is reduced compared to baseline
  3. Card images below the fold load lazily and never cause layout shift — containers have fixed dimensions before images resolve
  4. The first visible row of card images loads with priority (no waiting behind below-fold images) and displays a blur placeholder or skeleton while the image fetches

**Plans:** 6/6 plans complete

**Wave 0** *(test infrastructure — must complete before Wave 1)*

- [x] 24-01-PLAN.md - Wave 0 test stubs for CardGrid virtualization + getAllCards signature change

**Wave 1** *(parallel — independent file ownership)*

- [x] 24-02-PLAN.md - Search input 150ms debounce in CatalogClient (PERF-01)
- [x] 24-04-PLAN.md - RSC caching: use-cache directive + cacheTag, remove force-dynamic, drop userId from getAllCards (PERF-02)

**Wave 2** *(blocked on Wave 1 catalog-client.tsx ownership)*

- [x] 24-03-PLAN.md - CardGrid virtualization with @tanstack/react-virtual + image priority threshold (PERF-01 + PERF-03)

**Wave 3** *(final verification)*

- [x] 24-05-PLAN.md - npm run build + full test suite + route handler cacheComponents compat

**UI hint**: yes

### Phase 25: Operation Performance

**Goal:** Bulk operations (Quick Add, CSV Import) give real-time feedback and never time out, and creating a new deck reaches the empty skeleton instantly
**Depends on:** Phase 23
**Requirements:** PERF-04, PERF-05
**Success Criteria** (what must be TRUE):

  1. While a Quick Add (starter deck) or CSV Import is processing, the user sees a live progress indicator (row count or percentage) — the UI is never frozen or silent during a long operation
  2. Quick Add and CSV Import complete successfully for collections up to 1,000 cards without a timeout error, even on a slow connection
  3. After clicking "New Deck", the empty Deck Builder skeleton (with guided onboarding visible) appears within ≤500ms — no perceptible blank or loading state before onboarding renders

**Plans:** 3/3 plans complete

**Wave 0** *(test infrastructure — must complete before Wave 1)*

- [x] 25-01-PLAN.md — Wave 0 RED test stubs for batch helpers, progress text, and loading skeleton (PERF-04 + PERF-05)

**Wave 1** *(parallel — no file overlap)*

- [x] 25-02-PLAN.md — Batch helpers in collection.ts + refactor starter-deck and CSV import routes to single-round-trip batch upserts (PERF-04 backend)
- [x] 25-03-PLAN.md — Collection page card-count progress text + decks/[id]/loading.tsx animate-pulse skeleton (PERF-04 UI + PERF-05)

**UI hint**: yes

### Phase 25.1: Speed Insights Integration (INSERTED)

**Goal:** Install and configure @vercel/speed-insights to capture real-user performance metrics in production
**Depends on:** Phase 25
**Requirements:** PERF-06
**Success Criteria** (what must be TRUE):

  1. `@vercel/speed-insights` is listed in package.json dependencies and installed
  2. The `<SpeedInsights />` component is rendered in the root layout (`app/layout.tsx`) so every page is instrumented
  3. The app builds without errors and no TypeScript type errors are introduced

**Plans:** 1 plan
Plans:

- [x] 25.1-01-PLAN.md — Install @vercel/speed-insights and wire <SpeedInsights debug={...} /> into root layout (PERF-06)

---

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

**Plans:** 5/5 plans complete
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

**Plans:** 4/4 plans complete
Plans:
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

**Plans:** 2/2 plans complete
Plans:
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

**Plans:** 5/5 plans complete

Plans:
**Wave 1** *(parallel — exclusive file ownership)*

- [x] 29-01-PLAN.md — Split getCardByPrinting into cached public getCardDefinition + per-user cache on getSameSetPrintingsWithCounts; remove legacy hydration block (D-01, D-02, D-03)
- [x] 29-02-PLAN.md — Two-layer cache invalidation: revalidateTag in variant + trade routes, router.refresh() in both variant section components (D-04, D-05)
- [x] 29-03-PLAN.md — Card detail loading.tsx skeleton + replace invalid preload prop with priority on the above-fold image (D-06, D-07, D-08, D-09, D-10)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 29-04-PLAN.md — CHECKPOINT: user reviews Speed Insights for /cards/[set]/[id] and records FCP/LCP/INP findings (D-11 Wave 2a)
- [x] 29-05-PLAN.md — Apply targeted fixes per recorded findings, or documented no-op close if insufficient data (D-11 Wave 2b, D-12)

### Phase 30: Unified Search-Driven Add Flow

**Goal:** The Manage Binder page (`src/app/binder/manage/page.tsx`) replaces its separate "Add Cards to Binder" grid and "Add Manual Want" flow with a single search-driven flow over the full card catalog — a card search returns full-catalog matches (not just owned cards), the user picks a specific variant, and chooses "Add to trade binder" (only enabled for owned variants) or "Add as want" (any variant, owned or not)
**Depends on:** Phase 29 (v6 complete)
**Requirements:** BINDER-10, BINDER-11, BINDER-12, BINDER-13, BINDER-14
**Success Criteria** (what must be TRUE):

  1. On the Manage Binder page, the separate "Add Cards to Binder" grid and "Add Manual Want" box are gone, replaced by one search bar
  2. No cards render below the search bar until the user types a search term — there is no eager load of the full collection or catalog on page mount
  3. Search results are drawn from the full card catalog (including cards the user does not own), not only from `/api/collection/owned-cards`
  4. Selecting a search result opens a variant picker; for an owned variant the user can choose "Add to trade binder" and set a trade quantity, and for any variant the user can choose "Add as want"
  5. Attempting to add an unowned variant to the trade binder shows that action disabled with a visible reason (e.g. "You don't own this variant"), while "Add as want" remains available for the same variant

**Plans:** 3/3 plans complete
**Wave 1**

- [x] 30-01-PLAN.md — Ownership-gated trade section, new always-available want section, and server-side trade-ownership enforcement on /api/trade

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 30-02-PLAN.md — Extend VariantTradeSheet to list all variants with both trade (gated) and want steppers

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 30-03-PLAN.md — Rework Manage Binder page into one lazy catalog-backed search; delete both legacy add surfaces

**UI hint**: yes

### Phase 31: Trade Profile Modal & Public Trade Note

**Goal:** The trade profile (username / binder URL), currently a permanent section on the Manage Binder page, moves behind a profile button that opens a modal; the modal gains a new public "trade note" free-text field, and the public binder page (`/binder/[username]`) displays that note to visitors
**Depends on:** Phase 30
**Requirements:** BINDER-15, BINDER-16, BINDER-17
**Success Criteria** (what must be TRUE):

  1. The Manage Binder page no longer shows the username/binder-URL section inline on the page; a profile button opens a modal containing that content instead
  2. Inside the profile modal, the user can set and save a short public trade note (e.g. "EU only, will ship")
  3. Visiting a user's public binder page (`/binder/[username]`) shows their trade note when one is set, and shows no broken UI when the note is empty

**Plans:** 4/4 plans complete
Plans:
**Wave 1** *(parallel — no file overlap)*

- [x] 31-01-PLAN.md — Auth field + storage foundation: `trade_note` column, `additionalFields.tradeNote`, typed client, [BLOCKING] Neon push (BINDER-16/17)
- [x] 31-02-PLAN.md — UI primitives: centered Base UI `Dialog` + native `Textarea` (BINDER-15/16)

**Wave 2** *(blocked on Wave 1)*

- [x] 31-03-PLAN.md — Profile modal + manage-page header button; inline Trade Profile card removed (BINDER-15/16)
- [x] 31-04-PLAN.md — Public trade-note callout: query returns `tradeNote`, RSC passes it, conditional XSS-safe callout (BINDER-17)

**UI hint**: yes

### Phase 32: Combined Wants & Exclusions List

**Goal:** `ManageWantsList` shows deck-driven auto-wants and manually-added wants (including wants added for cards outside the user's collection, per Phase 30) together in one clearly-sectioned list, keeps the existing exclude/restore behaviour for auto-wants, and adds quantity/removal controls for manual wants
**Depends on:** Phase 30
**Requirements:** BINDER-18, BINDER-19, BINDER-20
**Success Criteria** (what must be TRUE):

  1. The wants list displays auto-wants and manual wants together in one list, with a clear visual distinction between the two (e.g. section headers or badges) rather than two disconnected components
  2. The user can hide (exclude) an auto-generated want and later restore a previously excluded auto-want — this behaviour is preserved from before the redesign
  3. The user can change the quantity of a manual want, or remove it entirely, directly from the wants list without leaving the page

**Plans:** 3/3 plans complete
**Wave 1**

- [x] 32-01-PLAN.md — Redesign ManageWantsList into one two-section list (Deck Wants + Manual Wants), remove standalone Exclusions, align parent invocation

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 32-02-PLAN.md — Human-verify the combined list (layout, exclude→restore round trip, manual quantity/remove)

**Gap closure** *(closes 32-VERIFICATION.md BINDER-19 orphaned-exclusion regression)*

- [x] 32-03-PLAN.md — Re-thread the full exclusions array into ManageWantsList; render orphaned exclusions (card no longer in autoWants) as dimmed restorable rows in Deck Wants without reintroducing a standalone Exclusions section

**UI hint**: yes

### Phase 33: Ashes of the Empire Spotlight Decks (COMPLETE)

**Status:** COMPLETE (2026-07-20) — implemented directly by the user (deck lists hand-authored into `src/data/starter-decks.ts`), not via the GSD plan→execute→verify flow. Both former gates are now cleared and the result was verified.
**Former gates (both cleared):**

  1. ✓ Deck lists supplied — Luke Skywalker (ASH) and Emperor Palpatine (ASH) added to `starterDecks`
  2. ✓ ASH set synced — all 50 distinct referenced cards resolve to Normal-variant printings in the catalog DB (verified 2026-07-20)

**Verification:** each deck is a legal SWU list (1 leader + 1 base + 50 main-deck cards); `tsc`/`eslint` clean on the changed file; all `collectorNumber`s resolve via `/api/collection/starter-deck` (no silent skips).

**Goal:** Add the Luke Skywalker (ASH) and Emperor Palpatine (ASH) Ashes of the Empire spotlight decks to Quick Add so a user can add either deck's full card list to their collection in one click, once the deck lists are supplied and the ASH set is present in the catalog
**Depends on:** Nothing structurally (independent of Phases 30–32); gated on external inputs listed above — sequenced last in the milestone so it never blocks binder-redesign delivery
**Requirements:** DECK-11, DECK-12
**Success Criteria** (what must be TRUE):

  1. The Luke Skywalker (ASH) spotlight deck appears as a Quick Add option and adds its full card list to the user's collection in one click
  2. The Emperor Palpatine (ASH) spotlight deck appears as a Quick Add option and adds its full card list to the user's collection in one click
  3. Every card referenced by both deck lists resolves against a real row in the catalog DB — no commented-out TODOs or "unknown card" gaps like the ones left by the deferred LAW spotlight deck (DEBT-05)

**Plans:** TBD

### Phase 34: Card Sync Reliability

**Goal:** The nightly card sync processes every non-token set within its execution budget and honestly reports when a run doesn't finish, instead of silently succeeding on a partial result; the LAW spotlight deck's previously "unresolved" cards are corrected using confirmed catalog data
**Depends on:** Phase 33 (v7 complete) — functionally independent of Phases 35–38; no shared files with any UI work in this milestone. Sequenced first: it fixes a live, silent production failure (six weeks of catalog drift on all but 3–4 sets) and carries zero risk of blocking the UI phases
**Requirements:** SYNC-01, SYNC-02, SYNC-03, SYNC-04, DEBT-05
**Success Criteria** (what must be TRUE):

  1. A nightly sync run processes every non-token set in a single execution, completing inside the Vercel Hobby budget via batched multi-row upserts instead of one round trip per card definition and per printing (SYNC-01)
  2. Any given set's card data reflects the swu-db.com API within 24 hours of a successful sync run (SYNC-02)
  3. If a sync run does not process every set, the run's response and logs report failure — not `success: true` — so a partial run can no longer look like a complete one (SYNC-03)
  4. An operator can see which sets last synced and when, without querying Neon by hand (SYNC-04)
  5. The LAW spotlight deck's 9 previously "unresolved" cards are re-matched against catalog data by name/subtitle and the deck list is corrected — all 50 cards resolve (DEBT-05)

**Notes:**

- DEBT-05's previously recorded cause ("9 cards absent from DB — pending DB sync") is disproven: LAW has been fully synced since 2026-07-05 (901/901 printings, confirmed against the API). Treat this purely as a name/subtitle matching bug in `src/data/starter-decks.ts` — do not make it depend on this phase's sync fix.
- Constrained to 1 cron job/day (Vercel Hobby tier) — multiplex within the existing cron entrypoint, do not add a second job.
- Full incremental/resumable sync (per-set checkpointing, split cards/prices invocations) is explicitly out of scope this milestone — deferred as SYNC-05. This phase is batching + loud failure only.

**Plans:** 7/8 plans complete — 34-08 added by gap closure after `34-VERIFICATION.md` recorded 2 failed truths (both CR-01)

**Wave 1** *(tracer slice — verified before any expansion plan starts)*

- [x] 34-01-PLAN.md — TRACER: chunked multi-row card upserts, single-source non-token set list, deadline-aware `syncAllCards` (SYNC-01, SYNC-02)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 34-02-PLAN.md — Price sync: unified set list (ASH/LOF/TS26), chunked CASE WHEN batch updates, sleep removed, honest per-set totals (SYNC-01, SYNC-02, SYNC-03)
- [x] 34-03-PLAN.md — Secret-guarded, DB-only `/api/cron/sync-status` freshness route with per-set staleness verdict (SYNC-04, SYNC-02)
- [x] 34-04-PLAN.md — DEBT-05: DB-backed Vitest path + committed deck-resolution test over every deck, corrections, CONCERNS.md rewrite (DEBT-05)
- [x] 34-05-PLAN.md — Quick-add reports skipped collector numbers instead of dropping them; collection-page shortfall copy (DEBT-05)
- [x] 34-06-PLAN.md — CHECKPOINT: confirm this project's Vercel Fluid Compute status and function max duration (SYNC-01)

**Wave 3** *(blocked on 34-01, 34-02, 34-06)*

- [x] 34-07-PLAN.md — Cron entrypoint: explicit `maxDuration`, one shared set list, unconditional cache invalidation, non-2xx on any shortfall (SYNC-01, SYNC-03)

**Wave 4** *(gap closure — blocked on 34-01, 34-07)*

- [ ] 34-08-PLAN.md — GAP CLOSURE: per-set try/catch isolation in `syncAllCards()` mirroring `syncPrices()`, so a rejected fetch / malformed body / DB error / unresolved-swudbId throw lands in `failedSets` instead of collapsing the run into a bodyless 500 (SYNC-01, SYNC-03)

### Phase 35: Shared Variant State Foundation

**Goal:** The collection, trade, and want sections for a card's variants read from one shared state source instead of three independent ones — a change in one section is reflected in the others immediately, a save triggers one `router.refresh()` instead of three, and a failed write has an inline home to surface on. This is the BLOCKING prerequisite the catalog drawer (Phase 36) needs before it can safely render all three sections at once
**Depends on:** Phase 33 (v7 complete) — functionally independent of Phase 34
**Requirements:** CATALOG-08, CATALOG-07, UISTATE-03
**Success Criteria** (what must be TRUE):

  1. Adjusting a card's owned count in the collection section immediately makes that card available to offer for trade elsewhere on the same view — no page reload required, closing the stale-trade-availability bug tracked in the pending todo (`2026-07-20-stale-trade-availability-after-collection-add-on-binder-mana.md`) (CATALOG-07)
  2. The collection, trade, and want sections read from one shared state source — a value changed in one section is visible in the others while the view stays open (CATALOG-08)
  3. Saving a change triggers exactly one `router.refresh()` call, not the three independent calls the sections make today (CATALOG-08)
  4. A write that fails shows its error inline on the affected row, the value visibly reverts, and a Retry action is available (UISTATE-03)

**Notes:**

- Verify through the sections' EXISTING consumers — the binder's `VariantTradeSheet` (`/binder/manage`) and the card detail page (`/cards/[set]/[id]`) — since the catalog drawer itself doesn't exist until Phase 36.
- Resolves open risk 8 (prop contract mismatch: the detail page passes no `onQuantityChange` to `VariantTradeSection` while the sheet does) as a byproduct of the shared state lift.
- Should settle open risk 9 (whether the detail page and the sheet should render the same section membership) — both consume the same lifted state going forward; decide explicitly rather than leaving it implicit.
- Open risk 7 (multi-failure error stacking) is not meaningfully testable until Phase 36 puts more steppers in front of a user at once (the drawer) — note it, don't chase it here.

**Plans:** TBD
**UI hint**: yes

### Phase 36: Touch-Viable Tile Contract & Catalog Drawer

**Goal:** The shared card tile component (`card-item.tsx`, consumed by both the catalog and the deck-builder selector) no longer navigates anywhere — it renders art and state only, a tap in the catalog opens the ported variant drawer for full own/trade/want editing, and a dedicated affordance still reaches the detail page. Because TILE-02 removes the tile-wide `<Link>` in both modes at once, this phase also keeps the deck-builder selector functional in the interim with a minimal off-tile control — the full redesigned control surface is Phase 37's job, not this one
**Depends on:** Phase 35 (BLOCKING — the drawer needs the shared variant state before it can safely render collection/trade/want together)
**Requirements:** TILE-01, TILE-02, TILE-03, TILE-04, CATALOG-05, CATALOG-06
**Success Criteria** (what must be TRUE):

  1. Tapping a card tile in the catalog or the deck builder no longer navigates anywhere — the tile-wide `<Link>` is removed at every breakpoint, in both modes, within this phase (TILE-01, TILE-02)
  2. From either grid, a user can still reach a card's detail page via a dedicated focusable affordance that is separate from the tile tap (TILE-03)
  3. In the catalog, tapping a tile opens a variant drawer — ported from `VariantTradeSheet` — where the user can adjust owned, trade-offer, and want quantities for any printing without leaving the catalog (CATALOG-05, CATALOG-06)
  4. Every interactive target on the tile, in the drawer, and in the detail-page affordance is at least 44px (TILE-04, scoped to the surfaces this phase ships — the merged bottom bar and desktop sidebar controls get their own 44px criterion in Phase 37)
  5. Deck building stays fully possible from the grid through this phase: because the tile no longer navigates or hosts hover controls, selecting a deck-builder tile reveals a minimal, functional off-tile add/remove stepper (not yet the merged mobile bottom bar or the desktop sidebar placement) — this interim control is what stands between removing the `<Link>` here and Phase 37 shipping the real redesign (TILE-02 — interim coherence, no dedicated requirement ID)

**Notes:**

- Interim selector behaviour, stated plainly: selecting a tile in the deck builder shows a small, functional add/remove stepper appended below the grid — off the tile itself (satisfying TILE-01's "no controls on the tile"), but not yet merged into a bottom bar or integrated into the sidebar. It exists solely so removing the tile-wide `<Link>` doesn't leave the deck builder unusable between this phase and Phase 37. Phase 37 deletes this placeholder outright and replaces it with the redesigned surface (SELECT-01..04) — the two must not coexist once Phase 37 ships.
- Carries open risks from the sketch wrap-up concerning this phase's surfaces:
  1. The corner ⓘ affordance measures 22px, below the 44px floor — long-press is the real target and needs device testing; fallback is promoting ⓘ into the control surface.
  3. Long-press has no accessible equivalent — the corner ⓘ must remain a real focusable button, not solely a gesture.
  4. Long-press can fire during a slow scroll — needs a movement threshold to cancel it.
  5. `useColumnCount()` reads window width while `estimateSize` reads container width (`card-grid.tsx:17-27` vs `:78`); with the 320px sidebar present they disagree, which is the mechanism behind the ~68px desktop tiles — confirm whether that's intentional or a latent bug while touching this file.
- Keeping controls off the tile itself preserves the existing virtualizer `estimateSize` heuristic (`card-grid.tsx:80`).
- Open risk 7 (multi-failure error stacking) is not meaningfully testable until this phase puts more steppers in front of a user at once (the drawer) — note it, don't chase it here.

**Plans:** TBD
**UI hint**: yes

### Phase 37: Touch-Viable Deck Selector

**Goal:** Phase 36's interim off-tile stepper is replaced by the fully redesigned, always-visible selector surface — merged into one ~64px mobile bottom bar carrying the deck count, and into the existing 320px desktop sidebar above deck stats — with no hover dependency anywhere, the stats trigger back in the layout flow, and the selected tile showing its correct owned-variant art
**Depends on:** Phase 36 (replaces the interim placeholder it ships, and attaches to the shared tile contract it establishes)
**Requirements:** SELECT-01, SELECT-02, SELECT-03, SELECT-04, DEBT-02
**Success Criteria** (what must be TRUE):

  1. Selecting a card in the deck builder surfaces always-visible add/remove controls with no hover dependency on any device — Phase 36's interim placeholder is removed, not left in place alongside this surface (SELECT-01)
  2. On mobile, the selected card's add/remove controls and the deck count share one merged ~64px bottom bar (SELECT-02)
  3. On desktop, the selected card's add/remove controls appear in the existing sidebar above the deck stats (SELECT-03)
  4. The deck builder's stats trigger participates in the layout flow rather than overlapping content — no longer `fixed` (SELECT-04)
  5. Every interactive target in the bottom bar and sidebar controls introduced by this phase is at least 44px (extending TILE-04's floor to the surfaces this phase ships), and the selected tile renders its correct owned-variant art via `getPrintingArtMap()` instead of a generic default (DEBT-02)

**Notes:**

- Carries open risk 2: the deck count doubles as both a display and a button inside the merged bottom bar — discoverability is unverified.
- UISTATE-04 (error vocabulary for non-drawer optimistic writes) is explicitly out of this milestone's scope — the bottom bar and sidebar controls built here still fail silently on a failed write; deferred as a future requirement.
- Two mutation surfaces (ambient bar for the selector, modal drawer for the catalog) is the accepted design (settled by omission in sketch 004), not a gap — Phase 36 built the drawer side of that pair; this phase completes the ambient-bar side.

**Plans:** TBD
**UI hint**: yes

### Phase 38: Grid State Vocabulary

**Goal:** Every card grid in the app — catalog, manage binder, deck builder — presents one consistent idle/loading/empty/error treatment, replacing `empty-state.tsx` and the inline blocks at `manage/page.tsx:385-407`, with skeleton tiles instead of a spinner while loading
**Depends on:** Phase 33 (v7 complete) — not technically blocked by Phases 34–37; sequenced last to close out the milestone's UI work once the tile shapes it needs to skeleton (Phase 36) are settled
**Requirements:** UISTATE-01, UISTATE-02
**Success Criteria** (what must be TRUE):

  1. A card grid shows skeleton tiles while its data is loading — never a spinner (UISTATE-02)
  2. A card grid shows one consistent empty-state treatment when no cards match the current filters, used everywhere a grid can be empty (UISTATE-01)
  3. A card grid shows one consistent error-state treatment when a fetch fails, visually distinct from the empty-result state (UISTATE-01)

**Notes:**

- This is the one grid-state component from sketch 005 (idle/loading/empty/error) — distinct from UISTATE-03's inline per-row write-error handling, which already landed in Phase 35.
- Open risk 7 (multi-failure error stacking) concerns write errors, not grid fetch errors, and stays out of this phase's scope.

**Plans:** TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1–5.2 | v1 | 22/22 | ✅ Complete | 2026-05-07 |
| 6–10.1 | v2 | 16/16 | ✅ Complete | 2026-05-12 |
| 11 | v3 | 3/3 | ✅ Complete | 2026-05-12 |
| 12 | v3 | 3/3 | ✅ Complete | 2026-05-13 |
| 13 | v3 | 3/3 | ✅ Complete | 2026-05-13 |
| 14 | v3 | 3/3 | ✅ Complete | 2026-05-13 |
| 15 | v4 | 3/3 | ✅ Complete | 2026-05-14 |
| 15.1 | v4 | 1/1 | ✅ Complete | 2026-05-15 |
| 16 | v4 | 4/4 | ✅ Complete | 2026-05-15 |
| 16.1 | v4 | 1/1 | ✅ Complete | 2026-05-15 |
| 17 | v4 | 10/10 | ✅ Complete | 2026-05-20 |
| 17.1 | v4 | 2/2 | ✅ Complete | 2026-05-20 |
| 18 | v4 | 3/3 | ✅ Complete | 2026-05-20 |
| 19 | v4 | 2/2 | ✅ Complete | 2026-05-20 |
| 20 | v4 | 1/1 | ✅ Complete | 2026-05-20 |
| 21 | v4 | 4/4 | ✅ Complete | 2026-05-23 |
| 22 | v4 | 3/3 | ✅ Complete | 2026-05-23 |
| 23 | v5 | 4/4 | Complete    | 2026-05-26 |
| 24 | v5 | 6/6 | Complete   | 2026-05-27 |
| 25 | v5 | 3/3 | Complete    | 2026-05-27 |
| 25.1 | v5 | 1/1 | Complete | 2026-05-27 |
| 26 | v6 | 5/5 | Complete   | 2026-05-29 |
| 27 | v6 | 4/4 | Complete   | 2026-06-02 |
| 28 | v6 | 2/2 | Complete    | 2026-06-03 |
| 29 | v6 | 5/5 | Complete    | 2026-06-03 |
| 30. Unified Search-Driven Add Flow | v7 | 3/3 | Complete    | 2026-07-19 |
| 31. Trade Profile Modal & Public Trade Note | v7 | 4/4 | Complete    | 2026-07-20 |
| 32. Combined Wants & Exclusions List | v7 | 3/3 | Complete    | 2026-07-20 |
| 33. Ashes of the Empire Spotlight Decks | v7 | Direct | Complete    | 2026-07-20 |
| 34. Card Sync Reliability | v8 | 7/7 | Complete   | 2026-08-16 |
| 35. Shared Variant State Foundation | v8 | 0/TBD | Not started | - |
| 36. Touch-Viable Tile Contract & Catalog Drawer | v8 | 0/TBD | Not started | - |
| 37. Touch-Viable Deck Selector | v8 | 0/TBD | Not started | - |
| 38. Grid State Vocabulary | v8 | 0/TBD | Not started | - |
