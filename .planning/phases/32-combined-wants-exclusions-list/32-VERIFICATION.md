---
phase: 32-combined-wants-exclusions-list
verified: 2026-07-20T14:00:01Z
status: gaps_found
score: 3/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "The user can hide (exclude) an auto-generated want and later restore a previously excluded auto-want — this behaviour is preserved from before the redesign (Roadmap Phase 32 Success Criterion 2 / BINDER-19)"
    status: partial
    reason: "The exclude/restore round trip works and is human-verified for the common case (a card that is still a current, unresolved deck shortfall). But `autoWants` and `tradeExclusions` are populated by independent DB queries (src/db/queries/trade.ts) and can diverge: autoWants only includes a card when it has a live shortfall>0 for a CURRENT deck (line 127), while exclusions is every row in tradeExclusions for the user (lines 26-34) with no such filter. Once an exclusion's card drops out of autoWants (its deck is removed, or the shortfall is resolved by acquiring copies), the exclusion record still exists server-side but is no longer rendered anywhere in the new two-section list, because restore is now only reachable by clicking an excluded row inside Deck Wants. The standalone Exclusions section this phase deleted (per locked decision D-01, whose stated rationale was that it 'duplicated the dimmed inline excluded auto-wants and is redundant') was the only UI surface that rendered the full, independent `exclusions` array regardless of autoWants membership — so before this phase every exclusion was restorable, and after this phase a subset becomes permanently unrestorable via the UI. This is a verified functional regression against the phase's own explicit roadmap wording ('this behaviour is preserved from before the redesign'), not a hypothetical: confirmed by reading src/db/queries/trade.ts:26-34 and 118-130 and src/components/binder/manage-wants-list.tsx (no code path renders an exclusion that lacks a matching autoWants entry). It is also documented independently as WR-01 in 32-REVIEW.md, whose data-flow trace matches this verifier's own reading of trade.ts."
    artifacts:
      - path: "src/components/binder/manage-wants-list.tsx"
        issue: "Only renders exclusion state for cardDefinitionIds present in the autoWants prop; has no path to display or restore an exclusion whose card has fallen out of autoWants"
      - path: "src/app/binder/manage/page.tsx"
        issue: "No longer passes the full `exclusions` array to ManageWantsList (props removed per D-01), so orphaned exclusions have no consumer even though page.tsx still fetches and optimistically maintains `tradeData.exclusions` (lines 56, 305-333) — that state is now dead/unread (REVIEW.md IN-01)"
      - path: "src/db/queries/trade.ts"
        issue: "autoWants (line 118-130) and exclusions (line 26-34) are independent, unfiltered-against-each-other queries; this is pre-existing and unchanged by Phase 32, but it is what makes the two arrays able to diverge"
    missing:
      - "A UI path to surface and restore/clear an exclusion whose cardDefinitionId is not present in autoWants (e.g. render orphaned exclusions.filter(e => !autoWants.some(w => w.cardDefinitionId === e.cardDefinitionId)) as additional rows inside Deck Wants, or a compact scoped subsection per REVIEW.md's option (b)) — OR an explicit product decision, recorded as a VERIFICATION override, to accept that orphaned exclusions are no longer manageable through the UI (in which case the dead exclusions client state in page.tsx should also be removed, and ideally the server should auto-prune tradeExclusions rows when the shortfall resolves so stale rows don't silently reactivate later)"
---

# Phase 32: Combined Wants & Exclusions List Verification Report

**Phase Goal:** `ManageWantsList` shows deck-driven auto-wants and manually-added wants (including wants added for cards outside the user's collection, per Phase 30) together in one clearly-sectioned list, keeps the existing exclude/restore behaviour for auto-wants, and adds quantity/removal controls for manual wants.
**Verified:** 2026-07-20T14:00:01Z (session date; last commit and human UAT dated 2026-07-20)
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The wants list displays auto-wants and manual wants together in one list, with a clear visual distinction between the two (BINDER-18) | ✓ VERIFIED | `src/components/binder/manage-wants-list.tsx`: exactly 2 `<section>` blocks (grep confirms `2`), `<h3>Deck Wants</h3>`-style header with count pill (line 46-51) and `<h3>Manual Wants</h3>` header with count pill (line 111-116); no standalone Exclusions `<section>` and no per-row Auto/Manual badge remain. Human UAT (32-02-SUMMARY.md, check 2) confirms this renders correctly in the browser. |
| 2 | The user can hide (exclude) an auto-generated want and later restore a previously excluded auto-want — this behaviour is preserved from before the redesign (BINDER-19) | ✗ FAILED (partial) | Common-case round trip verified: exclude wires to `onToggleExclusion(cardDefinitionId, true)` (line 96), dims the row to `opacity-50` with an "Excluded" tag and restore control wired to `onToggleExclusion(cardDefinitionId, false)` (lines 60-81), sorted to the bottom via a non-mutating shallow-copy sort (lines 38-40); human UAT (32-02-SUMMARY.md, check 3) confirms this works live. **However**, the behaviour is not fully preserved: `autoWants` and `tradeExclusions` are independent queries in `src/db/queries/trade.ts` that can diverge (autoWants requires a live shortfall>0 for a current deck; exclusions has no such filter). Once an excluded card's autoWant entry disappears (deck removed, or shortfall resolved), the exclusion becomes unreachable and unrestorable in the new UI — a real functional regression from the pre-redesign standalone Exclusions section, which rendered every exclusion regardless of autoWants membership. See gap detail above and REVIEW.md WR-01. |
| 3 | The user can change the quantity of a manual want, or remove it entirely, directly from the wants list without leaving the page (BINDER-20) | ✓ VERIFIED | `−`/`+` stepper wired to `onUpdateWantQuantity(want.cardPrintingId, ...)` with `Math.max(0, quantity - 1)` floor (lines 142-155); `[x]` remove wired to `onRemoveWant(want.cardPrintingId)` (lines 158-165), which `page.tsx` implements as `onRemoveWant={(id) => updateWantQuantity(id, 0)}` (page.tsx:487); variant badge only renders `want.variantType !== 'Normal'` (line 128); no owned/not-owned indicator present. Human UAT (32-02-SUMMARY.md, check 4) confirms live update with no page reload and correct badge behavior. |
| 4 | `manage/page.tsx` invocation resolves against the updated props contract; project typechecks and builds | ✓ VERIFIED | `ManageWantsList` invocation (page.tsx:483-489) passes exactly `wants`, `autoWants`, `onUpdateWantQuantity`, `onRemoveWant`, `onToggleExclusion` — no `exclusions`/`onRemoveExclusion`. `grep -c onRemoveExclusion` returns 0 in both files. `npx tsc --noEmit` reports no errors in either changed file (checked directly by this verifier). One pre-existing, unrelated lint error remains in `page.tsx` (`react-hooks/set-state-in-effect` at line 116, in the unrelated `fetchData` effect) — confirmed pre-existing via `git show 9b8bad4` per 32-01-SUMMARY.md and independently reproduced by this verifier; out of this phase's scope. |

**Score:** 3/4 truths verified (1 failed/partial)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/binder/manage-wants-list.tsx` | Restructured two-section list | ✓ VERIFIED (with caveat) | Exists, substantive, wired to both handler props. Data-flow for excluded rows is incomplete for orphaned exclusions (see Truth 2 gap). |
| `src/app/binder/manage/page.tsx` | Invocation aligned to updated props contract | ✓ VERIFIED | Props match the new `ManageWantsListProps` interface exactly; `toggleExclusion` and `updateWantQuantity` optimistic handlers unchanged, as required. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `manage-wants-list.tsx` Ban control | `onToggleExclusion(cardDefinitionId, true)` | prop call | ✓ WIRED | Exclude action fires correctly for any row currently rendered in Deck Wants. |
| `manage-wants-list.tsx` restore control | `onToggleExclusion(cardDefinitionId, false)` | prop call | ⚠️ PARTIAL | Wired correctly for rows that are rendered, but rows for orphaned exclusions (not in `autoWants`) are never rendered at all — the link is architecturally unreachable for that subset. |
| `manage-wants-list.tsx` stepper/remove | `onUpdateWantQuantity` / `onRemoveWant` | prop call | ✓ WIRED | Confirmed for both increment/decrement and remove-via-zero-quantity. |
| `page.tsx` `toggleExclusion` | `POST /api/binder/exclusions` | fetch + optimistic state update | ✓ WIRED | Unchanged from before this phase; confirmed present at page.tsx:298-333. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| BINDER-18 | 32-01 | Combined, visually-distinguished wants list | ✓ SATISFIED | Two-section layout confirmed in code and human UAT. |
| BINDER-19 | 32-01 | Exclude/restore an auto-want, round trip preserved | ⚠️ PARTIALLY SATISFIED | Common-case round trip works; full "restore a previously excluded one" claim is falsified for exclusions whose card has left `autoWants` (see gap). |
| BINDER-20 | 32-01 | Quantity/remove for manual wants from the list | ✓ SATISFIED | Stepper and remove confirmed in code and human UAT. |

REQUIREMENTS.md currently lists BINDER-18/19/20 as "Pending" under Traceability (not yet flipped to "Complete") — expected prior to a passing verification/ship step, not itself a gap.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/binder/manage/page.tsx` | 56, 305-333 | Dead client state: `tradeData.exclusions` is fetched and optimistically maintained but never rendered anywhere after the standalone Exclusions section was removed | ℹ️ Info | Not a correctness bug today (server is source of truth), but misleading maintenance surface; documented as REVIEW.md IN-01. Would become live again if the Truth-2 gap is fixed by re-surfacing orphaned exclusions. |
| `src/components/binder/manage-wants-list.tsx` | 41, 52 | `activeAutoWantCount` (excludes excluded rows) drives the header pill while the empty-state guard uses `autoWants.length === 0`; when every deck want is excluded, header reads "Deck Wants 0" while the section still lists rows | ℹ️ Info | Cosmetic count/content mismatch; documented as REVIEW.md IN-02. |

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers found in either changed file (grep returned no matches).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Two `<section>` blocks present | `grep -c '<section' manage-wants-list.tsx` | `2` | ✓ PASS |
| `onRemoveExclusion` fully removed | `grep -c onRemoveExclusion` on both files | `0`, `0` | ✓ PASS |
| Project typechecks for the two changed files | `npx tsc --noEmit` | no errors attributable to either file | ✓ PASS |
| No debt markers in changed files | `grep -nE 'TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER'` | no matches | ✓ PASS |

No test file exercises `ManageWantsList` or the exclusion round trip directly (`tests/binder-manage-render.test.tsx` only stubs an empty `exclusions: []` fetch response) — consistent with 32-01-SUMMARY.md's own note that the round trip was verified via human UAT rather than an automated test.

### Human Verification Required

None outstanding for the truths already covered by 32-02's UAT (combined layout, common-case exclude/restore round trip, manual stepper/remove, no console errors) — those were explicitly tested and passed per 32-02-SUMMARY.md.

The remaining item is not a "please click through the UI" verification — it is a **product/scope decision** the developer needs to make explicitly, since the code review already did the technical legwork:

1. **Decide the intended behavior for orphaned exclusions** — Should a UI path be added to surface and restore exclusions whose card has left `autoWants` (REVIEW.md's option (a) or (b)), or should this be accepted as an intentional scope reduction (in which case the dead `exclusions` client state in `page.tsx` should be cleaned up, and ideally `tradeExclusions` rows should be auto-pruned server-side when a shortfall resolves so they don't silently reactivate unmanageable later)?
   - **Why this needs a human decision, not more automated checking:** this is a product-scope tradeoff (how much edge-case data hygiene the wants list needs to guarantee), not a fact the codebase alone can resolve.

### Gaps Summary

The phase substantially achieves its goal: BINDER-18 (combined two-section list) and BINDER-20 (manual want stepper/remove) are both fully implemented, wired, and human-verified with no issues. BINDER-19 (exclude/restore) works for the common case that was tested in UAT, but the phase's own stated goal text — "keeps the existing exclude/restore behaviour for auto-wants" — and the roadmap's Success Criterion 2 — "restore a previously excluded auto-want... this behaviour is preserved from before the redesign" — are not fully true. Deleting the standalone Exclusions section (locked decision D-01) was justified on the premise that it was "redundant" with the inline dimmed rows in Deck Wants; that premise is false, because `autoWants` and `tradeExclusions` are independently-queried and can diverge, so a subset of exclusions become permanently unrestorable through the UI once their card falls out of `autoWants`. This is a real, source-confirmed regression (independently corroborated by 32-REVIEW.md's WR-01), not a stylistic nitpick, and it is the reason this phase is not marked `passed`.

**This looks like it could be intentional scope-narrowing rather than an oversight**, if the team judges orphaned exclusions to be rare/low-impact edge cases. To accept this deviation instead of closing it with a follow-up plan, add to this file's frontmatter:

```yaml
overrides:
  - must_have: "The user can hide (exclude) an auto-generated want and later restore a previously excluded auto-want — this behaviour is preserved from before the redesign"
    reason: "Orphaned exclusions (card no longer in autoWants) are an accepted edge case; will be addressed by a future server-side auto-prune of tradeExclusions rather than a UI path"
    accepted_by: "<name>"
    accepted_at: "<ISO timestamp>"
```

---

_Verified: 2026-07-20T14:00:01Z_
_Verifier: Claude (gsd-verifier)_
