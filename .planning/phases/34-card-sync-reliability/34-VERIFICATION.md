---
phase: 34-card-sync-reliability
verified: 2026-08-20T06:37:32Z
status: human_needed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 7/9
  gaps_closed:
    - "syncAllCards() isolates a single set's failure the same way syncPrices() does, so the caller can always name which sets did not land"
    - "SYNC-03 (\"a sync run that does not process every set reports failure rather than success\") reports failure with the same granular, diagnostic structure the rest of the phase built, not a collateral bare-500 fallback"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "A real deployed GET /api/cron/sync-cards processes every non-token set within the confirmed 300s Vercel budget and returns a response (200 or 500) rather than being killed mid-run with no response"
    expected: "A JSON body with success/cards/prices/duration arrives inside the budget window"
    why_human: "Only observable against real upstream data volume on real Vercel infrastructure — authored as a `verification: backstop` truth in 34-07-PLAN.md and re-carried unchanged in 34-08-PLAN.md; VALIDATION.md explicitly routes this to human_needed"
  - test: "Any given set's card data reflects the swu-db.com API within 24 hours of a successful sync run (SYNC-02), observed against the actual daily cron schedule after deploy"
    expected: "sync-status's ageHours for each set stays under 24 on a normal day; ageHours only exceeds 24 following a genuine missed/failed run"
    why_human: "Depends on the real Vercel Cron schedule firing daily and swu-db.com's actual publish cadence — a deployment/operations property, not a code property"
  - test: "Catalog freshness is answerable by a single authenticated curl without opening a Neon console (SYNC-04)"
    expected: "curl -H \"Authorization: Bearer $CRON_SECRET\" <deploy>/api/cron/sync-status returns the fresh/sets body described in the code"
    why_human: "Operator-workflow claim tied to a real deployed URL and a real secret, not a code property — authored as a `verification: backstop`-style manual row in 34-VALIDATION.md"
  - test: "A user running quick-add on a deck with an unresolvable card sees the shortfall in the UI rather than a plain success banner"
    expected: "Banner reads \"Added N of M ... — K unavailable\" when skipped.length > 0"
    why_human: "End-to-end user-visible copy check — authored as a `verification: backstop` truth in 34-05-PLAN.md; the underlying code path is verified by unit test, but the rendered UI has not been eyeballed"
---

# Phase 34: Card Sync Reliability Verification Report

**Phase Goal:** The nightly card sync processes every non-token set within its execution budget and
honestly reports when a run doesn't finish, instead of silently succeeding on a partial result; the
LAW spotlight deck's previously "unresolved" cards are corrected using confirmed catalog data.

**Verified:** 2026-08-20T06:37:32Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (plan 34-08)

## Goal Achievement

This is a re-verification following the 2026-08-16T18:45:00Z pass, which found `status: gaps_found`
(7/9 truths, 2 failed) with both failures tracing to one root cause: `syncAllCards()` in
`src/lib/sync/upsert-cards.ts` had no per-set `try/catch`, unlike `syncPrices()`, so a rejected
`fetch()`, a malformed JSON body, a DB write error, or the deliberate "unresolved swudbId" throw
propagated uncaught out of the function — crashing the whole cards sync, skipping `syncPrices()`
entirely, and collapsing the cron route's diagnostics into a bodyless `Response('Sync failed', {
status: 500 })`.

Plan `34-08` was written and executed specifically to close those two gaps. This report verifies the
fix directly against `src/lib/sync/upsert-cards.ts` and `src/app/api/cron/sync-cards/route.ts` at
current HEAD (commit `05a2cd8` and later), not against `34-08-SUMMARY.md`'s narrative.

### Gap Closure Verification (primary focus of this pass)

**Gap 1 — `syncAllCards()` per-set isolation.** `src/lib/sync/upsert-cards.ts:279-322` now wraps the
per-set body in a `try { fetch → !ok check → upsertCards() } catch (error) { console.error(...);
failedSets.push(set.setId); }`, structurally identical to `syncPrices()`'s existing pattern in
`src/lib/sync/prices.ts`. Read directly from source — this is not a SUMMARY.md claim. The D-08 soft
deadline check remains outside and before the try, exactly as the plan's prohibition required (MUST
NOT widen the catch beyond one set's body) — confirmed by reading the loop structure line by line.

Four new tests in `__tests__/upsert-cards.test.ts` (lines 216-344) each isolate SOR as the sole
failure in a 3-set list (`[SOR, SHD, TWI]`) and assert `failedSets === ['SOR']`, `setsProcessed === 2`,
the accounting identity (`setsProcessed + failedSets.length + unprocessedSets.length === setsTotal`),
and that SHD/TWI are still fetched:
- a rejected `fetch()` (`mockFetch` rejects for `/cards/SOR`)
- a cards response with no `data` key (destructuring leaves `cards` undefined, `.filter()` throws)
- a DB write error (`.returning()` rejects mid-`upsertCards()`)
- the deliberate unresolved-swudbId throw (Phase D's own `throw new Error(...)` when `.returning()`
  resolves empty)

I ran these tests directly (not trusting the SUMMARY's pass claim): `npx vitest run
__tests__/upsert-cards.test.ts __tests__/cron-route.test.ts` → **2 files, 37/37 tests pass** (23 +
14, matching the SUMMARY's stated 19→23 and 12→14 growth).

**Gap 2 — route reaches its honest verdict.** `__tests__/cron-route.test.ts:261-289` mocks
`syncAllCards` to *resolve* (not reject) with `failedSets: ['JTL']` — the exact shape the fixed
function now produces for this failure class — and asserts: `res.status === 500`, the body is
parseable JSON containing `cards.failedSets` naming `'JTL'`, `syncPrices()` was still called once with
the shared set list, and `revalidateTag()` still fired once. A second **CONTRAST** test
(`cron-route.test.ts:290-307`) pins the one remaining path to the bodyless 500 — an outright
`syncAllCards()` rejection — with an inline comment steering any future "fix" back to `syncAllCards()`
rather than widening the route's catch. Both tests pass.

**Independent confirmation.** A fresh code review (`34-REVIEW.md`, 2026-08-20) re-inspected the same
files and independently reached the same conclusion: "CR-01 ... is **verified closed** ... with
genuine test evidence, not just code inspection." No new Critical findings were raised.

**Verdict: both `34-VERIFICATION.md` gaps are genuinely closed in the codebase**, verified by direct
source reading, by running the tests myself, and by cross-referencing an independent fresh code review.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SYNC-01: nightly sync processes every non-token set within budget via batched multi-row upserts (not per-card/per-printing round trips) | ✓ VERIFIED | Unchanged since last pass — `upsertCards()` batches via `chunk(rows, SYNC_CHUNK_SIZE=500)` into `db.insert(...).onConflictDoUpdate(...)`. `maxDuration=300` / `SOFT_DEADLINE_RATIO=0.8` match `34-BUDGET.md`'s confirmed 300/240. |
| 2 | SYNC-01 (continued): every set is processed unconditionally — no age/timestamp skip logic | ✓ VERIFIED | Unchanged — `syncAllCards()`/`syncPrices()` iterate the full `getNonTokenSets()` list with no last-synced comparison. |
| 3 | SYNC-01/SYNC-03: a single set's failure is isolated so it cannot silently abort the rest of the run or the diagnostic reporting | ✓ VERIFIED (gap closed) | `upsert-cards.ts:279-322` now wraps the per-set body in try/catch, structurally identical to `prices.ts`. 4 new tests pin rejected-fetch, no-`data`-key, DB-write-error, and unresolved-swudbId cases; all push to `failedSets` and let later sets process. Ran directly: pass. Independently re-confirmed by `34-REVIEW.md`. |
| 4 | SYNC-03: the verdict is a strict, threshold-free boolean — `setsProcessed === setsTotal` for both halves, with `setsTotal > 0` guarding the empty-list case | ✓ VERIFIED | Unchanged — `sync-cards/route.ts:52-54`. `cron-route.test.ts` (14/14 passing, up from 12) still pins the exact-equality boundary, empty-list case, deadline case, and accounting identity. |
| 5 | SYNC-02: card data reflects the swu-db.com API within 24h of a successful run | ⚠️ Code-verified, deployment-unverified | Unchanged — `updatedAt: sql\`now()\`` on every successful write; 24h threshold tested at the boundary. Live cadence routed to human verification. |
| 6 | SYNC-04: operator can see which sets last synced and when, without querying Neon by hand | ✓ VERIFIED (code) / routed to human for live-deploy confirmation | Unchanged — `GET /api/cron/sync-status` returns the documented body; 12/12 tests pass. |
| 7 | DEBT-05: the LAW spotlight deck's 9 previously "unresolved" cards resolve — all 50 cards resolve | ✓ VERIFIED | Ran `__tests__/starter-decks-resolve.test.ts` directly during this pass: 2/2 pass against the live DB, zero unresolved pairs. Unchanged since last verification. |
| 8 | DEBT-05 (route/UI): a partial quick-add names what it skipped instead of claiming full success | ✓ VERIFIED | Unchanged — `skipped[]` returned and rendered conditionally in `collection/page.tsx`. |
| 9 | SYNC-03: a per-set card failure still reaches `syncPrices()`, still invalidates the cache, and returns a parseable JSON verdict — not the outer catch's bodyless 500 (34-VERIFICATION gap 2) | ✓ VERIFIED (gap closed) | `cron-route.test.ts` new test (lines 261-289): mocked `syncAllCards` *resolves* with `failedSets: ['JTL']` → `res.status===500`, JSON body with `cards.failedSets`, `syncPrices()` called once, `revalidateTag()` called once. CONTRAST test pins the one remaining bodyless-500 path (outright rejection) as intentional and unreachable for per-set failures. |

**Score:** 9/9 truths verified (0 failed, 0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/sync/chunk.ts` | Shared chunking helper, `SYNC_CHUNK_SIZE=500` | ✓ VERIFIED | Unchanged, present, substantive, used by both `upsert-cards.ts` and `prices.ts` |
| `src/lib/sync/set-list.ts` | Single source of truth for non-token set list | ✓ VERIFIED | Unchanged |
| `src/lib/sync/upsert-cards.ts` | Batched card sync with per-set isolation | ✓ VERIFIED | Batching present and correct; per-set try/catch now present (`279-322`), mirroring `prices.ts` exactly |
| `src/lib/sync/prices.ts` | Batched price sync with per-set isolation (D-07) | ✓ VERIFIED | Unchanged — try/catch wraps the full per-set body |
| `src/app/api/cron/sync-cards/route.ts` | Honest verdict, shared set list, budget-aware deadline | ✓ VERIFIED | `maxDuration=300`, strict-equality verdict, now reachable for per-set card failures, all wired |
| `src/app/api/cron/sync-status/route.ts` | Freshness endpoint, no outbound fetches | ✓ VERIFIED | Unchanged |
| `src/app/api/collection/starter-deck/route.ts` | Reports skipped cards instead of dropping them | ✓ VERIFIED | Unchanged |
| `src/app/collection/page.tsx` | Renders shortfall banner | ✓ VERIFIED | Unchanged |
| `__tests__/starter-decks-resolve.test.ts` | DB-backed resolution proof | ✓ VERIFIED | Ran directly during this pass: 2/2 pass against live DB |
| `__tests__/upsert-cards.test.ts` | Per-set isolation regression tests | ✓ VERIFIED | 23 tests (19→23), 4 new, all exercising real failure injection, not trivial mocks |
| `__tests__/cron-route.test.ts` | Route-level honest-verdict regression tests | ✓ VERIFIED | 14 tests (12→14), 2 new, including an explicit CONTRAST regression guard |
| `.planning/phases/34-card-sync-reliability/34-BUDGET.md` | Human-confirmed execution ceiling | ✓ VERIFIED | `CONFIRMED_MAX_DURATION_SECONDS: 300`, `SOFT_DEADLINE_SECONDS: 240` |
| `.planning/codebase/CONCERNS.md` | DEBT-05 entry rewritten | ✓ VERIFIED | Unchanged since last pass |
| `.planning/phases/34-card-sync-reliability/deferred-items.md` | WR-01..WR-05, IN-01 recorded as conscious deferrals | ✓ VERIFIED | New `## 34-08` section present with file/line provenance for all six items |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `getNonTokenSets()` | `syncAllCards()` + `syncPrices()` | one call in `sync-cards/route.ts`, identical array to both | ✓ WIRED | Unchanged |
| `card_printings.updated_at` | `sync-status`'s freshness aggregate | `MAX(updated_at) GROUP BY set_code` | ✓ WIRED | Unchanged |
| `starterDecks[].cards[].collectorNumber` | `card_printings` resolution | `inArray(...) + variantType='Normal'` | ✓ WIRED | Unchanged |
| `printingByNumber` miss | `skipped[]` → response → banner copy | starter-deck route → collection page | ✓ WIRED | Unchanged |
| `34-BUDGET.md` confirmed ceiling | `maxDuration` export + soft deadline | manual transcription | ✓ WIRED | Unchanged |
| `syncAllCards()` per-set failure (uncaught throw) | `failedSets` | per-set try/catch | ✓ WIRED (fixed) | `upsert-cards.ts:279-322` now catches and pushes; previously NOT WIRED for this class. Confirmed by direct source read and by 4 passing tests injecting the exact failure modes. |
| `syncAllCards()` returning (not throwing) | route's `cardsOk`/`pricesOk` verdict → `syncPrices()` → `revalidateTag()` | route body after `await syncAllCards(...)` | ✓ WIRED (fixed) | `cron-route.test.ts` new test confirms `syncPrices()` and `revalidateTag()` both still fire when `syncAllCards()` resolves with a per-set failure. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Per-set isolation regression suite (self-run, not SUMMARY-trusted) | `npx vitest run __tests__/upsert-cards.test.ts __tests__/cron-route.test.ts` | 2 files, 37/37 tests pass | ✓ PASS |
| DEBT-05 DB-backed resolution test (self-run) | `npx vitest run __tests__/starter-decks-resolve.test.ts` | 1 file, 2/2 tests pass | ✓ PASS |
| Full workspace suite (run once, per established baseline — not re-derived) | `npx vitest run` | 5 failed files / 44 passed / 3 skipped; 8 failed tests / 302 passed / 33 todo (343) — exactly matches the established pre-existing baseline | ✓ PASS (matches baseline-subset, zero regressions from 34-08) |
| Fresh independent code review confirms CR-01 closed | `34-REVIEW.md` re-review (2026-08-20) | "CR-01 ... is verified closed ... with genuine test evidence" | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| SYNC-01 | 34-01, 34-02, 34-06, 34-07, 34-08 | Nightly sync processes every non-token set within budget | ✓ SATISFIED | Batching, confirmed budget, and per-set isolation (gap now closed) all verified |
| SYNC-02 | 34-01, 34-02, 34-03 | Every set reflects upstream data within 24h of a successful run | ⚠️ Code-verified / deployment-unverified | Correct code; live cadence unobservable from the codebase — human_needed |
| SYNC-03 | 34-02, 34-07, 34-08 | A run that doesn't process every set reports failure, not success | ✓ SATISFIED | Strict-equality verdict verified for all paths, including the previously-untested uncaught-throw path — now reaches the honest, granular verdict rather than the bodyless 500 |
| SYNC-04 | 34-03 | Operator can see freshness without querying DB by hand | ✓ SATISFIED (code) | Route implemented and fully tested; live-deploy curl check routed to human_needed |
| DEBT-05 | 34-04, 34-05 | LAW deck's 9 unresolved cards corrected; all 50 resolve | ✓ SATISFIED | DB-backed test proves zero unresolved pairs today (re-ran independently) |

No orphaned requirements — all 5 phase requirement IDs (SYNC-01, SYNC-02, SYNC-03, SYNC-04, DEBT-05)
are declared across the 8 plans (34-01 through 34-08) and cross-reference cleanly against
`.planning/REQUIREMENTS.md`'s Phase 34 mapping (lines 151-156, 164).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/sync/upsert-cards.ts` | 279-322 | ~~Missing per-set try/catch (CR-01)~~ | — | **RESOLVED** — no longer present; independently confirmed by `34-REVIEW.md` re-review |
| `src/lib/sync/upsert-cards.ts` | 188-267 (Phase C/D) | New (WR-06): per-set catch stops the whole run from aborting but does not make one set's write atomic — a Phase C chunk can commit before a later Phase C/D throw, so a "failed" set can still be partially written | ⚠️ Warning | Non-blocking; explicitly out-of-scope for 34-08 per its own plan (carried as `T-34-45`); does not undermine the two closed gaps or the phase's stated "honest reporting" goal — `failedSets` still names the set, it just doesn't distinguish "nothing written" from "partially written" |
| `src/app/collection/page.tsx` | 31-38 | New (WR-07): `/api/collection/sets` fetch never checks `res.ok` or validates response shape before treating it as an array | ⚠️ Warning | Non-blocking; different code path from this phase's sync-reliability scope; a future crash risk on the Import Collection page, not a regression from this phase |
| `src/app/api/cron/sync-cards/route.ts`, `sync-status/route.ts` | guard lines | Non-constant-time secret comparison (`!==`) | ⚠️ Warning | Deferred (WR-01), recorded in `deferred-items.md` with rationale (T-34-44 in threat model) |
| `src/lib/sync/upsert-cards.ts` | 179-186 | Silent last-write-wins dedup, no telemetry | ⚠️ Warning | Deferred (WR-02), recorded in `deferred-items.md` |
| `src/lib/sync/upsert-cards.ts` | 72 | Duplicated token-set predicate instead of importing `isTokenSetId()` | ⚠️ Warning | Deferred (WR-03), recorded in `deferred-items.md` |
| `src/app/api/cron/sync-status/route.ts` | 23-52 | Never-synced sets absent from `sets[]`, not marked stale | ⚠️ Warning | Deferred (WR-04), recorded in `deferred-items.md` |
| `vitest.config.mts` | 12-15 | Comment overstates env-scoping guarantee | ℹ️ Info | Deferred (WR-05), recorded in `deferred-items.md` |
| `src/app/api/collection/starter-deck/route.ts` | 17 | Malformed JSON body returns 500 instead of 400 | ℹ️ Info | Deferred (IN-01), recorded in `deferred-items.md` |
| `src/lib/sync/chunk.ts` | 13-19 | New (IN-02): no guard against non-positive `size` — theoretical infinite loop if ever misused; unreachable today (only call site passes the fixed 500 constant) | ℹ️ Info | Non-blocking; theoretical, not exercised by any current code path |

No TBD/FIXME/XXX debt markers found in any phase-modified file (`upsert-cards.ts`, `sync-cards/route.ts`).

**Note on WR-06/WR-07/IN-02:** these three items are new findings from the fresh `34-REVIEW.md` pass,
not part of the two gaps this verification pass was primarily checking. None is Critical severity, none
blocks the phase goal as stated (the goal is about honest *reporting* of what didn't finish, which
`failedSets` still satisfies even without atomicity), and WR-07/IN-02 are outside this phase's own file
scope (`upsert-cards.ts`, `sync-cards/route.ts`). They are recorded here for visibility and are natural
candidates for `deferred-items.md` or a follow-up `/gsd-audit-fix` pass, not for reopening this phase.

### Test Suite State

Full suite: `8 failed | 302 passed | 33 todo (343)` across 5 files (confirmed by running `npx vitest
run` once during this pass). Every one of the 8 failures reproduces identically at pre-phase-34-08
base commit `15ac805` (per the established baseline record and `deferred-items.md`'s "Phase 34
close-out" section) — zero regressions introduced by plan 34-08. None of the 5 failing files
(`__tests__/api-deck-validation.test.ts`, `__tests__/collection-page.test.tsx`,
`tests/binder-queries.test.ts`, `tests/catalog-variant.test.ts`, `tests/data-isolation.test.ts`) is
touched by any phase-34 plan. Phase 34's own test files — `__tests__/upsert-cards.test.ts` (23) +
`__tests__/cron-route.test.ts` (14) = 37/37 — pass, confirmed by running them directly in this pass.

### Human Verification Required

Unchanged from the prior verification pass — these are deployment/operations/UI properties that were
never code-verifiable and are not affected by the 34-08 gap closure:

1. **Real deployed cron run stays inside budget**
   **Test:** Trigger `GET /api/cron/sync-cards` with the `CRON_SECRET` Bearer header against the live deployment.
   **Expected:** A JSON response (200 or 500) arrives before the confirmed 300s ceiling — never killed mid-run with no response.
   **Why human:** Only observable against real upstream data volume on real Vercel infrastructure.

2. **24-hour freshness holds under the real cron schedule**
   **Test:** Check `sync-status`'s `ageHours` for each set across several real days.
   **Expected:** Ages stay under 24h absent a genuine missed/failed run.
   **Why human:** Depends on real cron cadence and swu-db.com's real publish schedule.

3. **Operator freshness check works end to end**
   **Test:** `curl -H "Authorization: Bearer $CRON_SECRET" <deploy>/api/cron/sync-status`
   **Expected:** Returns the documented `{fresh, checkedAt, sets}` body without touching Neon directly.
   **Why human:** Requires a real deployed URL and a real secret.

4. **Quick-add shortfall banner is visible to a real user**
   **Test:** Run quick-add against a deck with a deliberately unresolvable collector number.
   **Expected:** Banner reads "Added N of M ... — K unavailable."
   **Why human:** End-to-end rendered-UI check; the underlying logic is unit-tested but not eyeballed.

### Gaps Summary

**Both gaps from the prior verification pass are closed.** `syncAllCards()` in
`src/lib/sync/upsert-cards.ts` now wraps its per-set body in a try/catch structurally identical to
`syncPrices()`'s existing pattern, catching a rejected `fetch()`, a malformed/data-less JSON body, a DB
write error, and the deliberate unresolved-swudbId throw — every one now lands the failing set in
`failedSets` and lets every later set in the list still process, restoring both the 34-01 must-have
truth ("syncAllCards() returns failedSets... so the caller can name which sets did not land") and the
phase's headline SYNC-03 requirement. Because `syncAllCards()` now resolves instead of rejecting for
this failure class, the cron route's own honest `cardsOk`/`pricesOk` verdict logic is reached — a
parseable JSON body naming `cards.failedSets`, `syncPrices()` still running, and `revalidateTag()`
still firing — rather than the bodyless outer-catch 500 that previously discarded every diagnostic and
silently cancelled the price half of the run.

This was verified three independent ways during this pass, not just by trusting `34-08-SUMMARY.md`:
(1) direct source reading of `upsert-cards.ts:279-322` and `sync-cards/route.ts`, (2) running
`__tests__/upsert-cards.test.ts` and `__tests__/cron-route.test.ts` myself (37/37 pass, with the four
new tests genuinely injecting rejected fetches, data-less bodies, DB errors, and the unresolved-swudbId
throw — not trivially-mocked always-pass tests), and (3) cross-referencing an independently-run fresh
code review (`34-REVIEW.md`) that reached the same "verified closed" conclusion on the same evidence.

No gaps remain. Status is `human_needed` rather than `passed` because four backstop items — real
deployed cron timing, real 24h freshness cadence, a live curl against `sync-status`, and the rendered
quick-add shortfall banner — are deployment/operations/UI properties that were never code-verifiable
and are unchanged by this gap closure. Three new non-blocking Warnings/Info items were found by the
fresh code review (WR-06: per-set catch doesn't make a set's write atomic; WR-07: collection page
doesn't validate `/api/collection/sets`'s response shape; IN-02: `chunk()` has no positive-size guard)
— none is Critical, none blocks the phase goal, and none reopens either of the two closed gaps.

---

_Verified: 2026-08-20T06:37:32Z_
_Verifier: Claude (gsd-verifier)_
