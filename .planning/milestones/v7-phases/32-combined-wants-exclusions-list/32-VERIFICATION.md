---
phase: 32-combined-wants-exclusions-list
verified: 2026-07-21T00:00:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 3/4
  gaps_closed:
    - "The user can hide (exclude) an auto-generated want and later restore a previously excluded auto-want — this behaviour is preserved from before the redesign (BINDER-19), including exclusions whose card has fallen out of autoWants (orphaned exclusions)"
  gaps_remaining: []
  regressions: []
---

# Phase 32: Combined Wants & Exclusions List Verification Report

**Phase Goal:** `ManageWantsList` shows deck-driven auto-wants and manually-added wants (including wants added for cards outside the user's collection, per Phase 30) together in one clearly-sectioned list, keeps the existing exclude/restore behaviour for auto-wants, and adds quantity/removal controls for manual wants.
**Verified:** 2026-07-21T00:00:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (plan 32-03)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The wants list displays auto-wants and manual wants together in one list, with a clear visual distinction between the two (BINDER-18) | ✓ VERIFIED | `src/components/binder/manage-wants-list.tsx`: exactly 2 `<section>` blocks (`grep -c '<section'` returns `2`), `Deck Wants` header with count pill (lines 62-70) and `Manual Wants` header with count pill (lines 154-158). No standalone Exclusions section. Unchanged by 32-03 — still intact. |
| 2 | The user can hide (exclude) an auto-generated want and later restore a previously excluded auto-want — this behaviour is preserved from before the redesign, INCLUDING when the card has fallen out of `autoWants` (BINDER-19) | ✓ VERIFIED | Common case unchanged: exclude wires to `onToggleExclusion(cardDefinitionId, true)` (line 115), dims to `opacity-50` with an "Excluded" tag and restore wired to `onToggleExclusion(w.cardDefinitionId, false)` (lines 78-100). **Gap now closed**: `ManageWantsListProps` reintroduces a required `exclusions: ExclusionItem[]` prop (lines 21-25, 30, 39), `orphanedExclusions = exclusions.filter((e) => !autoWants.some((w) => w.cardDefinitionId === e.cardDefinitionId))` (lines 54-56) is computed and rendered as additional dimmed rows at the bottom of Deck Wants (lines 125-148), each with an "Excluded" tag, no quantity pill, and a restore control wired to `onToggleExclusion(e.cardDefinitionId, false)` (line 141) — identical POST path to the in-`autoWants` case. `page.tsx` now passes `exclusions={tradeData?.exclusions || []}` (page.tsx:486), re-activating the previously dead `tradeData.exclusions` optimistic state maintained in `toggleExclusion` (page.tsx:298-333). Every exclusion, orphaned or not, is now reachable and restorable through the UI. |
| 3 | The user can change the quantity of a manual want, or remove it entirely, directly from the wants list without leaving the page (BINDER-20) | ✓ VERIFIED | `−`/`+` stepper wired to `onUpdateWantQuantity(want.cardPrintingId, ...)` with `Math.max(0, quantity - 1)` floor (lines 183-198); `[x]` remove wired to `onRemoveWant(want.cardPrintingId)` (lines 201-208), implemented in `page.tsx` as `onRemoveWant={(id) => updateWantQuantity(id, 0)}` (page.tsx:488). Manual Wants section markup byte-for-byte unchanged by 32-03 (plan explicitly preserved it verbatim; confirmed by reading lines 153-214). |
| 4 | `manage/page.tsx` invocation resolves against the updated props contract; project typechecks and builds | ✓ VERIFIED | `ManageWantsList` invocation (page.tsx:483-490) now passes `wants`, `autoWants`, `exclusions`, `onUpdateWantQuantity`, `onRemoveWant`, `onToggleExclusion` — matching the reintroduced `ManageWantsListProps` interface exactly. `onRemoveExclusion` remains absent from both files (`grep -n onRemoveExclusion` returns no matches in either file). `npx tsc --noEmit` reports no errors attributable to either changed file (checked directly by this verifier). Scoped `npx eslint` on both changed files shows exactly one error — the same pre-existing, out-of-scope `react-hooks/set-state-in-effect` warning at `page.tsx:116` in the unrelated `fetchData` effect, independently reproduced and confirmed unchanged from the prior verification pass. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/binder/manage-wants-list.tsx` | Two-section list; orphaned exclusions rendered dimmed and restorable inside Deck Wants | ✓ VERIFIED | Exists, substantive, wired. `exclusions` prop present, `orphanedExclusions` derived and rendered (lines 21-25, 30, 39, 54-57, 125-148). Still exactly 2 `<section>` blocks — no third/standalone Exclusions section (D-01 honored). |
| `src/app/binder/manage/page.tsx` | Passes full `exclusions` array to `ManageWantsList` | ✓ VERIFIED | `exclusions={tradeData?.exclusions || []}` present at line 486. `toggleExclusion`, `updateWantQuantity`, `onRemoveWant` wiring unchanged. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `manage-wants-list.tsx` Ban control (active auto-want) | `onToggleExclusion(cardDefinitionId, true)` | prop call | ✓ WIRED | Unchanged from prior pass. |
| `manage-wants-list.tsx` restore control (excluded auto-want, in `autoWants`) | `onToggleExclusion(cardDefinitionId, false)` | prop call | ✓ WIRED | Unchanged from prior pass. |
| `manage-wants-list.tsx` restore control (orphaned exclusion, NOT in `autoWants`) | `onToggleExclusion(cardDefinitionId, false)` | prop call | ✓ WIRED | **Newly closed.** Line 141 — same handler, same POST path, now reachable for every exclusion regardless of `autoWants` membership. |
| `manage-wants-list.tsx` stepper/remove | `onUpdateWantQuantity` / `onRemoveWant` | prop call | ✓ WIRED | Unchanged from prior pass. |
| `page.tsx` `toggleExclusion` | `POST /api/binder/exclusions` | fetch + optimistic state update | ✓ WIRED | Unchanged from prior pass; now genuinely read by the render path via the `exclusions` prop instead of being dead state. |
| `page.tsx` `tradeData.exclusions` (fetched + optimistically maintained) | `manage-wants-list.tsx` `exclusions` prop | prop pass-through | ✓ WIRED | **Newly closed.** Previously dead state (REVIEW.md IN-01) is now consumed. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `manage-wants-list.tsx` | `exclusions` prop | `page.tsx` `tradeData.exclusions`, sourced from `getUserTradeData` → `src/db/queries/trade.ts:26-34` (real `tradeExclusions` DB query joined to `cardDefinitions`) | Yes | ✓ FLOWING |
| `manage-wants-list.tsx` | `orphanedExclusions` derived value | Client-side filter of the `exclusions` prop against `autoWants` membership — no new server query, matches plan's stated approach | Yes (derived from real data) | ✓ FLOWING |

`src/db/queries/trade.ts` confirms `autoWants` (lines 118-167, filtered to shortfall > 0 for current decks) and `exclusions` (lines 26-34, unfiltered against deck/shortfall state) remain independent queries — this divergence is exactly what plan 32-03 was written to surface UI-side, and it now does, via the `orphanedExclusions` derivation.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| BINDER-18 | 32-01, 32-03 | Combined, visually-distinguished wants list | ✓ SATISFIED | Two-section layout confirmed in code; unchanged/preserved by 32-03. |
| BINDER-19 | 32-01, 32-03 | Exclude/restore an auto-want, round trip preserved (including orphaned exclusions) | ✓ SATISFIED | Common-case round trip intact; orphaned-exclusion gap from prior verification now closed — every exclusion is rendered and restorable regardless of `autoWants` membership. |
| BINDER-20 | 32-01 | Quantity/remove for manual wants from the list | ✓ SATISFIED | Stepper and remove confirmed in code, markup unchanged by 32-03. |

REQUIREMENTS.md still lists BINDER-18/19/20 as "Pending" under Traceability — this is expected prior to the ship step flipping status, not a gap in this phase.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | `grep -nE 'TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER'` on both changed files returns no matches. The two Info-level items from the prior verification pass (dead `tradeData.exclusions` state; count-pill/empty-state mismatch) are both resolved by 32-03 (REVIEW.md IN-01 and IN-02) — `exclusions` state is now read via the prop, and the empty-state guard now checks `autoWants.length === 0 && orphanedExclusions.length === 0` with a self-consistent `· N excluded` count-pill indicator (lines 57, 66-69, 71). |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Two `<section>` blocks present (D-01/BINDER-18 preserved) | `grep -c '<section' manage-wants-list.tsx` | `2` | ✓ PASS |
| `exclusions` prop reintroduced | `grep -n 'exclusions' manage-wants-list.tsx` | present at props interface, destructuring, and derivation | ✓ PASS |
| `orphanedExclusions` derivation present and rendered | `grep -n 'orphanedExclusions'` | 3 matches (derivation, count-pill math, render map) | ✓ PASS |
| Orphaned-row restore wired to `onToggleExclusion(id, false)` | `grep -n 'onToggleExclusion(e.cardDefinitionId, false)'` | line 141 | ✓ PASS |
| `page.tsx` passes full exclusions array | `grep -n 'exclusions={tradeData'` | page.tsx:486 | ✓ PASS |
| `onRemoveExclusion` fully absent (no reintroduction of removed per-item handler) | `grep -n onRemoveExclusion` on both files | no matches | ✓ PASS |
| Project typechecks for the two changed files | `npx tsc --noEmit` | no errors attributable to either file | ✓ PASS |
| Scoped lint shows no NEW errors | `npx eslint manage-wants-list.tsx page.tsx` | 1 error, same pre-existing `react-hooks/set-state-in-effect` at page.tsx:116 (unrelated `fetchData` effect, confirmed pre-existing) | ✓ PASS |
| No debt markers in changed files | `grep -nE 'TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER'` | no matches | ✓ PASS |

No automated test exercises `ManageWantsList` or the orphaned-exclusion round trip directly — consistent with 32-01/32-03's own notes that this round trip was verified via human UAT rather than an automated test. This was already true of the in-`autoWants` round trip verified in 32-02 and is not a new gap.

### Human Verification Required

None outstanding. The prior verification's single open item — a product/scope decision on whether orphaned exclusions needed a UI path or an accepted-regression override — has been resolved by implementation (32-03 added the UI path) rather than by override. The orphaned-exclusion exclude→restore round trip is flagged in 32-03-SUMMARY.md as UAT-recommended (same class of manual confirmation 32-01 flagged for the in-`autoWants` case, and the styling reuses 32-02's already-approved dimmed-row treatment verbatim per the phase's noted `ui.safety-gate` override) — not a blocker for this verification pass, since the code path, wiring, and data flow are all directly confirmed in source.

### Gaps Summary

None. The single gap from the prior verification pass — BINDER-19's "restore a previously excluded auto-want... behaviour preserved from before the redesign" not holding for exclusions whose card had fallen out of `autoWants` — is closed by plan 32-03: the full `exclusions` array is re-threaded from `page.tsx` into `ManageWantsList`, an `orphanedExclusions` derivation renders every otherwise-unreachable exclusion as a dimmed, restorable row at the bottom of the Deck Wants section (not a new standalone section — locked decision D-01 remains honored, confirmed by the unchanged section count of 2), and the restore control uses the identical `onToggleExclusion(cardDefinitionId, false)` → `POST /api/binder/exclusions` path as the in-`autoWants` case. BINDER-18 and BINDER-20 were re-confirmed intact and unregressed by this change. Both Info-level anti-patterns noted in the prior pass (dead `tradeData.exclusions` state; count/empty-state mismatch) are also resolved as a side effect. The phase goal is now fully achieved.

---

_Verified: 2026-07-21T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
