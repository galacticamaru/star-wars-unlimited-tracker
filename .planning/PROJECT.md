# Star Wars Unlimited Tracker

## What This Is

A single-user web app for Star Wars: Unlimited TCG players. Players track their card collection and build decks in one place — so they always know what they own while building decks and exactly what cards they still need to acquire. Replaces the fragmented workflow of a spreadsheet for collection tracking plus a separate deck-building tool (like SWUDB) that has no awareness of what you own.

> **v1 shipped 2026-05-07.** Single-user personal tool (no auth). Full core loop delivered.
> **v2 shipped 2026-05-12.** Multi-user (auth), market pricing, sideboard support, and public trade binders.

## Current Milestone: v3.0 Social, Stats & Polish

**Goal:** Enhance the social and utility features of the platform, including list sharing, advanced deck builder filtering, and data portability (CSV export).

**Target features:**
- **Export & Share**: Users can export or share their want list (WANT-03)
- **Owned-Only Filtering**: Filter the deck builder to show only cards in the user's collection (DECK-06)
- **Data Portability**: Full collection export to CSV (COLLECT-04 v2)
- **Advanced Imports**: SWUDB-specific CSV export import support (COLLECT-05)
- **Tournament Insights**: Re-evaluating tournament deck integration with a more reliable API source.

## Core Value

See exactly which cards you own while building decks, and know instantly what you're missing.

## Requirements

### Validated

- ✓ Card catalog auto-syncs from swu-db.com API without manual intervention — v1 (CATALOG-04, Phase 1)
- ✓ User can browse/search/filter the full card catalog with images and metadata — v1 (CATALOG-01, CATALOG-02, CATALOG-03, Phase 2)
- ✓ User can track owned copy counts and update via search & click — v1 (COLLECT-01, COLLECT-02, Phase 3)
- ✓ User can bulk-import collection from generic CSV or community Reddit SWU spreadsheet — v1 (COLLECT-03, COLLECT-04, Phase 3)
- ✓ User can build legal decks (1 Leader + 1 Base + 50-card main deck) with owned-count overlay and shortfall highlights — v1 (DECK-01 through DECK-05, Phase 4)
- ✓ User can view per-deck and combined want lists showing exact missing card quantities — v1 (WANT-01, WANT-02, Phase 5 + 5.1)
- ✓ Catalog rarity filter actually filters results — v1 (Phase 5.2, closed audit gap)
- ✓ **Auth & Multi-User**: User accounts with email/OAuth and data isolation — v2 (Phase 6)
- ✓ **Market Pricing**: EUR/USD card prices and deck valuation via PokéWallet API — v2 (Phase 7)
- ✓ **Sideboard Support**: 10-card sideboard with rules enforcement and cost curve overlay — v2 (Phase 9)
- ✓ **Trade Binder**: Public shareable trade binders with catalog filters and "Looking For" lists — v2 (Phase 10 + 10.1)

### Active (v3)

- [ ] Export or share want list (WANT-03)
- [ ] Filter deck builder to show only owned cards (DECK-06)
- [ ] Collection CSV export (COLLECT-04 v2)
- [ ] SWUDB-specific CSV import (COLLECT-05)

### Out of Scope

- Card trading / marketplace — out of scope, different product
- Mobile native app — web-first; responsive design covers mobile browsers
- Camera scanning (SCAN-01) — ML complexity; CSV/spreadsheet import covers collection migration
- Price history charts — significant complexity, low value for a deck builder
- Buy links / affiliate integration — different product

## Context

**Shipped v2:** 2026-05-12
**Stack:** Next.js 16 + TypeScript + Neon PostgreSQL + Drizzle ORM + Better Auth + shadcn/ui + base-ui + nuqs
**Deployment:** Vercel (Hobby tier, daily cron syncs for cards and prices)
**Codebase**: ~21,000 LOC TypeScript/TSX, 38 plans completed across 12 phases
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
*Last updated: 2026-05-12 — v2 milestone shipped*
