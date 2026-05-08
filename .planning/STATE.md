# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus:** v2 — Phase 6: Auth & Multi-User (first v2 phase)

## Current Position

Phase: 8 — Deck of the Day
Plan: — (not started)
Status: Ready to plan
Last activity: 2026-05-08 — Phase 7: Market Pricing completed and verified.

Progress: [▓▓▓▓▓▓▓▓__] 80% (v2: 3/5 phases)

## Performance Metrics

**Velocity:**
- Total plans completed: 30
- Average duration: ~10 minutes
- Total execution time: ~5.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/4 COMPLETE | ~32 min | ~8 min |
| 2. Card Catalog | 3/3 COMPLETE | ~40 min | ~13 min |
| 3. Collection | 4/4 COMPLETE | ~35 min | ~9 min |
| 4. Deck Builder | 5/5 COMPLETE | ~55 min | ~11 min |
| 5. Want List | 4/4 COMPLETE | ~40 min | ~10 min |
| 5.1 Gap Fix | 1/1 COMPLETE | ~8 min | ~8 min |
| 5.2 Rarity Fix | 1/1 COMPLETE | ~10 min | ~10 min |
| 6. Auth | 4/4 COMPLETE | ~50 min | ~12 min |
| 7. Market Pricing | 4/4 COMPLETE | ~50 min | ~12 min |

**Recent Trend:**
- Last 5 plans: 07-01, 07-02, 07-03, 07-04
- Trend: On track

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Two-table card model (card_definitions + card_printings) is non-negotiable from Phase 1 — changing this later causes a rewrite
- Local PostgreSQL card cache only — never proxy swu-db.com per user request; sync on a schedule
- v1 is single-user (no auth); Better Auth deferred to v2
- vitest passWithNoTests: true — vitest@4.x exits code 1 with no test files; config option ensures zero-file runs exit 0
- .env.example tracked via !.env.example gitignore negation — .env* wildcard requires explicit opt-in for example files
- neon-http driver (not WebSocket) for Drizzle client — correct choice for Next.js serverless on Vercel
- integer columns for cost/power/hp in card_definitions — stored as integer not text for proper numeric sort in Phase 2
- two-pass variant strategy: Normal cards anchor card_definitions (swudb_id = Set-Number), non-Normal variants look up definitions by name+subtitle before inserting card_printings only
- parseIntOrNull helper: parses Cost/Power/HP string fields to integer, returns null for undefined/empty/NaN
- CRON_SECRET guard checks !cronSecret first to prevent empty-string bypass (Pitfall 4 from RESEARCH.md)
- dotenv config() must be called before any app module imports in seed scripts (but ESM hoisting makes this unreliable — prefer tsx --env-file=.env.local instead)
- tsx --env-file=.env.local is the correct ESM-safe approach for seed scripts — avoids dotenv hoisting after Drizzle init
- vercel.json cron: 0 6 * * * (daily at 06:00 UTC) — within Hobby tier one-per-day limit
- .next cache must be cleared before npm run build if Turbopack dev mode was run (stale validator.ts)
- process.exit(0) required in seed scripts — tsx hangs on open Neon pooled HTTP connection otherwise
- shadcn + base-ui: DropdownMenuTrigger (from Base UI) does not support asChild; use buttonVariants on the trigger directly
- Next.js 16 async params: dynamic route params must be awaited before destructuring (e.g. await params)
- nuqs for URL-synced search and filters: provides snappy client-side state with sharable URLs
- Multi-line TopBar: necessary to accommodate 5 new advanced filters (Arena, Trait, Rarity, Keyword, Cost)
- Hover overlay collection controls: Plus/Minus buttons with optimistic updates for responsive catalog management
- user_collections table: composite PK [userId, cardDefinitionId], userId default 1 for v1
- Bulk CSV import: supports Reddit community spreadsheet, sums variants into single count, uses transactional API
- **Phase 4 Naming**: Standardize on `cardDefinitionId` or `definitionId` across all components and API routes to avoid confusion with printings.
- **Deck Draft Support**: `is_draft` boolean column in `decks` table allows saving invalid states; `is_draft: false` triggers strict server-side validation.
- **Want List Visibility**: The combined want list section on `/decks` is hidden if all cards are owned or no decks exist, maintaining a clean dashboard for established collections.
- **Better Auth — proxy.ts**: Next.js 16 breaking change — auth export must come from `proxy.ts` (not `middleware.ts`); wrong filename silently leaves routes unprotected
- **userId=1 audit**: Phase 6 must audit every DB query and component to replace hardcoded userId=1 with session user; no exceptions
- **Cron slot constraint**: Hobby tier allows 1 cron/day; Phase 7+ must run catalog sync → price refresh → deck fetch sequentially in one job
- **pokemon-api.com**: Used for card pricing (Cardmarket EUR + TCGPlayer USD); 100 req/day free; never call per-request — cache in DB
- **swuapi.com API key**: SWUAPI_KEY env var (no NEXT_PUBLIC_ prefix); server-side only
- **RapidAPI Handling**: PokéWallet API keys can be native (X-API-Key) or RapidAPI (x-rapidapi-key); `src/lib/sync/prices.ts` detects length to set correct headers and base URL
- **Price Integrity**: Prices stored as integers (cents) to avoid floating point errors; mapped strictly to 'Normal' variants to represent base market value
- **Global Currency Persistence**: `CurrencyContext` uses `localStorage` to persist user preference (EUR/USD) across sessions
- **Valuation Logic**: Deck and want list valuations multiply market price by quantity/shortfall; missing prices fallback to 0 but display as "—" in UI chips

### Pending Todos

- Run `/gsd-plan-phase 8` to begin Phase 8: Deck of the Day

**Recent Trend:**
- Last 5 plans: 05-04, 05.1-01, 05.2-01
- Trend: On track

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Two-table card model (card_definitions + card_printings) is non-negotiable from Phase 1 — changing this later causes a rewrite
- Local PostgreSQL card cache only — never proxy swu-db.com per user request; sync on a schedule
- v1 is single-user (no auth); Better Auth deferred to v2
- vitest passWithNoTests: true — vitest@4.x exits code 1 with no test files; config option ensures zero-file runs exit 0
- .env.example tracked via !.env.example gitignore negation — .env* wildcard requires explicit opt-in for example files
- neon-http driver (not WebSocket) for Drizzle client — correct choice for Next.js serverless on Vercel
- integer columns for cost/power/hp in card_definitions — stored as integer not text for proper numeric sort in Phase 2
- two-pass variant strategy: Normal cards anchor card_definitions (swudb_id = Set-Number), non-Normal variants look up definitions by name+subtitle before inserting card_printings only
- parseIntOrNull helper: parses Cost/Power/HP string fields to integer, returns null for undefined/empty/NaN
- CRON_SECRET guard checks !cronSecret first to prevent empty-string bypass (Pitfall 4 from RESEARCH.md)
- dotenv config() must be called before any app module imports in seed scripts (but ESM hoisting makes this unreliable — prefer tsx --env-file=.env.local instead)
- tsx --env-file=.env.local is the correct ESM-safe approach for seed scripts — avoids dotenv hoisting after Drizzle init
- vercel.json cron: 0 6 * * * (daily at 06:00 UTC) — within Hobby tier one-per-day limit
- .next cache must be cleared before npm run build if Turbopack dev mode was run (stale validator.ts)
- process.exit(0) required in seed scripts — tsx hangs on open Neon pooled HTTP connection otherwise
- shadcn + base-ui: DropdownMenuTrigger (from Base UI) does not support asChild; use buttonVariants on the trigger directly
- Next.js 16 async params: dynamic route params must be awaited before destructuring (e.g. await params)
- nuqs for URL-synced search and filters: provides snappy client-side state with sharable URLs
- Multi-line TopBar: necessary to accommodate 5 new advanced filters (Arena, Trait, Rarity, Keyword, Cost)
- Hover overlay collection controls: Plus/Minus buttons with optimistic updates for responsive catalog management
- user_collections table: composite PK [userId, cardDefinitionId], userId default 1 for v1
- Bulk CSV import: supports Reddit community spreadsheet, sums variants into single count, uses transactional API
- **Phase 4 Naming**: Standardize on `cardDefinitionId` or `definitionId` across all components and API routes to avoid confusion with printings.
- **Deck Draft Support**: `is_draft` boolean column in `decks` table allows saving invalid states; `is_draft: false` triggers strict server-side validation.
- **Want List Visibility**: The combined want list section on `/decks` is hidden if all cards are owned or no decks exist, maintaining a clean dashboard for established collections.
- **Better Auth — proxy.ts**: Next.js 16 breaking change — auth export must come from `proxy.ts` (not `middleware.ts`); wrong filename silently leaves routes unprotected
- **userId=1 audit**: Phase 6 must audit every DB query and component to replace hardcoded userId=1 with session user; no exceptions
- **Cron slot constraint**: Hobby tier allows 1 cron/day; Phase 7+ must run catalog sync → price refresh → deck fetch sequentially in one job
- **pokemon-api.com**: Used for card pricing (Cardmarket EUR + TCGPlayer USD); 100 req/day free; never call per-request — cache in DB
- **swuapi.com API key**: SWUAPI_KEY env var (no NEXT_PUBLIC_ prefix); server-side only

### Pending Todos

- Run `/gsd-plan-phase 6` to begin Phase 6: Auth & Multi-User

### Blockers/Concerns

- Vercel Hobby tier cron constraint: only 1 cron job per day. Phases 7 and 8 both need daily refresh jobs (prices + deck of the day). Must run them sequentially in a single cron handler.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Want List | Export / share want list (WANT-03) | v3 | v2 requirements |
| Deck Builder | Filter to owned-only (DECK-06) | v3 | v2 requirements |
| Collection | SWUDB CSV import (COLLECT-05) | v3 | v2 requirements |
| Collection | CSV export (COLLECT-04 v2) | v3 | v2 requirements |
| Deck of the Day | Past archive | out of scope | v2 research |
| Trade Binder | Private binders | out of scope | v2 research |
| Pricing | Price history charts | out of scope | v2 research |
| Pricing | Buy links / affiliate | out of scope | v2 research |

## Session Continuity

Last session: 2026-05-08
Stopped at: Phase 6 complete. Ready to plan Phase 7.
Resume file: .planning/ROADMAP.md

