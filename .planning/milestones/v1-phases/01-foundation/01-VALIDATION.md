---
phase: 1
phase_slug: foundation
date: 2026-05-03
---

# Phase 1: Foundation — Validation Strategy

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.mts` |
| Quick run | `npm test -- --run` |
| Full suite | `npm test` |

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Command | Notes |
|--------|----------|-----------|---------|-------|
| CATALOG-04 | `upsertCards()` skips T-prefix token sets | unit | `npm test -- --run` | Token sets filtered before API fetch |
| CATALOG-04 | `upsertCards()` skips cards where Type contains "token" | unit | `npm test -- --run` | Secondary filter |
| CATALOG-04 | `upsertCards()` constructs `{Set}-{Number}` collector_number correctly | unit | `npm test -- --run` | e.g., "SOR-059" from Set="SOR", Number="059" |
| CATALOG-04 | `upsertCards()` is idempotent — running twice produces same DB row count | unit (mock) | `npm test -- --run` | ON CONFLICT DO UPDATE |
| CATALOG-04 | Variant cards (Foil/Hyperspace) create card_printings rows, not duplicate card_definitions | unit (mock) | `npm test -- --run` | Two-pass strategy |
| CATALOG-04 | Cron route `/api/cron/sync-cards` returns 401 without valid CRON_SECRET | unit | `npm test -- --run` | Bearer token auth guard |
| CATALOG-04 | Cron route returns 200 with valid CRON_SECRET | unit | `npm test -- --run` | Happy path |

## Validation Files to Create

- [ ] `vitest.config.mts` — Vitest configuration with React plugin, jsdom, and path aliases
- [ ] `__tests__/upsert-cards.test.ts` — unit tests for upsert logic (token filtering, collector number, idempotency, variants)
- [ ] `__tests__/cron-route.test.ts` — unit tests for cron route auth guard

## Sampling Rate

| Checkpoint | Command | Pass Condition |
|------------|---------|----------------|
| Per task commit | `npm test -- --run` | All tests green |
| Per wave merge | `npm test -- --run` | All tests green |
| Phase gate | `npm test -- --run && npm run dev` | Tests green + app starts |
| Smoke test | `npm run db:seed` (manual, against Neon dev DB) | Exits 0, card count > 0 |

## Phase Success Criteria (Testable)

1. `npm run dev` starts without errors — verify no console errors in terminal
2. `npm run db:push` applies schema to Neon without errors — verify `card_definitions` and `card_printings` tables exist in Neon console
3. `npm run db:seed` exits 0 and logs card count > 0
4. DB query `SELECT COUNT(*) FROM card_definitions` returns value consistent with ~1,000 non-token cards
5. DB query `SELECT COUNT(*) FROM card_definitions WHERE name LIKE '%Token%' OR type LIKE '%token%'` returns 0
6. `npm test -- --run` passes all tests with 0 failures
