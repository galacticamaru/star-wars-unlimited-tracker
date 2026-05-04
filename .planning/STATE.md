# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-03)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 1 of 4 in current phase
Status: Executing
Last activity: 2026-05-04 — Plan 01-01 complete (scaffold + tooling)

Progress: [██░░░░░░░░] 5%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: ~15 minutes
- Total execution time: ~0.25 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 1 | ~15 min | ~15 min |

**Recent Trend:**
- Last 5 plans: 01-01
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
Stopped at: Plan 01-01 complete — Next.js scaffold, tooling installed. Ready for 01-02 (Neon setup + schema).
Resume file: .planning/phases/01-foundation/01-01-SUMMARY.md
