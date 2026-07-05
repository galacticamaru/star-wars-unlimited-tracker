---
phase: 28-tech-debt-sweep
verified: 2026-06-03T11:35:00Z
status: human_needed
score: 5/6 must-haves verified
overrides_applied: 0
human_verification:
  - test: "On a mobile browser, edit owned counts for a card on its detail page, then press the native device back button to return to the catalog. Do NOT tap a navigation link — use the hardware/software back button to trigger a BFCache restore."
    expected: "The catalog owned-count overlay for that card reflects the new count without requiring a manual page refresh."
    why_human: "BFCache restore behavior (event.persisted === true) cannot be triggered programmatically in a test environment. The pageshow listener wiring is confirmed in source and all 7 automated tests pass, but the end-to-end behavior on a real mobile browser is only verifiable through manual device testing."
---

# Phase 28: Tech Debt Sweep Verification Report

**Phase Goal:** Close DEBT-01 (dead code removal), DEBT-03 (variant enum gaps), and DEBT-04 (stale catalog overlay after BFCache restore).
**Verified:** 2026-06-03T11:35:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CollectionControls no longer exists anywhere in the codebase — no component file, no imports, no references (DEBT-01) | VERIFIED | `src/components/catalog/collection-controls.tsx` returns `DELETED` via `test -f`; grep for `CollectionControls` across all of `src/` returns zero matches |
| 2 | Prestige Foil is a selectable option in the catalog variant filter (DEBT-03) | VERIFIED | `VARIANT_OPTIONS` in `src/components/catalog/variant-filter.tsx` line 11 reads exactly `['Normal', 'Foil', 'Hyperspace', 'Hyperspace Foil', 'Showcase', 'Prestige', 'Prestige Foil', 'Serialized']` — all 8 entries present, 'Prestige Foil' between 'Prestige' and 'Serialized' |
| 3 | Serialized is ranked above Prestige Foil in variant art precedence (DEBT-03) | VERIFIED | `VARIANT_PRECEDENCE` in `src/lib/catalog/select-best-variant.ts` lines 14-23 contains `Serialized: 8` as the first/highest entry and `'Prestige Foil': 7` immediately after; JSDoc header line 8 reads `Serialized(8) > Prestige Foil(7) > Prestige(6) > ...` |
| 4 | The schema variantType comment lists all 8 variant types (DEBT-03) | VERIFIED | `src/db/schema.ts` line 104: `text('variant_type').notNull(), // "Normal" \| "Foil" \| "Hyperspace" \| "Hyperspace Foil" \| "Showcase" \| "Prestige" \| "Prestige Foil" \| "Serialized"` — all 8 types present; column definition unchanged |
| 5 | When the browser restores the catalog from BFCache (device back button) for an authenticated user, the collection is re-fetched (DEBT-04) | VERIFIED (automated) | `src/components/catalog/catalog-client.tsx` lines 93-101: `useEffect` registers `window.addEventListener('pageshow', handlePageShow)` and cleanup `window.removeEventListener('pageshow', handlePageShow)`; handler guards on `e.persisted && isAuthenticated` before calling `fetchCollection()`; all 7 vitest tests in `catalog-client-pageshow.test.ts` pass |
| 6 | After updating owned counts on a card detail page and navigating back to the catalog, the catalog owned-count overlay shows the updated number — no stale state (DEBT-04) | UNCERTAIN — human needed | The listener wiring is correct in source. End-to-end overlay freshness after a real BFCache restore on a mobile device cannot be verified programmatically. |

**Score:** 5/6 truths verified (truth 6 needs human confirmation)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/catalog/collection-controls.tsx` | Deleted — must not exist | VERIFIED DELETED | File absent from filesystem; `test -f` confirms non-existence |
| `src/components/catalog/variant-collection-section.tsx` | No `CollectionControls` string; logic intact | VERIFIED | Zero grep matches for `CollectionControls` in file; `updateVariant`, optimistic `setCounts`, rollback all present |
| `src/components/catalog/variant-filter.tsx` | VARIANT_OPTIONS includes 'Prestige Foil' | VERIFIED | Line 11 confirms full 8-entry array |
| `src/lib/catalog/select-best-variant.ts` | VARIANT_PRECEDENCE contains `Serialized: 8` | VERIFIED | Lines 14-23 confirm `Serialized: 8` as highest entry; `?? 0` fallback preserved for unknown variants |
| `src/db/schema.ts` | variantType comment lists all 8 types | VERIFIED | Line 104 inline comment lists all 8 types; column definition unchanged |
| `src/components/catalog/catalog-client.tsx` | pageshow listener with BFCache re-fetch | VERIFIED | Lines 89-101; `fetchCollection()` shared helper (lines 72-79) reused by both the remount effect and the pageshow handler |
| `src/components/catalog/catalog-client-pageshow.test.ts` | 7 tests covering pageshow behavior | VERIFIED | File exists; `npx vitest run` → 7/7 passed, 0 failed |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/catalog/select-best-variant.ts` | `selectBestVariantArtUrl` | `VARIANT_PRECEDENCE[artData.variantType]` | VERIFIED | Line 51: `VARIANT_PRECEDENCE[artData.variantType] ?? 0` — lookup is live and wired |
| `src/components/catalog/catalog-client.tsx` | `/api/collection` | `fetch` in `pageshow` handler | VERIFIED | `fetchCollection()` on line 75 calls `fetch('/api/collection')`; called from both `useEffect([isAuthenticated])` (line 83) and `handlePageShow` (line 96) |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `catalog-client.tsx` | `collection` (CollectionMap) | `fetch('/api/collection')` → `setCollection(data)` | Yes — GET /api/collection returns real DB-backed collection data (verified in prior phases; route enforces auth at lines 8-11) | FLOWING |
| `variant-filter.tsx` | `VARIANT_OPTIONS` (static constant) | Static array — not dynamic | N/A — static display constant | STATIC (by design; correct) |
| `select-best-variant.ts` | `VARIANT_PRECEDENCE` | Static record — used as lookup table | N/A — static lookup | STATIC (by design; correct) |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| pageshow tests pass | `npx vitest run src/components/catalog/catalog-client-pageshow.test.ts` | 7/7 passed, 0 failed, exit 0 | PASS |
| CollectionControls fully absent from src/ | `grep -r "CollectionControls" src/` | No matches found | PASS |
| VARIANT_OPTIONS 8-entry array present | Source read of variant-filter.tsx line 11 | Full array confirmed | PASS |
| Serialized: 8 and Prestige Foil: 7 in precedence record | Source read of select-best-variant.ts lines 14-23 | Both entries confirmed | PASS |
| schema variantType comment lists all 8 types | Source read of schema.ts line 104 | All 8 types confirmed | PASS |

---

### Probe Execution

No conventional `scripts/*/tests/probe-*.sh` probes defined for this phase. Step 7c: SKIPPED (no probe declarations in PLAN.md files and no conventional probe paths found).

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DEBT-01 | 28-01-PLAN.md | `CollectionControls` component and its dead imports removed | SATISFIED | File deleted; zero grep matches for `CollectionControls` in `src/`; stale comment references in `variant-collection-section.tsx` cleaned |
| DEBT-03 | 28-01-PLAN.md | `Prestige Foil` added to `VARIANT_OPTIONS`; `Serialized` added to `VARIANT_PRECEDENCE` | SATISFIED | `variant-filter.tsx` line 11 and `select-best-variant.ts` lines 14-23 both confirmed; schema comment also updated to 8 types |
| DEBT-04 | 28-02-PLAN.md | Catalog collection state re-fetches correctly after card detail page owned-count mutations | SATISFIED (automated) / NEEDS HUMAN (end-to-end BFCache flow) | `pageshow` listener wired and tested; manual BFCache smoke test pending |

All three requirement IDs declared across both PLAN frontmatters are covered. No orphaned requirements in REQUIREMENTS.md for Phase 28.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No TBD/FIXME/XXX markers found in any modified file |

No debt markers, no placeholder returns, no hardcoded empty data in the modified files (`variant-collection-section.tsx`, `variant-filter.tsx`, `select-best-variant.ts`, `schema.ts`, `catalog-client.tsx`). The `eslint-disable-line react-hooks/exhaustive-deps` comments in `catalog-client.tsx` are pre-existing and intentional (noted in PLAN.md), not new anti-patterns introduced by this phase.

---

### Human Verification Required

#### 1. BFCache Catalog State Freshness (DEBT-04)

**Test:** On a mobile browser (iOS Safari or Android Chrome — both implement BFCache aggressively), navigate to the catalog page while authenticated. Open a card detail page, change one or more owned-count values using the +/- controls, then press the device native back button (hardware or software — do NOT tap a nav link, as that would trigger a normal React remount rather than a BFCache restore).

**Expected:** The catalog owned-count overlay for the card you just edited reflects the new count without a manual page refresh.

**Why human:** BFCache restore fires `pageshow` with `event.persisted === true` only in a real browser navigating back from a page it cached. This cannot be reliably triggered in jsdom or Node.js test environments. The `pageshow` listener, `e.persisted` guard, `isAuthenticated` guard, and `fetchCollection()` call are all verified in source and pass 7 automated tests — the only unverified dimension is whether a real mobile BFCache restore actually fires the event and the fetched data updates the overlay visually.

---

### Gaps Summary

No blocking gaps. All automated checks pass. One must-have truth (DEBT-04 end-to-end BFCache overlay freshness) requires a manual smoke test on a real mobile browser because the BFCache restore event cannot be simulated in the test environment. This is classified as `human_needed` per the verification decision tree, not `gaps_found`, because the implementation is correct and fully wired — only the real-device behavior needs human confirmation.

---

_Verified: 2026-06-03T11:35:00Z_
_Verifier: Claude (gsd-verifier)_
