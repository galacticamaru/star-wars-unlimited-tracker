# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-03)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 2 of 4 in current phase
Status: Executing
Last activity: 2026-05-04 — Plan 01-02 complete (Drizzle schema + Neon database setup)

Progress: [███░░░░░░░] 10%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: ~10 minutes
- Total execution time: ~0.33 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2 | ~20 min | ~10 min |

**Recent Trend:**
- Last 5 plans: 01-01, 01-02
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
Stopped at: Plan 01-02 complete — Drizzle schema created, pushed to Neon. card_definitions and card_printings tables live. Ready for 01-03 (sync logic TDD).
Resume file: .planning/phases/01-foundation/01-02-SUMMARY.md
