---
phase: 01-foundation
plan: 03
subsystem: sync
tags: [vitest, drizzle, upsert, tdd, sync, token-filtering, variant-strategy]
dependency_graph:
  requires: [01-02]
  provides: [upsert-cards-lib, sync-logic, card-sync-tests]
  affects: [01-04]
tech_stack:
  added: []
  patterns: [tdd-red-green, two-pass-variant-strategy, drizzle-upsert, token-set-filtering]
key_files:
  created:
    - src/lib/sync/upsert-cards.ts
    - __tests__/upsert-cards.test.ts
    - __tests__/cron-route.test.ts
  modified: []
decisions:
  - two-pass variant strategy: Normal cards anchor card_definitions rows (swudb_id = Set-Number), non-Normal variants find existing definitions by name+subtitle SELECT before inserting card_printings only
  - parseIntOrNull helper: parses Cost/Power/HP string fields to integer, returns null for undefined/empty/NaN — avoids lexicographic sort issues in Phase 2
  - fallback path for orphan variants: if no Normal variant found (rare case), variant creates its own card_definitions row using its own collector number as swudb_id
  - cron-route.test.ts written now so Plan 04 has a clear contract to implement against
metrics:
  duration: ~2 minutes
  completed: 2026-05-04
  tasks_completed: 2
  files_created: 3
  files_modified: 0
---

# Phase 1 Plan 3: Shared Card Sync Library Summary

JWT-free shared sync library with two-pass variant strategy, both token filters, and integer-parsed numeric fields — 7 unit tests all green (TDD RED → GREEN cycle complete).

## What Was Built

### src/lib/sync/upsert-cards.ts

Core sync logic shared by the seed script (Plan 04) and Vercel Cron route (Plan 04). Exports:

- `SWUCard` interface — maps swu-db.com API Card object shape
- `SWUSet` interface — maps swu-db.com API Set object shape
- `upsertCards(setId, cards)` — upserts one set worth of cards into Neon
- `syncAllCards()` — fetches all sets, filters token sets, calls upsertCards per set

**Key behaviors proven by tests:**

| Behavior | Implementation | Test |
|---|---|---|
| Token set skip | `setId.startsWith('T')` in syncAllCards() | syncAllCards skips token sets |
| Token card type skip | `card.Type.toLowerCase().includes('token')` | skips Token Unit, token upgrade |
| Collector number format | `` `${card.Set}-${card.Number}` `` | constructs collector_number as Set-Number |
| Integer parsing | `parseIntOrNull()` helper | parses Cost/Power/HP as integers; null for missing |
| Normal variant anchoring | Pass 1 — filter `VariantType === 'Normal'`, upsert card_definitions | Normal variants upsert swudb_id = Set-Number |
| Hyperspace variant lookup | Pass 2 — SELECT card_definitions by (name, subtitle), insert card_printings only | Hyperspace variants look up by name+subtitle |
| Idempotency | `onConflictDoUpdate` on swudb_id (definitions) and (set_code, collector_number) (printings) | implicit from insert structure |

### __tests__/upsert-cards.test.ts

7 test cases. All GREEN. No live DB connections — `vi.mock('@/db')` and `vi.mock('@/db/schema')` used throughout.

```
 Test Files  1 passed (1)
      Tests  7 passed (7)
   Duration  1.29s
```

### __tests__/cron-route.test.ts

4 test cases covering the cron auth guard:
- Missing Authorization header → 401
- Wrong secret → 401
- Correct Bearer token → 200 + `{ success: true }`
- Missing CRON_SECRET env var → 401

These tests currently fail (expected) — the route file `src/app/api/cron/sync-cards/route.ts` is created in Plan 04. The tests serve as the contract for Plan 04's implementation.

## TDD Gate Compliance

| Gate | Commit | Status |
|---|---|---|
| RED | c00d2b6 | test(01-03): add failing tests for upsert logic | PASS |
| GREEN | 617cc11 | feat(01-03): implement shared card sync library | PASS |
| REFACTOR | N/A | No refactor needed — implementation matched plan structure |

## Deviations from Plan

None — plan executed exactly as written.

The mock structure in tests matched the implementation's call chain without adjustment. The `vi.mock('@/db/schema')` mock needed an `id` field added to the `cardDefinitions` mock object (for the `.select({ id: cardDefinitions.id })` call in Pass 2) — this is a minor mock completeness addition, not a behavioral deviation.

## Threat Surface Scan

T-03-01 (Tampering — swu-db.com response): All DB writes use Drizzle `.insert().values({})` parameterized API. No string interpolation in SQL. `sql\`excluded.column\`` is Drizzle's parameterized upsert pattern — not raw string building. CONFIRMED.

T-03-02 (Elevation of Privilege — cron endpoint): CRON_SECRET guard pattern `if (!cronSecret || authHeader !== \`Bearer ${cronSecret}\`)` is captured in cron-route.test.ts tests 1, 2, and 4. Plan 04 implements this guard. CONFIRMED by tests.

T-03-03 (Denial of Service — hammering swu-db.com): Per-set error handling with `continue` — one failing set does not abort the entire sync. CONFIRMED.

No new threat surface beyond the plan's threat model.

## Known Stubs

None — no UI rendering involved in this plan. The library functions are fully wired.

## Current State

Sync library implemented, tested, and committed. Plan 01-04 can now import `syncAllCards` from `@/lib/sync/upsert-cards` for both the seed script and the Vercel Cron route.

## Self-Check: PASSED

- src/lib/sync/upsert-cards.ts exists: FOUND
- __tests__/upsert-cards.test.ts exists: FOUND
- __tests__/cron-route.test.ts exists: FOUND
- upsert-cards.ts exports upsertCards: CONFIRMED
- upsert-cards.ts exports syncAllCards: CONFIRMED
- upsert-cards.ts exports SWUCard interface: CONFIRMED
- setId.startsWith('T') filter present: CONFIRMED
- .toLowerCase().includes('token') filter present: CONFIRMED
- `${card.Set}-${card.Number}` collector number: CONFIRMED
- VariantType === 'Normal' two-pass split: CONFIRMED
- parseIntOrNull helper: CONFIRMED
- npm test -- --run __tests__/upsert-cards.test.ts exits 0: CONFIRMED (7/7 pass)
- RED commit c00d2b6 exists: CONFIRMED
- GREEN commit 617cc11 exists: CONFIRMED
