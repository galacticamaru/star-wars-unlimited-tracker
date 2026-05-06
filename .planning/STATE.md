# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-03)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus:** Phase 5 — Want List

## Current Position

Phase: 5 of 5 (Want List) — Ready to execute
Plan: 0 of 4 complete
Status: Phase 5 planned (4 plans, 3 waves). Ready for execution.
Last activity: 2026-05-06 — Phase 5 planning complete. 4 plans in 3 waves created and verified.

Progress: [██████████] 100% (Phase 4)

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: ~10 minutes
- Total execution time: ~2.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/4 COMPLETE | ~32 min | ~8 min |
| 2. Card Catalog | 3/3 COMPLETE | ~40 min | ~13 min |
| 3. Collection | 4/4 COMPLETE | ~35 min | ~9 min |
| 4. Deck Builder | 5/5 COMPLETE | ~55 min | ~11 min |

**Recent Trend:**
- Last 5 plans: 04-01, 04-02, 04-03, 04-04, 04-05
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

### Pending Todos

None yet.

### Blockers/Concerns

- None currently identified.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Auth | Better Auth / per-user accounts (AUTH-01, AUTH-02, AUTH-03) | v2 | Init |
| Collection | CSV export (COLLECT-04 v2) | v2 | Init |
| Deck Builder | Filter to owned-only (DECK-06) | v2 | Init |
| Want List | Export / share want list (WANT-03) | v2 | Init |
| Collection | Camera scanning (SCAN-01) | v2 | Init |

## Session Continuity

Last session: 2026-05-05
Stopped at: Phase 4 planning revised and finalized.
Resume file: .planning/phases/04-deck-builder/04-01-PLAN.md
