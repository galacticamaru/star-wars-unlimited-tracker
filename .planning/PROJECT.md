# Star Wars Unlimited Tracker

## What This Is

A multi-user web app for Star Wars: Unlimited TCG players. Players track their card collection and build decks in one place — so they always know what they own while building decks and exactly what cards they still need to acquire. Features a public trade binder system, market pricing, and a polished catalog with advanced filtering.

> **v1 shipped 2026-05-07.** Single-user personal tool (no auth). Full core loop delivered.
> **v2 shipped 2026-05-12.** Multi-user (auth), market pricing, sideboard support, and public trade binders.
> **v3 shipped 2026-05-13.** New home page, sticky catalog sidebar, variant support, owned-only filter, and automatic trade wants.
> **v4 shipped 2026-05-20.** Deck builder polish (type grouping, art, aspect panel, guided onboarding), per-variant collection tracking, catalog variant art, and starter deck quick-add.
> **v4 gap closure complete 2026-05-23.** Per-variant trade offerings (Phase 21) and additional starter/spotlight deck lists (Phase 22) fill remaining REQ-BINDER-06 gap.
> **v5 shipped 2026-05-27.** Binder variant completeness (BINDER-07/08/09), catalog & page load performance, bulk operation speed, and real-user Web Vitals telemetry (PERF-06) via Vercel Speed Insights.
> **v6 shipped 2026-06-03.** Mobile deck builder UX, /decks + /cards/[set]/[id] performance driven by Speed Insights, and a tech-debt sweep (dead code, variant enum gaps, catalog invalidation).
> **v7 shipped 2026-07-20.** Unified search-driven binder add flow, trade profile modal + public trade note, combined wants list, and Ashes of the Empire spotlight decks.

## Current Milestone: v8 Catalog Interaction & Sync Reliability

**Goal:** Make card mutation happen where you are — tap a tile, adjust it, done — at every breakpoint; and make the nightly catalog sync actually finish and say so when it doesn't.

**Target features:**
- Shared variant state refactor — the three variant sections stop owning state independently; collapses three `router.refresh()` calls into one and gives the inline error map a home (**BLOCKING** prerequisite for the drawer)
- Catalog variant drawer — tapping a catalog tile opens the own/trade/want drawer (a port of `VariantTradeSheet`); no detail-page round trip per card
- Touch-viable deck selector — tile-wide `<Link>` removed at every breakpoint, tap selects rather than navigates, controls move off the tile into a merged ~64px mobile bottom bar and the existing 320px desktop sidebar, 44px floor on every real target
- Grid state vocabulary — one `idle / loading / empty / error` component replacing `empty-state.tsx` and the inline blocks at `manage/page.tsx:385-407`; failed optimistic writes surface inline on the failing row with Retry
- Card sync completes inside budget — batched multi-row upserts replacing ~8,400 sequential round trips, plus an explicit `maxDuration`
- Sync partial failure becomes loud — response fails when `setsProcessed < setsTotal`, plus a freshness check so silent drift can't recur
- Carried-forward debt: stale trade availability (`onOwnedCountChange`), DEBT-05 (LAW spotlight deck), DEBT-02 (Add Cards tab variant art)

## Milestone: v7 Trade Binder Improvements — COMPLETE

**Shipped:** 2026-07-20 — Phases 30–33 (10 plans).

**What shipped:**
- Unified search-driven binder add flow — one "Add Cards & Wants" card over the full catalog, ownership-gated add-to-binder with server-enforced 403, add-as-want for any card (Phase 30)
- Trade profile modal & public trade note — username/binder URL behind a profile button, user-level `trade_note` via migration 0006, rendered XSS-safe on the public binder (Phase 31)
- Combined Looking For list — deck-driven auto-wants and manual wants in one two-section list with inline exclude/restore (Phase 32)
- Ashes of the Empire spotlight decks in Quick Add — Luke Skywalker (ASH) and Emperor Palpatine (ASH) (Phase 33)

## Milestone: v6 Mobile, Performance & Polish — COMPLETE

**Shipped:** 2026-06-03 — Phases 26–29 (16 plans).

**What shipped:**
- Mobile deck builder UX — stats in a keyboard-safe bottom sheet, 44px touch targets, overflow-free toolbar below 480px, zero desktop regression (Phase 26)
- /decks + /decks/[id] performance — per-user cache tags, startTransition card interactions, streaming skeletons (Phase 27)
- Tech debt sweep — CollectionControls removed, Prestige Foil/Serialized enum gaps filled, catalog invalidation verified (Phase 28)
- Card detail page performance — cached getCardDefinition, per-user printings, loading skeleton, LCP fixes (Phase 29)

## Milestone: v5 Trade Binder & Performance — COMPLETE

**Goal:** Close the variant gap in the public binder's "Looking For" section, overhaul the add-to-trade workflow, extend card detail pages with a trade-offer section, and measurably improve catalog browsing performance.

**Target features:**
- Looking For tiles on public binder show variant badges (mirrors v4 Available for Trade work)
- Card Detail page gets an "Available for Trade" section — mark quantity, see current offer
- Manage Binder UX overhaul — easier card discovery and add-to-trade flow
- Catalog browsing performance — faster filter response and initial load
- Page load speed (LCP / TTFB), image loading (lazy loading, layout shift)
- Quick Add / CSV Import speed improvements

## Milestone: v4.0 Deck Builder & Collection Depth — COMPLETE

**Shipped:** 2026-05-20 — All 4 phases + 3 polish phases complete.

**What shipped:**
- Deck list grouped by card type, with card art and aspect breakdown panel (Phase 15)
- Empty deck guided onboarding — auto-filter to leader+base, then aspects (Phase 16)
- Variant-aware collection tracking on card detail page with +/- controls (Phase 17)
- Catalog shows highest-owned variant art with Showcase > Hyperspace precedence (Phase 18)
- Quick-add 11 pre-constructed decks (6 starter + 5 spotlight) to collection in one click (Phase 18)

## Core Value

See exactly which cards you own while building decks, and know instantly what you're missing.

## Requirements

### Validated

- ✓ Card catalog auto-syncs from swu-db.com API without manual intervention — v1 (CATALOG-04, Phase 1)
- ✓ User can browse/search/filter the full card catalog with images and metadata — v1 (CATALOG-01, CATALOG-02, CATALOG-03, Phase 2)
- ✓ User can track owned copy counts and update via search & click — v1 (COLLECT-01, COLLECT-02, Phase 3)
- ✓ User can bulk-import collection from generic CSV or community Reddit SWU spreadsheet — v1 (COLLECT-03, CATALOG-04, Phase 3)
- ✓ User can build legal decks (1 Leader + 1 Base + 50-card main deck) with owned-count overlay and shortfall highlights — v1 (DECK-01 through DECK-05, Phase 4)
- ✓ User can view per-deck and combined want lists showing exact missing card quantities — v1 (WANT-01, WANT-02, Phase 5 + 5.1)
- ✓ Catalog rarity filter actually filters results — v1 (Phase 5.2, closed audit gap)
- ✓ Auth & Multi-User: User accounts with email/OAuth and data isolation — v2 (Phase 6)
- ✓ Market Pricing: EUR/USD card prices and deck valuation via PokéWallet API — v2 (Phase 7)
- ✓ Sideboard Support: 10-card sideboard with rules enforcement and cost curve overlay — v2 (Phase 9)
- ✓ Trade Binder: Public shareable trade binders with catalog filters and "Looking For" lists — v2 (Phase 10 + 10.1)
- ✓ New Home Page: Dedicated `/` route with Hero, CTAs, and "Highest Value Cards" grid — v3 (Phase 11)
- ✓ Catalog Evolution: Sticky sidebar, variant support (Showcase, Prestige, Serialized), TS26 set — v3 (Phase 12)
- ✓ Owned-Only Filter: Toggle in catalog sidebar and deck builder card browser — v3 (Phase 13)
- ✓ Trade Binder Polish: Full-width public binder, automatic deck-driven wants in manage page — v3 (Phase 14)
- ✓ Deck List grouped by card type — Ground/Space Units, Upgrades, Events — v4 (REQ-DECK-07, Phase 15)
- ✓ Aspect breakdown panel in deck stats sidebar — v4 (REQ-DECK-08, Phase 15)
- ✓ Card art in Deck List tab — leader/base images + hover art on rows — v4 (REQ-DECK-10, Phase 15)
- ✓ Empty deck guided onboarding — auto-filter to leader+base, then aspects — v4 (REQ-DECK-09, Phase 16)
- ✓ Per-variant collection tracking on card detail page — Normal/Foil counts, +/- controls, total line — v4 (REQ-COLLECT-06, REQ-COLLECT-07, Phase 17)
- ✓ Catalog shows highest-owned variant art (Showcase > Hyperspace Foil > Hyperspace > Foil > Normal precedence) — v4 (REQ-COLLECT-08, Phase 18)
- ✓ Quick-add pre-constructed deck cards to collection — 11 decks (6 starter + 5 spotlight), additive increment — v4 (REQ-CAT-04, Phase 18)
- ✓ Variant-aware trade offerings — per-printing `user_trade_offerings` table; Foil/Showcase/etc. badge on public binder tiles — v4 gap closure (REQ-BINDER-06, Phase 21)
- ✓ Looking For tiles on public binder show variant type badge — v5 (BINDER-07, Phase 23)
- ✓ Card Detail page has "Available for Trade" section — mark quantity, view/edit current offer — v5 (BINDER-08, Phase 23)
- ✓ Manage Binder page — collection-driven discovery, VariantTradeSheet, manual-wants chip selector — v5 (BINDER-09, Phase 23)
- ✓ Catalog filter response time measurably reduced — search debounced, virtual list rendering — v5 (PERF-01, Phase 24)
- ✓ Page load speed improved — LCP and TTFB reduced for catalog and binder routes — v5 (PERF-02, Phase 24)
- ✓ Card image loading improved — lazy loading, no layout shift — v5 (PERF-03, Phase 24)
- ✓ Quick Add and CSV Import provide progress feedback and complete faster — v5 (PERF-04, Phase 25)
- ✓ Real-user Web Vitals captured via @vercel/speed-insights; every page instrumented — v5 (PERF-06, Phase 25.1)
- ✓ Deck builder fully usable on mobile — stats bottom sheet, tappable cards, no sidebar overlap, zero desktop regression — v6 (MOBILE-01, MOBILE-02, Phase 26)
- ✓ /decks and /decks/[id] LCP/TTFB improved — per-user cache tags, startTransition interactions, streaming skeletons — v6 (PERF-07, PERF-08, Phase 27)
- ✓ Tech debt swept — CollectionControls removed, Prestige Foil/Serialized enum gaps filled, catalog invalidation verified — v6 (DEBT-01, DEBT-03, DEBT-04, Phase 28)
- ✓ `/cards/[set]/[id]` card detail page — cached `getCardDefinition`, per-user printings, loading skeleton, `priority` prop, LCP opacity-transition fix — v6 (PERF-10, Phase 29)
- ✓ Unified search-driven binder add flow — one "Add Cards & Wants" card over the full catalog; add-to-binder gated on ownership (server-enforced 403), add-as-want for any card; old Add Cards grid + Manual Wants box removed — v7 (Phase 30)
- ✓ Search-first results — nothing fetched/rendered until the user types 2 chars; catalog + owned-cards fetched once (debounced, retryable) on first qualifying keystroke — v7 (Phase 30)
- ✓ Combined Looking For list — deck-driven auto-wants and manual wants in one two-section list (Deck Wants over Manual Wants, no standalone Exclusions section); inline exclude/restore for auto-wants including orphaned exclusions; manual-want quantity stepper + remove — v7 (BINDER-18, BINDER-19, BINDER-20, Phase 32; BINDER-19 orphaned-exclusion regression closed via gap plan 32-03)
- ✓ Trade profile modal & public trade note — username/binder URL behind a profile-button modal; new user-level `trade_note` (schema migration 0006) settable and rendered XSS-safe on the public binder — v7 (Phase 31)
- ✓ Ashes of the Empire spotlight decks — Luke Skywalker (ASH) & Emperor Palpatine (ASH) in Quick Add, each a legal 1 leader + 1 base + 50 main-deck list; all 50 cards verified in the catalog DB — v7 (DECK-11, DECK-12, Phase 33)

### Active

<!-- v8 scope. Defined 2026-08-16 via /gsd-new-milestone. REQ-IDs assigned in REQUIREMENTS.md. -->

- [ ] Shared variant state refactor — three variant sections share state; one `router.refresh()`; inline error map has a home (**BLOCKING** for the drawer)
- [ ] Catalog variant drawer — tap a catalog tile to own/trade/want without navigating to the detail page
- [ ] Touch-viable deck selector — no tile-wide `<Link>`, controls off-tile, merged 64px mobile bottom bar, desktop sidebar hosts selected-card controls, 44px targets
- [ ] Grid state vocabulary — one `idle / loading / empty / error` component; inline per-row write errors with Retry
- [ ] Card sync completes inside its Vercel budget — batched upserts, explicit `maxDuration`
- [ ] Sync partial failure is loud — `setsProcessed < setsTotal` fails the response; freshness check
- [ ] Stale trade availability fixed — `onOwnedCountChange` threaded (absorbed into the shared-state refactor)
- [ ] **DEBT-05**: LAW spotlight deck unknowns resolved
- [ ] **DEBT-02**: DeckBuilder Add Cards tab displays variant art via `getPrintingArtMap()`

<details>
<summary>v7 items (all validated 2026-07-20)</summary>

- [x] Trade profile modal behind a profile button — username + public trade note — validated in Phase 31
- [x] Cleaner combined wants list — auto-wants + manual wants, exclusion hides auto-wants — validated in Phase 32
- [x] Public binder displays the trade note — validated in Phase 31
- [x] Unified search-driven add flow — validated in Phase 30
- [x] ASH spotlight decks in Quick Add — validated in Phase 33

</details>

### Out of Scope

- Card trading / marketplace — out of scope, different product
- Mobile native app — web-first; responsive design covers mobile browsers
- Camera scanning (SCAN-01) — ML complexity; CSV/spreadsheet import covers collection migration
- Price history charts — significant complexity, low value for a deck builder
- Buy links / affiliate integration — different product

## Context

**Shipped v3:** 2026-05-13 | **v4 shipped:** 2026-05-20 (Phases 15–18 + 3 polish complete)
**Stack:** Next.js 16 + TypeScript + Neon PostgreSQL + Drizzle ORM + Better Auth + shadcn/ui + base-ui + nuqs
**Deployment:** Vercel (Hobby tier, daily cron syncs for cards and prices)
**Codebase:** ~23,000 LOC TypeScript/TSX, 72 plans completed across 29 phases (incl. polish)
**Phase 29 complete 2026-06-03:** Card detail page performance — `getCardDefinition` cached on `cards` tag, per-user printings cached, loading skeleton, `priority` LCP hint, and opacity-transition guard (PERF-10)
**Auth:** Better Auth (Email, Google, Discord) with per-user data isolation
**Card data:** swu-db.com API auto-sync; PokéWallet API for market prices

**Catalog sync state (measured 2026-08-16, read-only DB query):**
- 33 sets, 8,404 printings, 2,596 definitions. LAW is present and **complete** — 901 printings, matching the swu-db API's 901 exactly
- Only 3–4 sets carry a `06:15` cron timestamp (LOF 2026-08-15; PSHD/SHDOP 2026-08-07). Every other set is frozen at the `01:26–01:32` manual `db:seed` of 2026-07-05 — six weeks of drift
- Cause: `syncAllCards` walks sets sequentially and `upsertCards` awaits **one round trip per definition and per printing** (~8,400+), then runs `syncPrices()` in the same request. `src/app/api/cron/sync-cards/route.ts` exports no `maxDuration`. The run cannot finish inside any Vercel budget; `/sets` returns sets in arbitrary order, so a different handful lands each night
- Failure is silent: a failed set `continue`s with a `console.error`, and the route returns `success: true` while `setsProcessed < setsTotal` goes unread
- **DEBT-05 correction:** its recorded cause ("9 cards absent from DB — pending DB sync") is disproven. LAW has been fully synced since 2026-07-05, so the 9 unknowns are a name/subtitle **matching** problem in the spotlight deck list, not missing data

**Design inputs for v8 (settled, not open):**
- `.planning/notes/catalog-interaction-model.md` — root cause: the catalog tile's primary action is *navigate*, with mutation as a hover overlay bolted on top
- `.planning/sketches/WRAP-UP-SUMMARY.md` — sketches 001–005 complete, frontier queue empty, 9 open risks carried forward as planning inputs
- `.planning/seeds/catalog-variant-drawer.md` — consumed by this milestone
- Skill `sketch-findings-star-wars-unlimited-tracker` auto-loads the validated patterns during UI implementation
- Measured: mobile 390px → 3 cols → ~118px tile; desktop `lg` deck builder → 9 cols → ~68px tile; a stepper needs ~180px. Desktop tiles are *smaller* than mobile ones, so on-tile controls fail at every width

**Architecture decisions held:**
- Two-table model (card_definitions + card_printings) is non-negotiable
- Better Auth for multi-tenant support
- integer columns for prices (cents) to avoid floating point issues
- Sideboard as boolean flag on deck_cards
- Usernames for public binder slugs
- nuqs for all URL-persisted filter state

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js full-stack | Single repo, simpler Vercel deployment, SSR for card browsing | ✓ Good |
| Local PostgreSQL card cache | avoids proxying swu-db.com; sync job works, cache keeps catalog fast | ✓ Good |
| Two-table card model | Separates card identity from print variants; enables variant tracking | ✓ Good |
| nuqs for URL state | Snappy filters, shareable URLs, avoids useState proliferation | ✓ Good |
| Better Auth | Industry standard, supports Email/OAuth, easy integration with Drizzle | ✓ Good |
| Integer cents for prices | Avoids floating point precision issues in currency calculations | ✓ Good |
| Phase 8 (DOTD) Abandonment | swustats.net API was unreliable; pivoting saved development time | ✓ Good |
| Username slugs for binders | Improves social discoverability and shareable URL aesthetics | ✓ Good |
| Fixed-height container for catalog (100svh - 56px) | Enables independent sidebar + main content scroll | ✓ Good |
| Base UI over Radix for Switch/Tooltip | Project constraint established in v3; consistent across components | ✓ Good |
| auto-wants inline in getUserTradeData() | Keeps change self-contained; avoids premature abstraction | ✓ Good |
| toggleExclusion reused for auto-want rows | No new API surface needed; existing endpoint handles both flows | ✓ Good |
| Server-side ownership gate on PATCH /api/trade (gates only on tradeQuantity > 0) | Defence-in-depth behind the client disable; clearing an offering must always succeed. Hardened with numeric-type validation (CR-01) to close a NaN-bypass | ✓ Good — Phase 30 |
| VariantWantSection as a twin of VariantTradeSection | Wants are unrestricted by ownership (D-06); a parallel component avoids overloading the trade stepper's gating logic | ✓ Good — Phase 30 |
| Sheet printings re-derived live from mergedCards each render | Keeps ownedCount/tradeQuantity/quantity fresh while the sheet is open instead of freezing tile-click snapshot | ✓ Good — Phase 30 |
| Catalog tile shows art and reports state only — never hosts controls, never a `<Link>` | Desktop tiles (~68px) are smaller than mobile ones (~118px) and a stepper needs ~180px, so on-tile controls fail at every width. One contract, one codepath; also preserves the virtualizer `estimateSize` heuristic | — Pending — v8 (sketches 001–003) |
| Two mutation surfaces — ambient bar for the selector, modal drawer for the catalog | One number vs twelve. Presented as a coherence check in sketch 004 and not contested | — Pending — v8 |
| Failed optimistic writes surface inline on the failing row, not as a toast | Attribution: a drawer holds 12 steppers. A 4-second toast recreates the silent revert it was meant to fix | — Pending — v8 (sketch 005) |

## Constraints

- **Vercel Hobby tier:** 1 cron job per day limit (multiplexed sync tasks)
- **External API dependency:** swu-db.com (cards), PokéWallet (prices)
- **No @radix-ui imports:** Base UI (@base-ui/react) only for headless primitives

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New decisions? → Add to Key Decisions table
4. Context changed? → Update Context section

---

*Last updated: 2026-08-16 after starting milestone v8 Catalog Interaction & Sync Reliability*
