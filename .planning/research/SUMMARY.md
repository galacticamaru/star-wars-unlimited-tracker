# Research Summary — Star Wars: Unlimited Tracker

## Recommended Stack

| Layer | Choice | Version | Rationale |
|-------|--------|---------|-----------|
| Framework | Next.js (App Router) | 16.x | Full-stack, RSC ideal for read-heavy card catalog, single repo |
| Language | TypeScript | 5.x | Type-safe card/deck data model |
| Database | PostgreSQL (Neon) | — | Relational model fits cards/collections/decks; Neon free tier sufficient for dev |
| ORM | Drizzle | 0.45.x | ~7 KB vs Prisma's ~1.6 MB — critical for Vercel cold start; TS-native schema |
| Auth | Better Auth | 1.6.9 | Auth.js team now recommends Better Auth for all new projects; DB sessions (not JWT); zero per-MAU cost |
| Card Data API | swu-db.com API | — | `https://api.swu-db.com` — public, no auth required; bulk `/export/all` endpoint for seeding |
| Deployment | Vercel | — | Native Next.js integration; Vercel Cron for catalog sync job |
| Testing | Vitest | — | Deck legality validation should be pure TS business logic tested independently |

**Not recommended:** Prisma (bundle size), NextAuth/Auth.js (superseded by Better Auth), external search service (PostgreSQL tsvector/GIN is sufficient at SWU catalog scale).

## Table Stakes Features

Users will expect these — missing any of them causes churn:

- **Card catalog browser** — searchable, filterable, with card images
- **Collection management** — track owned copies per card; add via search & click
- **Collection import** — SWUDB CSV import and generic spreadsheet CSV (critical migration path)
- **Deck builder** — create and save named decks with a Leader + Base + 50-card main deck
- **Collection overlay in deck builder** — each card shows owned count; missing cards visually distinct
- **Deck legality validation** — enforce SWU Premier rules (1 Leader, 1 Base, 50 cards, max 3 copies, Heroism/Villainy exclusivity)
- **Want list** — missing cards highlighted per deck; combined exportable/shareable want list across all decks
- **User accounts** — per-user collections and decks (authentication is not optional)
- **Catalog freshness** — new sets reflected automatically (API-driven, no manual updates)

## Key Architecture Decisions

**1. Two-table card model (definition + printing) is non-negotiable.**
SWU has 6+ variant types (Standard, Foil, Hyperspace, Hyperspace Foil, Showcase, Prestige). Modeling variants as a boolean `is_foil` causes a rewrite. Decision: `card_definitions` (game identity) + `card_printings` (physical variant). For deck legality, only `card_definition` copies count.

**2. Local PostgreSQL card cache — never proxy the API per user request.**
swu-db.com rate limits are undocumented. Sync card catalog to local DB on a schedule (Vercel Cron). All user-facing card queries hit the local cache. Resilient to upstream outages.

**3. Collection overlay = LEFT JOIN, not a second query.**
Every card catalog fetch for an authenticated user LEFT JOINs `user_collections` to return `owned_count` inline. No browser round-trip for ownership data.

**4. Full-text search in PostgreSQL (tsvector + GIN index).**
No external search service needed at SWU's card count (~1,820+ cards). `GENERATED ALWAYS AS ... STORED` tsvector column covers name/subtitle/trait search.

**5. Want list is a computed SQL query, not a stored table.**
Derive missing cards from deck contents minus user collection at query time. No sync required.

**6. CSV import is client-side parse + server upsert.**
PapaParse in the browser (dynamic import, `ssr: false`) handles SWUDB format detection and generic column mapping. Only normalized JSON POSTed to server. Must handle BOM stripping, encoding detection, and wrap in a transaction for partial-failure safety.

**7. Database sessions (not JWT) for auth.**
JWT sessions cannot be invalidated without a blocklist. Better Auth database sessions are the safe default for a multi-user app.

## Top Pitfalls to Avoid

| # | Pitfall | Prevention |
|---|---------|-----------|
| 1 | Modeling variants as `is_foil` boolean | Use `card_definitions` + `card_printings` two-table split from day 1 |
| 2 | Proxying the SWU API on user requests | Cache everything locally; sync on a schedule |
| 3 | Tokens appearing in card browser / deck builder | Filter by `collector_number NOT LIKE 'T%'` (token convention) |
| 4 | JWT auth sessions that can't be invalidated | Use Better Auth with database sessions |
| 5 | Silent CSV import failures | Wrap import in a DB transaction; validate all rows before committing |
| 6 | "Available copies" query (cards not already in other decks) | Ship total-owned count in v1; available-across-decks is a designed v2 feature |
| 7 | Building deck builder before collection is stable | Collection schema must be locked before deck builder begins |
| 8 | Missing SWUDB CSV column names | Validate against a real export before building importer; use defensive matching (set_code + collector_number, fallback to name) |

## Recommended Build Order

Research confirms this dependency chain — each phase unblocks the next:

| Phase | Focus | Why this order |
|-------|-------|---------------|
| 1 | Foundation: card catalog sync + auth + browse | Everything depends on cards in the DB and a userId |
| 2 | Collection tracking | Deck builder needs collection data to show ownership overlay |
| 3 | Deck builder | The core value prop — only possible once collection is stable |
| 4 | Want list | Derived from collection + decks; natural capstone of the core loop |
| 5 | CSV import (SWUDB + spreadsheet) | Migration feature; valuable for onboarding but not blocking core loop |
| 6 | Polish, search improvements, export/share | Retention features once the core loop is proven |

**Note from Features research:** Collection and deck builder value is only visible when both exist. Phase 3 is the first phase where the core value prop is fully demonstrable.

## Open Questions

These need validation at implementation time:

- **SWUDB CSV column headers** — exact schema not publicly documented; must export a real SWUDB collection to confirm before building the importer
- **swu-db.com image CDN domain** — `?format=image` issues a redirect; final CDN hostname must be inspected to configure Next.js `remotePatterns`
- **swu-db.com rate limits** — undocumented; sync job must implement exponential backoff
- **Token card filtering** — confirm that the API returns a card type or `T`-prefixed collector number that reliably identifies tokens
- **Dual-faced cards** — API documents `?face=back` parameter; data model needs `back_image_url` column and deck builder must handle double-sided display
- **SWUBase competitor depth** — returned 403 during research; may have collection-deck integration that makes it a closer competitor than assumed
