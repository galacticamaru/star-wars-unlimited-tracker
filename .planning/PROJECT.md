# Star Wars Unlimited Tracker

## What This Is

A public multi-user web app for Star Wars: Unlimited TCG players. Players track their card collection and build decks in one place — so they always know what they own while building decks and exactly what they still need to acquire. It replaces the fragmented workflow of a spreadsheet for collection tracking plus a separate deck-building tool (like SWUDB) that has no awareness of what you own.

## Core Value

See exactly which cards you own while building decks, and know instantly what you're missing.

## Requirements

### Validated

- [x] Card catalog stays current as new sets release (API-driven, no manual updates) — Validated in Phase 1: Foundation (CATALOG-04)

### Active

- [ ] User can create an account and log in
- [ ] User can browse the full Star Wars Unlimited card catalog (auto-populated from API)
- [ ] User can add cards to collection via search & click (set quantity per card)
- [ ] User can import collection from a generic spreadsheet (CSV)
- [ ] User can import collection from a SWUDB collection CSV export
- [ ] User can build decks with collection status (owned count) shown on each card
- [ ] User can filter deck builder to owned cards only
- [ ] User can see missing cards highlighted while building a deck
- [ ] User can view a combined want list across all their decks
- [ ] User can export or share their want list
- [ ] App enforces Star Wars Unlimited deck legality (1 Leader, 1 Base, 50-card main deck, max 3 copies of non-unique cards)
- [ ] Card catalog stays current as new sets release (API-driven, no manual updates)

### Out of Scope

- Camera scanning with image recognition — deferred to v2 (ML complexity, CSV/spreadsheet import covers migration from existing collections)
- Card trading / marketplace between users — out of scope, different product
- Mobile native app — web-first; responsive design covers mobile browsers

## Context

- **Current player workflow:** Spreadsheet for collection inventory + SWUDB (or similar) for deck building — two siloed tools with no shared data
- **Core pain:** When building a deck in a third-party tool, there's no visibility into what you actually own; want lists are also manual
- **Card data:** External Star Wars Unlimited card API (e.g. SWUDB API) — pulls full catalog including new set releases automatically
- **SWU deck construction rules:** 1 Leader card, 1 Base card, 50-card main deck, maximum 3 copies of any non-unique card across deck + sideboard

## Constraints

- **Tech stack:** Next.js + TypeScript + PostgreSQL — full-stack single repo, appropriate for user accounts and relational card/deck data
- **Auth required:** Public app with per-user collections and decks — authentication is not optional
- **External API dependency:** Card catalog depends on a third-party SWU card API; need a fallback or local cache strategy for resilience

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js full-stack (not separate frontend/backend) | Single repo, simpler deployment, SSR for card browsing performance | — Pending |
| Card data from API, not manual entry | New sets release regularly; API keeps catalog current automatically | — Pending |
| Camera scanning deferred to v2 | Complex ML feature; CSV/spreadsheet import handles existing collection migration | — Pending |
| SWUDB CSV import in v1 | Users currently use SWUDB — direct import path lowers friction to switch | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-04 after Phase 1 completion*
