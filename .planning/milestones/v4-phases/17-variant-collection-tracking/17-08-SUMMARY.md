---
plan: 17-08
phase: 17-variant-collection-tracking
status: complete
wave: 6
completed: 2026-05-18
---

# Plan 17-08 Summary — Human Verification Checkpoint

## Outcome

Human verification: **PASSED** (after bug fixes applied during UAT).

## What Was Verified

All four UAT items confirmed working by user:

1. **Card detail page variant rows** — all same-set variants listed with correct counts, Minus/Plus/count-input, Owned/Not owned status
2. **Increment/decrement persists** — counts survive page reload
3. **Total line** — correctly sums all variant owned counts
4. **Catalog and deck builder owned-count overlays** — still working with new CollectionMap `.total` shape

## Bugs Found and Fixed During UAT

Three bugs were identified and fixed before passing:

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| 1 | Catalog +/− buttons do nothing | `onUpdateCount` removed in Plan 04 but `CardItem` still rendered controls unconditionally | Gate +/− overlay on `onUpdateCount !== undefined` |
| 2 | Variants all 0 for existing users | `user_printing_collections` empty; `userId` not passed to `getCardByPrinting` so `collectionCount` was always 0 | Pass `userId` to `getCardByPrinting` |
| 3 | Variant increment overwrites prior total | `recomputeTotal` sums only variant rows (1) and overwrites legacy total (e.g. 5) | One-time hydration: if user has legacy total but no variant rows, initialize Normal variant with legacy total on page load |

## Self-Check: PASSED

- Card detail page works end-to-end ✓
- Catalog read-only (no broken buttons) ✓
- Owned counts preserved and accurate ✓
- All phase tests GREEN (24/24) ✓
- TypeScript clean ✓
