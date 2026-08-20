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

## 34-08: Non-blocking warnings deferred out of the gap closure

Recorded from `34-VERIFICATION.md` § "Anti-Patterns Found" and `34-REVIEW.md`'s WR-01..WR-05 / IN-01
findings. `34-08` closes only the two `gaps:` entries in `34-VERIFICATION.md`'s frontmatter (the
missing per-set try/catch in `syncAllCards()` and its route-level consequence) — none of the six items
below is one of those gaps, so each is a conscious deferral, not a fix performed by this plan.

- **WR-01** — `src/app/api/cron/sync-cards/route.ts` and `src/app/api/cron/sync-status/route.ts`,
  auth-guard lines: `CRON_SECRET` compared with `!==` rather than a constant-time comparison, a timing
  side-channel. Also carried in `34-08-PLAN.md`'s threat model as `T-34-44`, accepted with a rationale,
  rather than silently dropped.
- **WR-02** — `src/lib/sync/upsert-cards.ts:179-186`: silent last-write-wins de-duplication with no
  telemetry, so duplicate-key collisions from dirty upstream data vanish with zero signal.
- **WR-03** — `src/lib/sync/upsert-cards.ts:72`: the token-set predicate is duplicated inline instead
  of importing `isTokenSetId()` from `src/lib/sync/set-list.ts`, so two copies can drift. This line sits
  in the same file `34-08` edits and was deliberately left alone — it is a different check (a set id)
  from the `card.Type` filter beside it, and changing it is not required to close either gap.
- **WR-04** — `src/app/api/cron/sync-status/route.ts:23-52`: a set that has never been synced is
  absent from `sets[]` entirely rather than reported with `stale: true`, a false-negative freshness
  signal for brand-new sets.
- **WR-05** — `vitest.config.mts:12-15`: the comment overstates what the `DATABASE_`-prefix env
  scoping prevents; `AUTH_SECRET` still reaches tests when present in the ambient shell environment.
- **IN-01** — `src/app/api/collection/starter-deck/route.ts:17`: a malformed JSON request body returns
  500 instead of 400, misreporting a client error as a server fault.

These six items are recorded here for a future phase or an `/gsd-audit-fix` pass and were consciously
deferred, not forgotten.
