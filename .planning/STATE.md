# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)

**Core value:** See exactly which cards you own while building decks, and know instantly what you're missing.
**Current focus:** v2 — Phase 9: Sideboard (planned, ready to execute)

## Current Position

Phase: 9 — Sideboard
Plan: Ready to execute (3 plans, 2 waves)
Status: ✅ Planned
Last activity: 2026-05-11 — Phase 9 planned. 3 plans created: 09-01 (validateDeck TDD, wave 1), 09-02 (deck-builder.tsx move handlers, wave 2), 09-03 (deck-sidebar.tsx cost curve + count, wave 2).

Progress: [▓▓▓▓▓▓▓▓░░] 80% (v2: 2/5 phases complete, 1 abandoned)

## Performance Metrics

**Velocity:**
- Total plans completed: 30
- Average duration: ~10 minutes
- Total execution time: ~5.0 hours

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
| 8. Deck of the Day | 0/4 ABANDONED | — | — |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **Phase 8 Abandonment**: Abandoned swustats.net tournament deck sync due to API unreliability (404 on GetDeck.php, LoadDeck.php missing names for Melee decks).
- Two-table card model (card_definitions + card_printings) is non-negotiable from Phase 1.
- Local PostgreSQL card cache only — sync on a schedule.
- v2 uses Better Auth for multi-user support and data isolation.
- integer columns for cost/power/hp and prices (cents) to avoid floating point issues.
- tsx --env-file=.env.local for ESM-safe environment variable loading in scripts.
- Vercel Hobby tier allows 1 cron job per day; sequential execution of tasks required.

### Pending Todos

- Execute Phase 9: Sideboard

### Blockers/Concerns

- **API Unreliability**: swustats.net API was found to be unreliable for tournament decklists, leading to the abandonment of the "Deck of the Day" feature.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Want List | Export / share want list (WANT-03) | v3 | v2 requirements |
| Deck Builder | Filter to owned-only (DECK-06) | v3 | v2 requirements |
| Collection | SWUDB CSV import (COLLECT-05) | v3 | v2 requirements |
| Collection | CSV export (COLLECT-04 v2) | v3 | v2 requirements |
| Deck of the Day | Feature abandoned | abandoned | v2 execution |
| Trade Binder | Private binders | out of scope | v2 research |
| Pricing | Price history charts | out of scope | v2 research |
| Pricing | Buy links / affiliate | out of scope | v2 research |

## Session Continuity

Last session: 2026-05-10
Stopped at: Phase 8 abandoned. Ready to start Phase 9.
Resume file: .planning/ROADMAP.md
