# Phase 34 — Deferred Items (out of scope for the current plan)

## 34-01: Pre-existing `npx tsc --noEmit` failures unrelated to this plan

Found while running the plan's `verify` command (`npx vitest run __tests__/upsert-cards.test.ts && npx tsc --noEmit`).

`npx tsc --noEmit` reports pre-existing errors in two files this plan does not touch:

- `__tests__/api-deck-validation.test.ts` — `TS2353` errors at lines 45, 81, 117, 161 (`'id' does not exist in type 'Promise<{ id: string; }>'`)
- `__tests__/collection-page.test.tsx` — multiple `TS2307`/`TS2708`/`TS2582`/`TS2694`/`TS2304` errors (missing module `../app/collection/page`, `jest` namespace used without `@types/jest`, missing Vitest globals)

Both files were last touched by commit `3dbce5d` ("feat(19-20): Fix Variant filter and support variant in csv import"), predating this phase. Neither is imported by, nor imports, any file this plan modifies (`src/lib/sync/chunk.ts`, `src/lib/sync/set-list.ts`, `src/lib/sync/upsert-cards.ts`, `__tests__/upsert-cards.test.ts`).

Per the executor's scope boundary, these are not auto-fixed. `npx tsc --noEmit` scoped to the files this plan touches shows zero errors (confirmed via `npx tsc --noEmit 2>&1 | grep -i "upsert-cards\|chunk.ts\|set-list.ts\|sync/"` — no output).

## 34-01: `__tests__/cron-route.test.ts` and `src/lib/sync/prices.test.ts` fail in a `DATABASE_URL`-less environment

Neither file is modified by this plan (`git diff --stat` against files this plan touches shows no overlap). Both fail with `DATABASE_URL environment variable is not set` because `src/app/api/cron/sync-cards/route.ts` imports the real `@/lib/sync/prices.ts`, which imports the real `@/db`, and this worktree has no `.env.local`. `__tests__/upsert-cards.test.ts` (this plan's own test file) mocks `@/db` entirely and is unaffected. Pre-existing environment limitation, not a regression from this plan's changes.
