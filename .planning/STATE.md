# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-03)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 4 of 4 in current phase
Status: Awaiting human action (Tasks 3-4 of Plan 01-04)
Last activity: 2026-05-04 — Plan 01-04 Tasks 1-2 complete (cron route + seed script + vercel.json); Tasks 3-4 require human action

Progress: [████░░░░░░] 18%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: ~7 minutes
- Total execution time: ~0.35 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3+partial | ~24 min | ~6 min |

**Recent Trend:**
- Last 5 plans: 01-01, 01-02, 01-03, 01-04 (partial)
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
- dotenv config() must be called before any app module imports in seed scripts
- vercel.json cron: 0 6 * * * (daily at 06:00 UTC) — within Hobby tier one-per-day limit
- .next cache must be cleared before npm run build if Turbopack dev mode was run (stale validator.ts)

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
Stopped at: Plan 01-04 Tasks 1-2 complete — cron route (route.ts, CRON_SECRET guard), seed script (scripts/seed.ts), and vercel.json created and committed. 11/11 tests pass. Awaiting human action: Task 3 (npm run db:seed against live Neon DB) and Task 4 (Vercel deployment + cron job verification).
Resume file: .planning/phases/01-foundation/01-04-SUMMARY.md
