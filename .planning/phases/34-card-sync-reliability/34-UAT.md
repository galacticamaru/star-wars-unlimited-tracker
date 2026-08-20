---
status: diagnosed
phase: 34-card-sync-reliability
source: [34-VERIFICATION.md]
started: 2026-08-20T06:45:00Z
updated: 2026-08-20T07:55:00Z
---

## Current Test

[testing paused — 4 items outstanding. Blocker gap G-34-1 is RESOLVED by plan 34-09 (merged at b4712c1); all four tests still require a deploy to close.]

## Tests

### 1. Deployed cron run completes inside the 300s Vercel budget
expected: A JSON body with success/cards/prices/duration arrives inside the budget window; the run returns a response (200 or 500) rather than being killed mid-run with no response
result: [pending]
note: "Local run 2026-08-20 returned a well-formed JSON body with an honest 500 in 152.339s (cards 35/35, prices 25/35). Response shape and SYNC-03 honesty confirmed; the 300s Vercel ceiling and real-infra data volume remain untested. Re-run against the deploy after G-34-1 lands."

### 2. Catalog freshness holds under the real daily cron schedule (SYNC-02)
expected: sync-status's ageHours for each set stays under 24 on a normal day; ageHours only exceeds 24 following a genuine missed/failed run
result: [pending]

### 3. Freshness is answerable by a single authenticated curl (SYNC-04)
expected: `curl -H "Authorization: Bearer $CRON_SECRET" <deploy>/api/cron/sync-status` returns the fresh/sets body described in the code, with no Neon console needed
result: [pending]

### 4. Quick-add shortfall is visible in the rendered UI
expected: Banner reads "Added N of M ... — K unavailable" when skipped.length > 0, rather than a plain success banner
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

- gap_id: G-34-1
  status: resolved
  resolved_by: 34-09-PLAN.md
  resolved_at: 2026-08-20
  resolution: "::integer cast on every CASE branch. Verified independently of the executor: guard test passes at HEAD, and with the cast removed it fails 3/3 at SQLSTATE 42804 — a genuine regression guard, not a vacuous one. Live DB now shows all 10 real card sets fully priced and timestamped 2026-08-20 07:46-07:47 (ASH 0/264 -> 264/264, LOF 6/264 -> 264/264)."
  original_truth: "A cron run reports success only when every non-token set landed; price sync updates prices for every non-token set"
  original_status: failed
  reason: "Local deployed-shape run (152s, 35/35 cards, 8404 upserted) returned success:false with prices setsProcessed 25/35, totalUpdated 0. All 10 real card sets (LOF, SOR, LAW, IBH, TWI, SEC, SHD, TS26, JTL, ASH) in failedSets; the 25 'processed' sets are empty promo/OP sets that legitimately return 0 cards upstream. Price sync has never written a single price."
  severity: blocker
  test: 1
  root_cause: "buildCaseUpdate() in src/lib/sync/prices.ts:91-98 binds each CASE branch value as an untyped parameter. Postgres resolves a CASE expression's result type from its own branches (untyped $n defaults to text) BEFORE checking it against the target column, so the UPDATE fails with 42804: 'column \"price_eur\" is of type integer but expression is of type text'. The D-11 docstring above the function asserts the opposite ('Postgres infers each branch's type from the target column') — that premise is wrong, and the code was built on it."
  artifacts:
    - path: "src/lib/sync/prices.ts"
      issue: "buildCaseUpdate() emits untyped CASE branches; every non-empty set's UPDATE throws 42804 and is swallowed into failedSets by the per-set try/catch"
    - path: "src/lib/sync/prices.test.ts"
      issue: "vi.mock('@/db') stubs the database entirely, so the generated SQL is never executed against Postgres — the defect is invisible to the suite and to 34-VERIFICATION.md's 9/9 pass"
  missing:
    - "Cast each CASE branch to the target column type (verified fix: `then ${row[valueKey]}::integer` — re-ran SOR after the change, 252 prices updated, setsProcessed 1/1)"
    - "Add a test that executes buildCaseUpdate()'s SQL against a real Postgres (or asserts the emitted SQL carries the cast), so a mocked-DB suite cannot pass while the real UPDATE is type-invalid"
  debug_session: ""
