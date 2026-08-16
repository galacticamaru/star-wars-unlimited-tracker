---
phase: 34
slug: card-sync-reliability
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-16
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Populated from the 7 PLAN.md files' `<verify>` blocks and RESEARCH.md § "Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 (installed; no framework install needed) |
| **Config file** | `vitest.config.mts` — **modified by 34-04 Task 1** to add `test.env` via `loadEnv(mode, cwd, 'DATABASE_')` |
| **Quick run command** | `npx vitest run <changed test file>` |
| **Full suite command** | `npx vitest run` |
| **Type check** | `npx tsc --noEmit` (paired with the quick run in most tasks) |
| **Measured runtime** | **~3s** full suite (49 files / 283 tests), measured 2026-08-16 |

### ⚠ Baseline is RED — recorded, not assumed away

Measured on `main` at 2026-08-16, **before any Phase 34 work**:

```
Test Files  8 failed | 38 passed | 3 skipped (49)
     Tests  12 failed | 238 passed | 33 todo (283)
```

Pre-existing failing files:

| File | In Phase 34 scope? | Consequence |
|------|--------------------|-------------|
| `src/lib/sync/prices.test.ts` | **Yes** — 34-02 modifies it | 34-02's `<automated>` verify starts red; the executor must not read a pre-existing failure as its own regression |
| `__tests__/cron-route.test.ts` | **Yes** — 34-07 modifies it | Same for 34-07; all 4 of its existing cases currently fail |
| `__tests__/collection-page.test.tsx` | No | — |
| `__tests__/api-deck-validation.test.ts` | No | — |
| `tests/auth-config.test.ts` | No | — |
| `tests/binder-queries.test.ts` | No | — |
| `tests/catalog-variant.test.ts` | No | — |
| `tests/data-isolation.test.ts` | No | — |

**Impact on two acceptance criteria.** `34-04` and `34-07` both list `npx vitest run` (full suite) exits 0. That is **not achievable** without repairing 6 test files this phase does not own and has no requirement to touch. Treat the full-suite criterion for those two plans as: *the phase's own test files pass, and the set of failing files is a strict subset of the 8 recorded above* — i.e. Phase 34 introduces no new failures. Repairing the unrelated 6 is out of scope here and should be raised as separate debt.

---

## Sampling Rate

- **After every task commit:** the task's own `<automated>` command (per-file `npx vitest run …`, typically paired with `npx tsc --noEmit`)
- **After every plan wave:** `npx vitest run` — compare the failing-file set against the 8-file baseline above; any new file in that set is a regression
- **Before `/gsd-verify-work`:** every Phase 34 test file green; failing set ⊆ baseline
- **Max feedback latency:** ~5 seconds (3s suite + type check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 34-01-01 | 01 | 1 | SYNC-01, SYNC-02 | T-34-01 / T-34-02 / T-34-03 | Printings link via the RETURNING `swudbId` column, never a positional index; intra-batch conflict-key dedupe; API values only through Drizzle parameter binding | unit (**tracer**) | `npx vitest run __tests__/upsert-cards.test.ts && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 34-01-02 | 01 | 1 | SYNC-01, SYNC-02 | T-34-04 / T-34-05 | Soft deadline checks at set boundaries only; reports and stops, persists no resume cursor | unit | `npx vitest run __tests__/upsert-cards.test.ts && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 34-02-01 | 02 | 2 | SYNC-01, SYNC-02, SYNC-03 | T-34-07 / T-34-08 / T-34-09 | Per-set catch records `failedSets` instead of swallowing; removed sleep surfaces rate-limiting as a loud failed set | unit | `npx vitest run src/lib/sync/prices.test.ts && npx tsc --noEmit` | ⚠️ exists, **red at baseline** | ⬜ pending |
| 34-02-02 | 02 | 2 | SYNC-01, SYNC-02 | T-34-06 | `buildCaseUpdate()` parameterises every API value through `` sql`` ``; `sql.raw()` limited to fixed separators/keywords | unit | `npx vitest run src/lib/sync/prices.test.ts && npx tsc --noEmit` | ⚠️ exists, **red at baseline** | ⬜ pending |
| 34-03-01 | 03 | 2 | SYNC-04, SYNC-02 | T-34-10 / T-34-11 / T-34-12 / T-34-13 / T-34-15 / T-34-16 | Bearer guard byte-identical to `sync-cards/route.ts:7-14` incl. the `!cronSecret` empty-string-bypass check; secret never logged or echoed; fixed error string | source assertion + lint | `npx tsc --noEmit && npx eslint src/app/api/cron/sync-status` | ❌ W0 | ⬜ pending |
| 34-03-02 | 03 | 2 | SYNC-04, SYNC-02 | T-34-10 / T-34-14 | Three 401 cases incl. unset secret; `fresh` requires `sets.length > 0` so an empty table is never vacuously fresh | unit | `npx vitest run __tests__/sync-status-route.test.ts` | ❌ W0 | ⬜ pending |
| 34-04-01 | 04 | 2 | DEBT-05 | T-34-17 / T-34-18 / T-34-19 / T-34-20 | `loadEnv` prefix `'DATABASE_'` keeps `AUTH_SECRET` etc. out of tests; test is `db.select`-only; absent `DATABASE_URL` fails loudly rather than skipping | integration (**DB-backed**) | `npx vitest run __tests__/starter-decks-resolve.test.ts; echo "exit=$?"` | ❌ W0 | ⬜ pending |
| 34-04-02 | 04 | 2 | DEBT-05 | T-34-21 / T-34-22 | Corrections constrained to collector-number values; committed test guards future hand edits | integration | `npx vitest run __tests__/starter-decks-resolve.test.ts && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 34-05-01 | 05 | 2 | DEBT-05 | T-34-23 / T-34-24 / T-34-25 | Unresolved numbers returned in `skipped` instead of dropped; existing `deckId` allow-list guard untouched | unit | `npx vitest run __tests__/starter-deck-route.test.ts && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 34-05-02 | 05 | 2 | DEBT-05 | T-34-26 | Only `skipped.length` rendered; React default escaping; no `dangerouslySetInnerHTML` | component | `npx vitest run src/app/collection/page.test.tsx && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 34-06-01 | 06 | 2 | SYNC-01 | T-34-27 / T-34-29 | Ceiling confirmed from the Vercel dashboard, not assumed; no credential transcribed into the repo | **manual** (`checkpoint:human-verify`, `gate="blocking"`) | `test -z "$(git status --porcelain src/)" && echo "no source changes from checkpoint task"` | n/a | ⬜ pending |
| 34-06-02 | 06 | 2 | SYNC-01 | T-34-28 | Derivation recorded in `34-BUDGET.md` so it is auditable rather than implicit | file assertion | `test -f .planning/phases/34-card-sync-reliability/34-BUDGET.md && grep -q 'CONFIRMED_MAX_DURATION_SECONDS:' … && ! grep -Eq 'TBD\|TODO' …` | ❌ W0 | ⬜ pending |
| 34-07-01 | 07 | 3 | SYNC-01, SYNC-03 | T-34-30 / T-34-32 / T-34-33 / T-34-34 / T-34-35 | `success = cardsOk && pricesOk` with strict equality and `setsTotal > 0`; guard at `:6-14` left byte-identical; fixed `Sync failed` string | source assertion + lint | `npx tsc --noEmit && npx eslint src/app/api/cron/sync-cards` | ⚠️ route exists | ⬜ pending |
| 34-07-02 | 07 | 3 | SYNC-01, SYNC-03 | T-34-30 / T-34-31 | Shortfall, boundary and empty-list cases pin the verdict; near-timeout still returns a 500 naming `unprocessedSets` | unit | `npx vitest run __tests__/cron-route.test.ts` | ⚠️ exists, **red at baseline** | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*File Exists: ❌ W0 = created during execution by the task itself (see Wave 0 Requirements).*

---

## Wave 0 Requirements

The framework is already installed, so there is no separate Wave 0 plan; the infrastructure work is folded into the tasks that need it.

- [ ] `vitest.config.mts` — add `test.env` via `loadEnv(mode, cwd, 'DATABASE_')` so `DATABASE_URL` reaches tests. **Built by 34-04 Task 1.** This is the phase's only genuine infrastructure gap: no DB-backed test path exists in the repo today (every current test mocks `@/db`; the only real-DB precedent is the standalone script `scripts/validate-spotlight-numbers.ts`).
- [ ] Connection teardown — `afterAll(() => pool.end())` in the DB-backed test. Do **not** copy `process.exit(0)` from `scripts/validate-spotlight-numbers.ts`; it would kill the Vitest worker.
- [ ] `__tests__/upsert-cards.test.ts` — new (34-01)
- [ ] `__tests__/sync-status-route.test.ts` — new (34-03)
- [ ] `__tests__/starter-decks-resolve.test.ts` — new (34-04)
- [ ] `__tests__/starter-deck-route.test.ts` — new (34-05)
- [ ] `.planning/phases/34-card-sync-reliability/34-BUDGET.md` — new (34-06), consumed by 34-07

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| This project's effective Vercel function execution ceiling (Fluid Compute on/off; Function Max Duration) | SYNC-01 | Project-level dashboard setting. Not in `vercel.json`, not derivable from the repo. Research confirmed 300s for Hobby + Fluid Compute but could not confirm this project was auto-migrated | 34-06 Task 1 (`checkpoint:human-verify`, `gate="blocking"`): open Vercel → Project → Settings → Functions; record Fluid Compute state and Function Max Duration into `34-BUDGET.md` as `CONFIRMED_MAX_DURATION_SECONDS`. **Blocks 34-07.** |
| A real deployed `GET /api/cron/sync-cards` processes every non-token set and returns 200 or 500 inside the confirmed budget — not killed mid-run with no response | SYNC-01, SYNC-03 | Only observable against real upstream data volume on real Vercel infrastructure. Authored as a `verification: backstop` truth in 34-07 — abstains to `human_needed` at verify time rather than passing silently | After deploy, invoke the cron route with the `CRON_SECRET` Bearer header; confirm a response body arrives and note the elapsed time against `CONFIRMED_MAX_DURATION_SECONDS` |
| A user running quick-add on a deck with an unresolvable card sees the shortfall in the UI rather than a plain success banner | DEBT-05 | End-to-end user-visible copy. Authored as a `verification: backstop` truth in 34-05 | Run quick-add against a deck with a deliberately unresolvable collector number; confirm the banner reads "Added N of M … — K unavailable" |
| Catalog freshness answerable by a single authenticated `curl` without a Neon console | SYNC-04 | Operator-workflow claim, not a code property | `curl -H "Authorization: Bearer $CRON_SECRET" <deploy>/api/cron/sync-status` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — 13 of 14 automated; 34-06-01 is a declared blocking human checkpoint with a no-source-changes assertion
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references — the DB-backed test path and all 5 new files are built by the tasks that consume them
- [x] No watch-mode flags — every command uses `vitest run`
- [x] Feedback latency < 5s (measured 3s full suite)
- [ ] `nyquist_compliant: true` — **set by `/gsd-validate-phase` §6, not by plan-phase.** Left false deliberately; this file is `status: draft` per the lifecycle in its own frontmatter comment.

**Known baseline exception carried into execution:** 6 test files unrelated to Phase 34 fail on `main`. The two in-scope red files (`prices.test.ts`, `cron-route.test.ts`) are rewritten by 34-02 and 34-07. See § "Baseline is RED" for how to read the full-suite criterion in 34-04 and 34-07.

**Approval:** pending
