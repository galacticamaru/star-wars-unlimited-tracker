---
phase: 25-operation-performance
plan: "01"
subsystem: test-infrastructure
tags: [test-infrastructure, nyquist-wave-0, vitest, jsdom, batch-upsert, loading-skeleton]
dependency_graph:
  requires: []
  provides: [PERF-04-test-stubs, PERF-05-test-stubs]
  affects: [25-02-PLAN, 25-03-PLAN]
tech_stack:
  added: []
  patterns: [vitest-it.todo, vitest-environment-node, vitest-environment-jsdom, wave-0-red-stubs]
key_files:
  created:
    - src/db/queries/collection.test.ts
    - src/app/collection/page.test.tsx
    - src/app/decks/[id]/loading.test.tsx
  modified: []
decisions:
  - "@vitest-environment node for DB query tests, @vitest-environment jsdom for component tests — consistent with existing catalog.test.ts pattern"
  - "All 17 stubs use it.todo (no test body) — stubs are RED by definition until Wave 1 implementation lands"
  - "Three describe blocks in collection.test.ts (one per batch helper) to mirror the three distinct function boundaries"
metrics:
  duration: "1m 52s"
  completed: "2026-05-27T08:44:40Z"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 0
---

# Phase 25 Plan 01: Wave 0 RED Test Stubs Summary

Wave 0 RED test infrastructure for PERF-04 batch helper semantics and PERF-05 loading skeleton — 17 `it.todo` stubs across three new test files, all reported by vitest with exit 0.

## Files Created

| File | Tests | Requirement | Environment |
|------|-------|-------------|-------------|
| `src/db/queries/collection.test.ts` | 7 `it.todo` stubs | PERF-04 | `@vitest-environment node` |
| `src/app/collection/page.test.tsx` | 5 `it.todo` stubs | PERF-04 | `@vitest-environment jsdom` |
| `src/app/decks/[id]/loading.test.tsx` | 5 `it.todo` stubs | PERF-05 | `@vitest-environment jsdom` |

## Test Counts

- **collection.test.ts:** 7 stubs across 3 describe blocks (`batchIncrementVariantCounts`, `batchUpsertVariantCounts`, `batchRecomputeTotals`)
- **page.test.tsx:** 5 stubs in 1 describe block (`CollectionPage progress text (PERF-04)`)
- **loading.test.tsx:** 5 stubs in 1 describe block (`DeckBuilderLoading (PERF-05)`)
- **Total:** 17 stubs

## Vitest Verification

- `npx vitest run src/db/queries/collection.test.ts` — exits 0, 7 todo tests
- `npx vitest run src/app/collection/page.test.tsx` — exits 0, 5 todo tests
- `npx vitest run src/app/decks/[id]/loading.test.tsx` — exits 0, 5 todo tests
- Full suite (`npx vitest run`): pre-existing failures in unrelated test files (catalog-variant, binder-queries, data-isolation, trade-api, api-deck-validation, cron-route) — none caused by this plan

## Grep Gate Results

- `grep -v '^//' src/db/queries/collection.test.ts | grep -c 'it.todo'` → **7** (expected: 7)
- `grep -v '^//' src/app/collection/page.test.tsx | grep -c 'it.todo'` → **5** (expected: 5)
- `grep -v '^//' src/app/decks/[id]/loading.test.tsx | grep -c 'it.todo'` → **5** (expected: 5)

## Wave 0 Readiness

Plans 02 and 03 now have concrete RED targets:

- **Plan 02** (batch helper implementation) turns the 7 `collection.test.ts` todos into real tests once `batchIncrementVariantCounts`, `batchUpsertVariantCounts`, and `batchRecomputeTotals` land in `src/db/queries/collection.ts`.
- **Plan 03** (UI + loading skeleton) turns the 5 `page.test.tsx` todos and 5 `loading.test.tsx` todos into real tests once `collection/page.tsx` status text and `decks/[id]/loading.tsx` are implemented.

## Commits

| Task | File | Commit | Type |
|------|------|--------|------|
| Task 1 | src/db/queries/collection.test.ts | 7c80057 | test |
| Task 2 | src/app/collection/page.test.tsx | d657722 | test |
| Task 3 | src/app/decks/[id]/loading.test.tsx | f27a9ee | test |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

All stubs are intentional `it.todo` Wave 0 stubs by design. They are RED pending Wave 1 implementation. No unintentional stubs or placeholder values.

## Threat Flags

None - test files only. No new runtime trust boundaries, network endpoints, or auth paths introduced.

## Self-Check: PASSED

- `src/db/queries/collection.test.ts` — EXISTS
- `src/app/collection/page.test.tsx` — EXISTS
- `src/app/decks/[id]/loading.test.tsx` — EXISTS
- Commit 7c80057 — EXISTS
- Commit d657722 — EXISTS
- Commit f27a9ee — EXISTS
