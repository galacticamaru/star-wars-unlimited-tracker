---
phase: 34-card-sync-reliability
verified: 2026-08-16T18:45:00Z
status: gaps_found
score: 7/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "syncAllCards() isolates a single set's failure the same way syncPrices() does, so the caller can always name which sets did not land (34-01 must-have: \"syncAllCards() returns failedSets and unprocessedSets so the caller can name which sets did not land\")"
    status: failed
    reason: >
      syncAllCards()'s per-set loop body (src/lib/sync/upsert-cards.ts:302-311) has no try/catch,
      unlike syncPrices() (src/lib/sync/prices.ts:132-171) which wraps its whole per-set body. A
      rejected fetch() (network blip/timeout), a malformed JSON body, a DB constraint violation, or
      the deliberate "unresolved swudbId" throw inside upsertCards() (upsert-cards.ts:231) all
      propagate uncaught out of syncAllCards(). The only defense is the `!cardsResponse.ok` branch.
      This was independently confirmed by an automated code review (34-REVIEW.md CR-01, Critical)
      dated 2026-08-16T08:29:30Z, then independently re-confirmed by direct source reading during
      this verification, and remains unfixed in the current HEAD (197016d, the review report commit
      itself, is the latest commit touching this area — no follow-up fix commit exists).
    artifacts:
      - path: "src/lib/sync/upsert-cards.ts"
        issue: "syncAllCards() loop body (lines 302-311) has no try/catch around fetch()/upsertCards(), unlike prices.ts's equivalent loop"
    missing:
      - "Wrap the per-set fetch + upsertCards() call in try/catch, pushing to failedSets on any thrown error, mirroring syncPrices()'s pattern exactly"
      - "A test that makes mockFetch reject (not just resolve with ok:false) and a test that makes upsertCards() throw, both asserting the set lands in failedSets and later sets still process"
  - truth: "SYNC-03 (\"a sync run that does not process every set reports failure rather than success\") reports failure with the same granular, diagnostic structure the rest of the phase built, not a collateral bare-500 fallback"
    status: failed
    reason: >
      Because syncAllCards() throws instead of returning on the failure modes above, the route's
      *outer* try/catch (sync-cards/route.ts:88-91) — not the honest cardsOk/pricesOk verdict this
      phase built — is what actually fires. That outer catch returns `new Response('Sync failed', {
      status: 500 })`: no JSON body, so any caller/alerting system parsing `body.cards.failedSets`
      gets nothing; syncPrices() is never reached, so a single bad card set also silently cancels the
      entire price half of the run even though it had nothing to do with the failure; and
      revalidateTag() is never called, discarding whatever sets did land successfully before the
      failing one. The literal "no success:true on a partial run" property still holds (500 is
      returned, not 200), but the phase's stated intent — "honestly reports... instead of silently
      succeeding on a partial result" with per-set granularity — is undercut for this class of
      failure. None of __tests__/upsert-cards.test.ts, __tests__/cron-route.test.ts, or
      __tests__/starter-decks-resolve.test.ts exercise this path.
    artifacts:
      - path: "src/app/api/cron/sync-cards/route.ts"
        issue: "Outer catch (lines 88-91) is the only backstop for an uncaught syncAllCards() throw; loses all per-set diagnostics and skips syncPrices() entirely"
    missing:
      - "Same fix as the syncAllCards() gap above — once syncAllCards() no longer throws on a single bad set, the route's own honest-verdict logic (cardsOk/pricesOk) naturally covers this case with full diagnostics"
deferred: []
human_verification:
  - test: "A real deployed GET /api/cron/sync-cards processes every non-token set within the confirmed 300s Vercel budget and returns a response (200 or 500) rather than being killed mid-run with no response"
    expected: "A JSON body with success/cards/prices/duration arrives inside the budget window"
    why_human: "Only observable against real upstream data volume on real Vercel infrastructure — authored as a `verification: backstop` truth in 34-07-PLAN.md; VALIDATION.md explicitly routes this to human_needed"
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

**Verified:** 2026-08-16T18:45:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SYNC-01: nightly sync processes every non-token set within budget via batched multi-row upserts (not per-card/per-printing round trips) | ✓ VERIFIED | `upsertCards()` batches definitions and printings through `chunk(rows, SYNC_CHUNK_SIZE=500)` into `db.insert(...).onConflictDoUpdate(...)` calls (`upsert-cards.ts:192-223`, `:248-265`) — at most `ceil(n/500)` inserts, not one per row. `prices.ts` batches via `buildCaseUpdate()` multi-row `UPDATE ... CASE WHEN`. Budget: `maxDuration = 300` (literal, Next.js-required) matches the human-confirmed `CONFIRMED_MAX_DURATION_SECONDS: 300` in `34-BUDGET.md`; `SOFT_DEADLINE_RATIO = 0.8` yields 240s, matching `SOFT_DEADLINE_SECONDS: 240`. `chunk.test`-equivalent boundary cases (500/501 rows) are in `__tests__/upsert-cards.test.ts` and pass. |
| 2 | SYNC-01 (continued): every set is processed unconditionally — no age/timestamp skip logic that could silently drop a set from the run | ✓ VERIFIED | `syncAllCards()`/`syncPrices()` iterate the full `getNonTokenSets()` list with no last-synced comparison; `set-list.ts` is the single fetch point for `/sets`, filtered only by `isTokenSetId()`. Confirmed by reading `set-list.ts`, `upsert-cards.ts`, `prices.ts`. |
| 3 | SYNC-01/SYNC-03: a single set's failure is isolated so it cannot silently abort the rest of the run or the diagnostic reporting | ✗ FAILED | See Gaps. `syncAllCards()` has no per-set try/catch (unlike `syncPrices()`); an uncaught throw from `fetch()`, malformed JSON, or `upsertCards()`'s internal error crashes the whole cards half, skips `syncPrices()` entirely, and collapses the route's diagnostics into a bare 500 with no body. Confirmed via source reading (`upsert-cards.ts:302-311` vs `prices.ts:132-171`) and cross-referenced against `34-REVIEW.md` CR-01 (Critical, independently found by an automated reviewer). Unfixed as of the latest commit (`197016d`, the review-report commit itself). |
| 4 | SYNC-03: the verdict is a strict, threshold-free boolean — `setsProcessed === setsTotal` for both halves, with `setsTotal > 0` guarding the empty-list case | ✓ VERIFIED | `sync-cards/route.ts:52-54`: `cardsOk = cardResult.setsTotal > 0 && cardResult.setsProcessed === cardResult.setsTotal`; same for `pricesOk`; `success = cardsOk && pricesOk`. `__tests__/cron-route.test.ts` (12/12 passing) pins the exact-equality boundary (5-of-5 → 200, 4-of-5 → 500, no band between), the empty-set-list case, the fired-deadline case, and the "every set in exactly one of processed/failed/unprocessed" accounting identity. Ran the file directly: all 12 tests pass. |
| 5 | SYNC-02: card data reflects the swu-db.com API within 24h of a successful run | ⚠️ Code-verified, deployment-unverified | `updatedAt: sql\`now()\`` is set on every successful `upsertCards()`/`syncPrices()` write; `sync-status`'s `FRESH_WINDOW_HOURS = 24` threshold is correctly tested at the 24.00/24.01-hour boundary. The "within 24 hours" guarantee itself depends on the real daily cron actually firing on real infrastructure — routed to human verification (VALIDATION.md already flags this as manual-only). |
| 6 | SYNC-04: operator can see which sets last synced and when, without querying Neon by hand | ✓ VERIFIED (code) / routed to human for live-deploy confirmation | `GET /api/cron/sync-status` returns `{ fresh, checkedAt, sets: [{setCode, lastSyncedAt, ageHours, stale}] }` from a single aggregate query, auth-gated identically to the sync route. All 12 tests in `__tests__/sync-status-route.test.ts` pass, including the vacuous-empty-table guard (`sets.length > 0` before `every`) and deterministic ordering. Known blind spot (WR-04, non-blocking Warning): a set that has never been synced at all is entirely absent from `sets[]` rather than reported `stale:true` — flagged, not fixed, in this phase. |
| 7 | DEBT-05: the LAW spotlight deck's 9 previously "unresolved" cards resolve — all 50 cards resolve | ✓ VERIFIED | `__tests__/starter-decks-resolve.test.ts` is a real DB-backed test (no `@/db` mock) that queries `card_printings` for every one of the 746 unique collector numbers across all 22 decks in `starterDecks[]`, applying the same `variantType = 'Normal'` filter the production quick-add route uses. I ran it directly against the live database during this verification: **2/2 tests pass**, zero unresolved pairs. The roadmap criterion assumed a *data correction* was needed; the investigation instead proved the premise false (LAW was already fully synced — 901/901 printings — since 2026-07-05). The underlying truth — "all 50 cards resolve" — is empirically true today, just not via the mechanism the roadmap assumed. `CONCERNS.md`'s DEBT-05 entry was rewritten to record the disproven-cause finding rather than leaving the old "missing data" explanation in place. `src/data/starter-decks.ts` was deliberately left untouched, which is correct given the test result. |
| 8 | DEBT-05 (route/UI): a partial quick-add names what it skipped instead of claiming full success | ✓ VERIFIED | `POST /api/collection/starter-deck` returns `{ cardsAdded, cardsRequested, skipped }` (`route.ts:77`); `src/app/collection/page.tsx:230-241` renders the full-success banner only when `skipped.length === 0`, otherwise "Added {cardsAdded} of {cardsRequested} cards ... — {skipped.length} unavailable." `__tests__/starter-deck-route.test.ts` and `src/app/collection/page.test.tsx` both pass. |
| 9 | Full test suite: phase's own test files pass, and the failing-file set is a strict subset of the pre-existing 8-file/12-test red baseline | ✓ VERIFIED | Ran `npx vitest run` directly: **5 failed test files / 44 passed / 3 skipped (52); 8 failed tests / 296 passed / 33 todo (337)**. The 5 failing files (`__tests__/api-deck-validation.test.ts`, `__tests__/collection-page.test.tsx`, `tests/binder-queries.test.ts`, `tests/catalog-variant.test.ts`, `tests/data-isolation.test.ts`) are exactly a subset of the 8 recorded in `34-VALIDATION.md`'s red baseline — none are new. `npx tsc --noEmit` shows zero new errors outside the two pre-existing baseline files. |

**Score:** 7/9 truths verified (2 failed — both trace to the same CR-01 root cause; 0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/sync/chunk.ts` | Shared chunking helper, `SYNC_CHUNK_SIZE=500` | ✓ VERIFIED | Present, substantive, used by both `upsert-cards.ts` and `prices.ts` |
| `src/lib/sync/set-list.ts` | Single source of truth for non-token set list | ✓ VERIFIED | `getNonTokenSets()`, `isTokenSetId()` present; consumed by `upsert-cards.ts`, `prices.ts`, `sync-cards/route.ts` |
| `src/lib/sync/upsert-cards.ts` | Batched card sync with per-set isolation | ⚠️ PARTIAL | Batching present and correct; per-set error isolation missing (see gap above) |
| `src/lib/sync/prices.ts` | Batched price sync with per-set isolation (D-07) | ✓ VERIFIED | Try/catch wraps the full per-set body; `failedSets` populated correctly |
| `src/app/api/cron/sync-cards/route.ts` | Honest verdict, shared set list, budget-aware deadline | ✓ VERIFIED | `maxDuration=300`, single `getNonTokenSets()` call, strict-equality verdict, all wired |
| `src/app/api/cron/sync-status/route.ts` | Freshness endpoint, no outbound fetches | ✓ VERIFIED | Single aggregate query, correct guard, correct empty-table handling |
| `src/app/api/collection/starter-deck/route.ts` | Reports skipped cards instead of dropping them | ✓ VERIFIED | `skipped[]` returned and populated correctly |
| `src/app/collection/page.tsx` | Renders shortfall banner | ✓ VERIFIED | Conditional banner on `skipped.length` |
| `__tests__/starter-decks-resolve.test.ts` | DB-backed resolution proof | ✓ VERIFIED | Ran directly: 2/2 pass against live DB |
| `.planning/phases/34-card-sync-reliability/34-BUDGET.md` | Human-confirmed execution ceiling | ✓ VERIFIED | Present, non-TBD, `CONFIRMED_MAX_DURATION_SECONDS: 300` |
| `.planning/codebase/CONCERNS.md` | DEBT-05 entry rewritten | ✓ VERIFIED | Entry present, reflects disproven-cause finding, matches test evidence |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `getNonTokenSets()` | `syncAllCards()` + `syncPrices()` | one call in `sync-cards/route.ts`, identical array to both | ✓ WIRED | Confirmed by source read and by `cron-route.test.ts`'s "fetches the set list exactly once ... identical array" test (passing) |
| `card_printings.updated_at` | `sync-status`'s freshness aggregate | `MAX(updated_at) GROUP BY set_code` | ✓ WIRED | Confirmed in `sync-status/route.ts:23-30` |
| `starterDecks[].cards[].collectorNumber` | `card_printings` resolution | `inArray(...) + variantType='Normal'` | ✓ WIRED | Confirmed in both the test and the production route — identical filter |
| `printingByNumber` miss | `skipped[]` → response → banner copy | starter-deck route → collection page | ✓ WIRED | Confirmed end to end via source + passing tests |
| `34-BUDGET.md` confirmed ceiling | `maxDuration` export + soft deadline | manual transcription (Next.js requires a literal) | ✓ WIRED | Values match exactly (300 / 240) |
| `syncAllCards()` per-set failure | `failedSets` / `unprocessedSets` | per-set try/catch | ✗ NOT WIRED (for uncaught errors) | No try/catch around the loop body; only the `!ok` branch is defended. See gap. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| DEBT-05 DB-backed resolution test | `npx vitest run __tests__/starter-decks-resolve.test.ts` | 1 file, 2 tests passed | ✓ PASS |
| Full phase test surface | `npx vitest run __tests__/sync-status-route.test.ts __tests__/cron-route.test.ts __tests__/upsert-cards.test.ts` (via full-suite run, filtered by reporter output) | sync-status: 12/12 pass; cron-route: 12/12 pass; upsert-cards: 7/7 pass | ✓ PASS |
| Full workspace suite (run once) | `npx vitest run` | 5 failed files / 44 passed / 3 skipped; 8 failed tests / 296 passed / 33 todo | ✓ PASS (matches claimed baseline-subset) |
| Type check | `npx tsc --noEmit` | No output beyond the two known pre-existing baseline files | ✓ PASS |
| Per-set isolation on uncaught error (CR-01) | Code reading of `upsert-cards.ts:302-311` — no equivalent automated test exists to run | No try/catch found; `mockFetch.mockImplementation` in the existing test only ever resolves (never rejects) | ✗ FAIL (confirms the gap; no test to run against) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| SYNC-01 | 34-01, 34-02, 34-06, 34-07 | Nightly sync processes every non-token set within budget | ⚠️ PARTIAL | Batching + confirmed budget verified; per-set isolation gap undermines the "every set" guarantee for a class of transient failures |
| SYNC-02 | 34-01, 34-02, 34-03 | Every set reflects upstream data within 24h of a successful run | ⚠️ Code-verified / deployment-unverified | Correct code; live cadence unobservable from the codebase — human_needed |
| SYNC-03 | 34-02, 34-07 | A run that doesn't process every set reports failure, not success | ✗ PARTIAL / FAILED for the untested error-throw path | Strict-equality verdict fully verified for the tested paths (`!ok`, deadline, empty list); the untested uncaught-throw path degrades to a lossy, undiagnosed 500 that also cancels price sync — directly contradicts the phase's own stated "honest, granular" intent per 34-REVIEW.md CR-01 |
| SYNC-04 | 34-03 | Operator can see freshness without querying DB by hand | ✓ SATISFIED (code) | Route implemented and fully tested; live-deploy curl check routed to human_needed |
| DEBT-05 | 34-04, 34-05 | LAW deck's 9 unresolved cards corrected; all 50 resolve | ✓ SATISFIED | DB-backed test proves zero unresolved pairs today (ran independently); mechanism differs from roadmap's assumption (verify-and-close vs. data correction) but the outcome is empirically true |

No orphaned requirements — all 5 phase requirement IDs (SYNC-01, SYNC-02, SYNC-03, SYNC-04, DEBT-05) are declared across the 7 plans and cross-reference cleanly against `.planning/REQUIREMENTS.md`'s Phase 34 mapping.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/sync/upsert-cards.ts` | 302-311 | Missing per-set try/catch (CR-01) | 🛑 Blocker | Undermines SYNC-01/SYNC-03; confirmed unfixed |
| `src/app/api/cron/sync-cards/route.ts`, `sync-status/route.ts` | guard lines | Non-constant-time secret comparison (`!==`) | ⚠️ Warning | Timing side-channel on `CRON_SECRET`; explicitly flagged for review by phase intent, not fixed (WR-01 in 34-REVIEW.md) |
| `src/lib/sync/upsert-cards.ts` | 179-186 | Silent last-write-wins dedup, no telemetry | ⚠️ Warning | Duplicate-key collisions vanish with zero signal (WR-02) |
| `src/lib/sync/upsert-cards.ts` | 72 | Duplicated token-set predicate instead of importing `isTokenSetId()` | ⚠️ Warning | Two copies of the same regex can drift (WR-03); confirmed still duplicated (not imported) |
| `src/app/api/cron/sync-status/route.ts` | 23-52 | Never-synced sets are absent from `sets[]`, not marked stale | ⚠️ Warning | False-negative freshness signal for brand-new sets (WR-04) |
| `vitest.config.mts` | 12-15 | Comment overstates what `DATABASE_`-prefix env scoping actually prevents | ℹ️ Info | `AUTH_SECRET` still reaches tests if already in ambient shell env (WR-05) |
| `src/app/api/collection/starter-deck/route.ts` | 17 | Malformed JSON body returns 500 instead of 400 | ℹ️ Info | Client error misreported as server fault (IN-01) |

No TBD/FIXME/XXX debt markers found in any phase-modified file.

### Human Verification Required

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

Two of nine truths fail, and both trace back to a single confirmed, unfixed root cause: `syncAllCards()`
in `src/lib/sync/upsert-cards.ts` has no per-set error isolation, unlike `syncPrices()` in
`src/lib/sync/prices.ts`. This was independently found by an automated code review (`34-REVIEW.md`,
CR-01, Critical) and independently re-confirmed by direct source reading during this verification — the
defect is real and remains unpatched in the current HEAD.

The consequence is squarely inside this phase's headline requirement, SYNC-03: a set with a rejected
`fetch()`, a malformed JSON body, or a DB error during `upsertCards()` (including the deliberate
"unresolved swudbId" throw the phase itself added) crashes the entire cards sync uncaught. The route's
pre-existing outer `try/catch` still returns a non-2xx status (so the literal "no `success: true` on a
partial run" property survives), but it does so by falling back to a bare `Response('Sync failed', {
status: 500 })` with no JSON body — discarding every diagnostic this phase built (`failedSets`,
`unprocessedSets`, per-half accounting) — and it never reaches `syncPrices()`, so a single bad card set
silently cancels the entire price half of that night's run even though prices had nothing to do with the
failure. This also violates 34-01's own must-have truth: "syncAllCards() returns failedSets and
unprocessedSets so the caller can name which sets did not land" — in this failure mode, the function
doesn't return at all.

Every other observable truth for this phase — batched upserts, the confirmed 300s/240s budget, the
strict threshold-free verdict for all *tested* failure modes, the freshness endpoint, and the DEBT-05
DB-backed resolution proof (independently re-run against the live database during this verification,
2/2 passing) — is genuinely implemented, wired, and tested. The gap is narrow but sits at the exact
place the phase goal names as its purpose ("honestly reports when a run doesn't finish, instead of
silently succeeding on a partial result") for one specific, plausible, and currently untested failure
class.

**Fix is small and already specified** (by both `34-REVIEW.md` and this report): wrap the
`syncAllCards()` per-set loop body in the same try/catch pattern `syncPrices()` already uses, and add a
test that makes `mockFetch` reject and one that makes `upsertCards()` throw, asserting the set lands in
`failedSets` and later sets still process.

---

_Verified: 2026-08-16T18:45:00Z_
_Verifier: Claude (gsd-verifier)_
