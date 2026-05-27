# Milestones — Star Wars Unlimited Tracker

## v5 Trade Binder & Performance — Shipped 2026-05-27

**Phases:** 4 (23, 24, 25, 25.1)
**Plans:** 15
**Timeline:** 2026-05-25 → 2026-05-28 (4 days)
**Requirements:** 9 addressed (BINDER-07/08/09, PERF-01–06); PERF-01–05 code-complete, post-deploy UAT pending
**LOC delta:** +15,955 / −422 across 242 files

### Delivered

Looking For tiles now show variant badges on public binders (BINDER-07), card detail pages expose an "Available for Trade" section for per-variant trade offer management (BINDER-08), and the Manage Binder page was redesigned around collection-driven discovery with a VariantTradeSheet panel (BINDER-09). Catalog filter response reduced to ≤200ms via 150ms debounce + RSC caching; CardGrid virtualized with @tanstack/react-virtual eliminating layout shift. Bulk operations (Quick Add, CSV Import) refactored to single-round-trip batch upserts — eliminates Vercel 504 timeouts for 1,000-card collections, with live card-count progress text. New deck skeleton fires immediately via loading.tsx Suspense boundary. @vercel/speed-insights@2.0.0 wired into root layout for Web Vitals capture (PERF-06).

### Key Accomplishments

1. Phase 23: Variant badge UI on Looking For tiles + Card Detail "Available for Trade" section (BINDER-07/08/09) — complete with printing-level manual wants schema migration
2. Phase 24: 150ms search debounce + RSC `use cache` + `cacheTag` on catalog — filter changes instant, warm LCP reduced (PERF-01/02)
3. Phase 24: @tanstack/react-virtual CardGrid — windowed rendering + fixed-dimension containers eliminate CLS; first-row eager, below-fold lazy (PERF-03)
4. Phase 25: `batchIncrementVariantCounts` + `batchUpsertVariantCounts` replace N+M Neon round-trips — no more 504 for 1,000 cards (PERF-04 backend)
5. Phase 25: Live card-count progress text + animate-pulse deck skeleton via loading.tsx (PERF-04 UI + PERF-05)
6. Phase 25.1 (INSERTED — urgent): @vercel/speed-insights@2.0.0 in root layout, 100% sample rate, all pages instrumented (PERF-06)

### Post-Deploy UAT (acknowledged at close)

- Phase 24: RSC cache warm-path + LCP measurement require preview deployment
- Phase 25: Vercel timeout elimination + batch upsert semantics require live Neon DB
- Phase 25.1: Web Vitals data flow requires Speed Insights enabled in Vercel dashboard

### Archive

- `.planning/milestones/v5-ROADMAP.md` — full phase details
- `.planning/milestones/v5-REQUIREMENTS.md` — all requirements with outcomes

---

## v1 MVP — Shipped 2026-05-07

**Phases:** 7 (1, 2, 3, 4, 5, 5.1, 5.2)
**Plans:** 22
**Timeline:** 2026-05-03 → 2026-05-07 (5 days)
**LOC:** ~4,757 TypeScript/TSX
**Requirements:** 15/15 satisfied

### Delivered

Complete core loop: card catalog auto-synced from swu-db.com, collection tracking with CSV import, deck builder with legality enforcement and ownership overlay, want list showing exactly which cards each deck is missing — including Leader and Base shortfalls.

### Key Accomplishments

1. Full card catalog seeded from swu-db.com API with daily Vercel Cron sync (4,400+ cards)
2. Browse/search/filter catalog with 8 filter dimensions (set, type, aspect, arena, trait, rarity, keyword, cost) — all URL-synced via nuqs
3. Collection tracking with inline owned-count overlay; bulk import from generic CSV and community Reddit SWU spreadsheet format
4. Deck builder with SWU Premier legality enforcement, owned-count overlay, shortfall highlights, and Melee/JSON export
5. Per-deck and combined want lists with exact shortfall quantities — extended in Phase 5.1 to include Leader and Base card shortfalls
6. Rarity filter fully implemented (Phase 5.2 closed hardcoded bypass discovered by milestone audit)

### Known Tech Debt at Close

- Nyquist compliance: no phase is fully compliant; Phases 2, 3, 5 missing or informal VERIFICATION.md artifacts
- Phase 3 SUMMARY.md files not produced (plans 03-01 through 03-04)
- N+1 resolvePrinting() in getDeckCardsForUser() — acceptable for v1; batch join deferred to v2

### Archive

- `.planning/milestones/v1-ROADMAP.md` — full phase details
- `.planning/milestones/v1-REQUIREMENTS.md` — all requirements with outcomes
- `.planning/milestones/v1-MILESTONE-AUDIT.md` — pre-close gap audit

---

## v2 Multi-User, Market, Decks & Trading — Shipped 2026-05-12

**Phases:** 5 (6, 7, 8→abandoned, 9, 10, 10.1)
**Plans:** 16
**Timeline:** 2026-05-07 → 2026-05-12
**Requirements:** 12/12 satisfied

### Delivered

Multi-user authentication (Email, Google, Discord), per-user data isolation, EUR/USD market pricing via PokéWallet API, 10-card sideboard with rules enforcement and cost curve overlay, and public shareable trade binders with catalog filters and "Looking For" lists.

### Key Accomplishments

1. Better Auth integration — Email, Google, Discord OAuth with per-user row-level isolation across all DB tables
2. EUR/USD market prices via PokéWallet API with daily sync and deck total valuation
3. 10-card sideboard with SWU rules enforcement and cost curve breakdown overlay
4. Public trade binders at `/binder/[username]` with full catalog filter integration
5. Phase 8 (DOTD deal-of-the-day) abandoned mid-execution — swustats.net API unreliable; pivot saved 2+ phases of blocked work
6. Phase 10.1 inserted to fix want list shortfall when leader/base cards were absent from user binder

### Archive

- `.planning/milestones/v2-ROADMAP.md` — full phase details
- `.planning/milestones/v2-REQUIREMENTS.md` — all requirements with outcomes
- `.planning/milestones/v2-MILESTONE-AUDIT.md` — pre-close gap audit

---

## v3 Catalog, Home & Binder Polish — Shipped 2026-05-13

**Phases:** 4 (11, 12, 13, 14)
**Plans:** 12
**Timeline:** 2026-05-12 → 2026-05-13
**Requirements:** 10/12 (2 deferred to v4 by design)

### Delivered

New home page at `/`, sticky catalog sidebar with all filters, support for all card variant types (Showcase, Prestige, Serialized, Hyperspace, TS26 set), owned-only filter in catalog and deck builder, and full-width public binder with automatic deck-driven want management.

### Key Accomplishments

1. New home page at `/` — Hero section with CTAs + "Highest Value Cards" 10-card grid; catalog migrated to `/cards`
2. Sticky catalog sidebar (swu.fan-style) with all 8 filter dimensions and independent scroll
3. Variant support in sync + UI: Showcase, Prestige, Serialized, Hyperspace all tracked; TS26 set unblocked
4. Owned-only toggle in catalog and deck builder — URL-persisted via nuqs; TDD approach
5. Full-width public binder (`/binder/[username]`) + `autoWants[]` in manage page with optimistic exclusion UI
6. Base UI 1.4.1 (Switch, Tooltip) established as the headless primitive standard (no Radix)

### Archive

- `.planning/milestones/v3-ROADMAP.md` — full phase details
- `.planning/milestones/v3-REQUIREMENTS.md` — all requirements with outcomes

---

## v4 Deck Builder & Collection Depth — Shipped 2026-05-23

**Phases:** 11 (15, 15.1, 16, 16.1, 17, 17.1, 18, 19, 20, 21, 22)
**Plans:** 34
**Timeline:** 2026-05-14 → 2026-05-23 (10 days)
**Requirements:** 12/12 satisfied (2 acknowledged docs gaps at close)
**LOC:** ~10,000 TS/TSX in src/

### Delivered

Per-variant collection tracking with +/- controls on card detail page, catalog variant art display with ownership-based precedence, deck list grouped by card type with art and aspect panel, guided empty-deck onboarding, starter deck quick-add (20+ decks), unified variant filter, CSV variant import, and a full schema migration to per-variant trade offerings with binder variant badges.

### Key Accomplishments

1. Deck list grouped by card type (Ground/Space Units, Upgrades, Events) with leader/base art and row hover art — Phase 15
2. Empty deck guided onboarding: auto-filter to Leader+Base first, then aspects of chosen leader/base pair — Phase 16
3. Per-variant collection tracking (+/- controls for Normal/Foil/Hyperspace/Showcase/Prestige) on card detail page — Phase 17
4. Catalog shows highest-owned variant art (Showcase > Hyperspace Foil > Hyperspace > Foil > Normal precedence) — Phase 18
5. Quick-add 20+ pre-constructed decks (TS26, IBH, SEC, LOF, JTL, LAW spotlight decks) from collection page — Phases 18 + 22
6. Schema migration: `user_trade_offerings` table keyed by `cardPrintingId`; Foil/Showcase/etc. variant badges on public binder tiles — Phase 21

### Known Tech Debt at Close

- `CollectionControls` dead code (0 imports) — calls deleted endpoint; delete in v5
- DeckBuilder Add Cards tab missing `getPrintingArtMap()` — no variant art override in deck builder catalog (v5)
- `Prestige Foil` absent from `VARIANT_OPTIONS`; `Serialized` missing from `VARIANT_PRECEDENCE` (v5)
- Catalog collection state not invalidated after card detail page mutation (v5)
- LAW spotlight deck: 9 spotlight-exclusive cards absent from Neon DB, commented-out TODOs in `starter-decks.ts` (v5, pending DB sync)

### Known Deferred Items at Close

- Phase 19: no VERIFICATION.md (implementation confirmed via SUMMARY.md evidence)
- Phase 20: no VERIFICATION.md (manual verification noted in SUMMARY.md)

### Archive

- `.planning/milestones/v4-ROADMAP.md` — full phase details
- `.planning/milestones/v4-REQUIREMENTS.md` — all requirements with outcomes
- `.planning/milestones/v4-MILESTONE-AUDIT.md` — pre-close gap audit
