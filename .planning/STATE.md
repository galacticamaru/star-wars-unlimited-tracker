# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-03)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 3 of 4 in current phase
Status: Executing
Last activity: 2026-05-04 — Plan 01-03 complete (Shared card sync library — TDD, upsertCards + syncAllCards)

Progress: [████░░░░░░] 15%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: ~7 minutes
- Total execution time: ~0.35 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3 | ~22 min | ~7 min |

**Recent Trend:**
- Last 5 plans: 01-01, 01-02, 01-03
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

### Pending Todos

None yet.

### Blockers/Concerns

- SWUDB CSV column headers not publicly documented — must export a real SWUDB collection before building the Phase 3 importer (COLLECT-04)
- swu-db.com image CDN hostname unknown — must inspect redirect from `?format=image` to configure Next.js `remotePatterns` in Phase 2
- Community spreadsheet multi-sheet structure unclear — may need to handle one sheet per set in Phase 3 (COLLECT-04)

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Auth | Better Auth / per-user accounts (AUTH-01, AUTH-02, AUTH-03) | v2 | Init |
| Collection | CSV export (COLLECT-04 v2) | v2 | Init |
| Deck Builder | Filter to owned-only (DECK-06) | v2 | Init |
| Want List | Export / share want list (WANT-03) | v2 | Init |
| Collection | Camera scanning (SCAN-01) | v2 | Init |

## Session Continuity

Last session: 2026-05-04
Stopped at: Plan 01-03 complete — shared card sync library (upsertCards + syncAllCards) implemented with TDD (7/7 tests green). cron-route.test.ts written as contract for Plan 04. Ready for 01-04 (seed script + cron route + deploy).
Resume file: .planning/phases/01-foundation/01-03-SUMMARY.md
