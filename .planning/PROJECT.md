# Star Wars Unlimited Tracker

## What This Is

A single-user web app for Star Wars: Unlimited TCG players. Players track their card collection and build decks in one place — so they always know what they own while building decks and exactly what cards they still need to acquire. Replaces the fragmented workflow of a spreadsheet for collection tracking plus a separate deck-building tool (like SWUDB) that has no awareness of what you own.

> **v1 shipped 2026-05-07.** Single-user personal tool (no auth). Full core loop delivered.
> **v2 shipped 2026-05-12.** Multi-user (auth), market pricing, sideboard support, and public trade binders.
> **v3 shipped 2026-05-13.** Catalog polish, new home page, advanced filters, and trade binder improvements.

## Current Milestone: v3.0 Catalog, Home & Binder Polish — COMPLETE

**Shipped 2026-05-13.** All 4 phases delivered.

- **Phase 11 (New Home Page)**: Dedicated `/` route with Hero, CTAs, and a "Highest Value Cards" showcase.
- **Phase 12 (Catalog Evolution)**: Sticky sidebar filters, variant support (Showcase, Prestige), and TS26 set support.
- **Phase 13 (Advanced Filters)**: Owned-only toggle in catalog sidebar and deck builder.
- **Phase 14 (Trade Binder Polish)**: Full-width public binders and deck-driven automatic wants management.

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
- ✓ **Auth & Multi-User**: User accounts with email/OAuth and data isolation — v2 (Phase 6)
- ✓ **Market Pricing**: EUR/USD card prices and deck valuation via PokéWallet API — v2 (Phase 7)
- ✓ **Sideboard Support**: 10-card sideboard with rules enforcement and cost curve overlay — v2 (Phase 9)
- ✓ **Trade Binder**: Public shareable trade binders with catalog filters and "Looking For" lists — v2 (Phase 10 + 10.1)

### Validated (v3)

- ✓ Sticky sidebar for catalog filters (REQ-CAT-02) — Phase 12
- ✓ Support all card variants (REQ-CAT-01) — Phase 12
- ✓ Owned-only deck builder filter (REQ-DECK-06) — Phase 13
- ✓ Dedicated home page with High Value grid (REQ-HOME-01, REQ-HOME-02, REQ-HOME-03) — Phase 11
- ✓ Full-width public trade binders (REQ-TRADE-06, REQ-TRADE-07) — Phase 14
- ✓ Automatic deck-driven want management in manage binder (REQ-TRADE-08) — Phase 14

### Out of Scope

- Card trading / marketplace — out of scope, different product
- Mobile native app — web-first; responsive design covers mobile browsers
- Camera scanning (SCAN-01) — ML complexity; CSV/spreadsheet import covers collection migration
- Price history charts — significant complexity, low value for a deck builder
- Buy links / affiliate integration — different product

## Context

**Shipped v3:** 2026-05-13
**Stack:** Next.js 16 + TypeScript + Neon PostgreSQL + Drizzle ORM + Better Auth + shadcn/ui + base-ui + nuqs
**Deployment:** Vercel (Hobby tier, daily cron syncs for cards and prices)
**Codebase**: ~22,000 LOC TypeScript/TSX, 41 plans completed across 14 phases
**Auth**: Better Auth (Email, Google, Discord) with per-user data isolation
**Card data**: swu-db.com API auto-sync; PokéWallet API for market prices

**Architecture decisions held:**
- Two-table model (card_definitions + card_printings) is non-negotiable
- Better Auth for multi-tenant support
- integer columns for prices (cents) to avoid floating point issues
- Sideboard as boolean flag on deck_cards
- Usernames for public binder slugs

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

## Constraints

- **Vercel Hobby tier:** 1 cron job per day limit (multiplexed sync tasks)
- **External API dependency:** swu-db.com (cards), PokéWallet (prices)

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-13 — Phase 13 complete (owned-only toggle shipped, REQ-DECK-06 validated)*
