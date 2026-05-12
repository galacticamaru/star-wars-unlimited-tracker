# Milestone v2: Multi-User, Market, Decks & Trading

**Status:** ✅ SHIPPED 2026-05-11 (Refinement 2026-05-12)
**Phases:** 6, 7, 8 (abandoned), 9, 10, 10.1
**Total Plans:** 16
**Timeline:** 2026-05-07 → 2026-05-12 (6 days)

## Overview

Expanded from a single-user personal tool to a multi-user platform. This milestone introduced robust authentication, market pricing integration, advanced deck builder features (sideboards), and public social sharing (trade binders). It successfully navigated external API failures by pivoting and delivered a production-ready multi-tenant application.

## Phases

### Phase 6: Auth & Multi-User
**Goal**: Users can create accounts and log in; all data is isolated per user; v1 hardcoded userId=1 is fully removed.
**Accomplishments**:
- Integrated **Better Auth** with Email/Password, Google, and Discord providers.
- Refactored entire database query layer for strict user isolation.
- Implemented middleware-level route protection and client-side auth hooks.
- Successfully migrated v1 single-user data to the first registered account.
**Completed**: 2026-05-08

### Phase 7: Market Pricing
**Goal**: Users can see card prices (EUR and USD) on card detail pages, in the deck builder as a total cost, and on the want list as an estimated completion cost.
**Accomplishments**:
- Built infrastructure for multi-currency pricing (EUR/USD).
- Integrated **PokéWallet API** for daily automated price sync via Vercel Cron.
- Added currency context and user-facing pricing UI across the application.
- Implemented valuation logic for decks and aggregate want lists.
**Completed**: 2026-05-08

### Phase 8: Deck of the Day
**Status**: ❌ ABANDONED
**Reason**: swustats.net API unreliability (404s and missing metadata) made the feature unstable. Deferred to v3 or indefinite backlog.

### Phase 9: Sideboard
**Goal**: Users can add a sideboard to any deck, with rules enforcement and distinct visual separation from the main deck.
**Accomplishments**:
- Extended deck validation (TDD) to support 10-card sideboard limit.
- Implemented sideboard UI in deck builder with seamless main/SB card movement.
- Added amber sideboard bars to the cost curve visualization for distinct visual grouping.
**Completed**: 2026-05-11

### Phase 10: Trade Binder
**Goal**: Users can curate a public trade binder from their collection, and anyone can browse it at a shareable URL without logging in.
**Accomplishments**:
- Implemented `trade_quantities` and `usernames` in the database schema.
- Built a binder management interface with manual wants and exclusions.
- Created slug-based public binder view (`/binder/[username]`) with full catalog filtering.
**Completed**: 2026-05-11

### Phase 10.1 (INSERTED): Fix sideboard filter in binder Looking For query
**Goal**: Correct the sideboard filtering logic in the public trade binder's "Looking For" query.
**Accomplishments**:
- Fixed a bug where sideboard cards were incorrectly included in the binder shortfall calculation.
- Verified fix with TDD and updated binder query logic.
**Completed**: 2026-05-12

---

## Milestone Summary

### Stats (v1..HEAD)
- **Commits**: 92
- **Code Change**: +16,625 / -2,393 lines across 176 files
- **Velocity**: ~2.6 plans per day

### Key Decisions
- **Better Auth Integration**: Chose Better Auth for its strong Next.js support and handled schema migrations for Neon/Drizzle.
- **Sideboard Logic**: Implemented as a boolean flag on `deck_cards` to maintain query simplicity while allowing distinct filtering.
- **API Resilience**: Abandoned Phase 8 early to avoid sinking time into an unstable external dependency, prioritizing core trading and pricing features.
- **Public Binder slugs**: Used usernames as the primary identifier for shareable URLs to improve social discoverability.

### Issues Resolved
- **TRADE-05**: Fixed sideboard cards inflating "Looking For" shortfall quantities (Phase 10.1).
- **Pricing Sync**: Resolved RapidAPI/Native endpoint configuration issues during Phase 7 execution.
- **Middleware UX**: Addressed /binder/manage route protection consistency.

### Issues Deferred
- **DOTD**: Deck of the Day moved to v3 backlog.
- **Export**: CSV/Want list export deferred to v3.
- **Nyquist Compliance**: Formal VERIFICATION.md files for Phase 7 and 10 remain as tech debt.

---

*Milestone complete. For current project status, see .planning/ROADMAP.md*
*Archived: 2026-05-12*
