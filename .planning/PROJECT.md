# Star Wars Unlimited Tracker

## What This Is

A single-user web app for Star Wars: Unlimited TCG players. Players track their card collection and build decks in one place — so they always know what they own while building decks and exactly what cards they still need to acquire. Replaces the fragmented workflow of a spreadsheet for collection tracking plus a separate deck-building tool (like SWUDB) that has no awareness of what you own.

> **v1 shipped 2026-05-07.** Single-user personal tool (no auth). Full core loop delivered.
> **v2 in progress.** Auth + multi-user, card market pricing, Deck of the Day, trade binder.

## Current Milestone: v2.0 Multi-User, Market, Decks & Trading

**Goal:** Expand from single-user personal tool to multi-user platform with card pricing, curated tournament decks, and community trade binders.

**Target features:**
- Auth + multi-user accounts (Better Auth) with per-user collection and deck isolation
- Card market pricing — price per card and total deck cost; TCGPlayer + Australian-compatible source
- Deck of the Day — daily curated deck from PQ+ tournament winners; missing-card overlay; copy to library
- Trade binder — quantity-based trade offers from collection; publicly viewable without login; catalog-style filters

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

### Active (v2)

- [ ] User can create an account and log in (AUTH-01, AUTH-02, AUTH-03)
- [ ] Per-user collections and decks isolated by account (requires auth)
- [ ] Card prices displayed per card and as total deck cost — TCGPlayer + AU-compatible source (MARKET-01, MARKET-02, MARKET-03)
- [ ] Deck of the Day — daily curated deck from PQ+ tournament winners with missing-card overlay and copy-to-library (DOTD-01, DOTD-02, DOTD-03)
- [ ] Trade binder — quantity-based trade offers from collection; publicly shareable without login (TRADE-01, TRADE-02, TRADE-03)
- [ ] User can export or share their want list (WANT-03)
- [ ] User can filter the deck builder to show only cards they own (DECK-06)
- [ ] User can import collection from SWUDB-specific CSV export (COLLECT-05 v2)
- [ ] User can export collection to CSV (COLLECT-04 v2)

### Out of Scope

- Camera scanning with image recognition (SCAN-01) — ML complexity; CSV/spreadsheet import covers collection migration
- Card trading / marketplace — out of scope, different product
- Mobile native app — web-first; responsive design covers mobile browsers
- Sideboard support — competitive feature; 50-card main deck covers casual play in v1
- Social features (deck sharing, public profiles) — v2 retention features once core loop is proven

## Context

**Shipped v1:** 2026-05-07
**Stack:** Next.js 16 + TypeScript + Neon PostgreSQL (neon-http driver) + Drizzle ORM + shadcn/ui + base-ui + nuqs
**Deployment:** Vercel (Hobby tier, daily cron sync at 06:00 UTC)
**Codebase:** ~4,757 LOC TypeScript/TSX, 22 plans across 7 phases (5 days)
**Auth:** v1 is single-user (userId hardcoded to 1); Better Auth deferred to v2
**Card data:** swu-db.com API — 4,400+ cards, auto-synced via Vercel Cron

**Architecture decisions held:**
- Two-table model (card_definitions + card_printings) is non-negotiable — changing causes full rewrite
- neon-http driver for Drizzle (not WebSocket) — correct for Next.js serverless
- nuqs for URL-synced filter state — shareable URLs, snappy client-side updates
- is_draft boolean on decks — allows saving invalid states during deck building

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js full-stack (not separate frontend/backend) | Single repo, simpler Vercel deployment, SSR for card browsing | ✓ Good — clean single-repo development |
| Card data from API + local PostgreSQL cache | New sets release regularly; local cache avoids proxying swu-db.com | ✓ Good — sync job works, cache keeps catalog fast |
| Two-table card model (card_definitions + card_printings) | Separates card identity from print variants; enables variant tracking later | ✓ Good — critical architectural decision, never revisit |
| neon-http driver for Drizzle | Correct choice for Next.js serverless on Vercel (not WebSocket) | ✓ Good |
| nuqs for URL state | Snappy filters, shareable URLs, avoids useState proliferation | ✓ Good |
| integer columns for cost/power/hp | Proper numeric sort (not lexicographic) | ✓ Good |
| Two-pass variant strategy in sync | Normal cards anchor definitions; non-Normal look up by name+subtitle | ✓ Good |
| v1 single-user (no auth) | Removes auth complexity from core loop validation | ✓ Good — proved the core loop works |
| is_draft boolean on decks | Allows saving incomplete/invalid decks; strict validation only on draft=false | ✓ Good |
| Synthetic rows in getDeckCardsForUser() | Append leader/base as typed rows after DB query results | ✓ Good — shape enforced by tsc --noEmit |
| UI prefix stripping for rarity filter | Split on first space to normalise `(C) Common` → `Common` for DB match | ✓ Good |
| Camera scanning deferred to v2 | Complex ML feature; CSV handles existing collection migration | ✓ Good |
| SWUDB CSV import in v1 | Users currently use SWUDB — direct import path lowers switching friction | ✓ Good |

## Constraints

- **Auth:** Public app — v2 will add per-user accounts; v1 is userId=1 single-user
- **External API dependency:** swu-db.com API; local PostgreSQL cache provides resilience
- **Vercel Hobby tier:** 1 cron job per day maximum — syncs at 06:00 UTC

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
*Last updated: 2026-05-07 — v2 milestone started*
