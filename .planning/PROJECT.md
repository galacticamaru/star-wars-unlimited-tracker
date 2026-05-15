# Star Wars Unlimited Tracker

## What This Is

A multi-user web app for Star Wars: Unlimited TCG players. Players track their card collection and build decks in one place — so they always know what they own while building decks and exactly what cards they still need to acquire. Features a public trade binder system, market pricing, and a polished catalog with advanced filtering.

> **v1 shipped 2026-05-07.** Single-user personal tool (no auth). Full core loop delivered.
> **v2 shipped 2026-05-12.** Multi-user (auth), market pricing, sideboard support, and public trade binders.
> **v3 shipped 2026-05-13.** New home page, sticky catalog sidebar, variant support, owned-only filter, and automatic trade wants.

## Current Milestone: v4.0 Deck Builder & Collection Depth

**Goal:** Polish the deck builder UX and deepen collection tracking with variant awareness and quick-add flows.

**Target features:**
- Deck list grouped by card type, with card art and aspect breakdown panel
- Empty deck guided onboarding (auto-filter to leader+base, then by aspects)
- Variant-aware collection tracking on card detail page
- Catalog shows highest-owned variant art
- Quick-add pre-constructed deck cards to collection

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

### Active (v4)

- [ ] Variant-aware collection tracking on card detail page (REQ-COLLECT-06, REQ-COLLECT-07)
- [ ] Catalog shows highest-owned variant art (REQ-COLLECT-08)
- [ ] Quick-add pre-constructed deck cards to collection (REQ-CAT-04)

### Out of Scope

- Card trading / marketplace — out of scope, different product
- Mobile native app — web-first; responsive design covers mobile browsers
- Camera scanning (SCAN-01) — ML complexity; CSV/spreadsheet import covers collection migration
- Price history charts — significant complexity, low value for a deck builder
- Buy links / affiliate integration — different product

## Context

**Shipped v3:** 2026-05-13 | **v4 Phase 15 complete:** 2026-05-14 | **v4 Phase 16 complete:** 2026-05-15 | **v4 Phase 16.1 complete:** 2026-05-15
**Stack:** Next.js 16 + TypeScript + Neon PostgreSQL + Drizzle ORM + Better Auth + shadcn/ui + base-ui + nuqs
**Deployment:** Vercel (Hobby tier, daily cron syncs for cards and prices)
**Codebase:** ~22,000 LOC TypeScript/TSX, 48 plans completed across 16 phases
**Auth:** Better Auth (Email, Google, Discord) with per-user data isolation
**Card data:** swu-db.com API auto-sync; PokéWallet API for market prices

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

*Last updated: 2026-05-15 — Phase 16.1 complete (tab reorder polish)*
