---
phase: 17-variant-collection-tracking
plan: "05"
subsystem: variant-collection-ui
tags: [ui, client-component, optimistic-ui, card-detail, wave-3]
dependency_graph:
  requires:
    - src/db/queries/card-detail.ts (getSameSetPrintingsWithCounts — from Plan 02)
    - src/app/api/collection/variants/route.ts (POST endpoint — from Plan 03)
  provides:
    - src/components/catalog/variant-collection-section.tsx (VariantCollectionSection client component)
    - src/app/cards/[set-code]/[card-number]/page.tsx (updated RSC — fetches printings, renders VariantCollectionSection)
  affects:
    - src/components/catalog/collection-controls.tsx (removed from card detail page; file stays in codebase for catalog)
tech_stack:
  added: []
  patterns:
    - useState<Record<number, number>> keyed by cardPrintingId for optimistic UI
    - Math.max(0, newCount) floor before fetch (defense-in-depth with server-side floor)
    - Sequential RSC fetch: card → notFound check → getSameSetPrintingsWithCounts
    - auth redirect via router.push('/login') when session missing
    - Section hidden when userId null (unauthenticated RSC path)
key_files:
  created:
    - src/components/catalog/variant-collection-section.tsx
  modified:
    - src/app/cards/[set-code]/[card-number]/page.tsx
decisions:
  - "VariantCollectionSection receives printings as props from RSC — no client-side fetch for initial data (Pattern 5)"
  - "Unauthenticated path: userId null means printings=[] and section is not rendered (userId && printings.length > 0 guard)"
  - "Total line always rendered at bottom of section per D-12; even at 0 copies"
  - "variantType field rendered as-is from DB — no transformation (D-08, context_note about Hyperspace numbers)"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-17"
---

# Phase 17 Plan 05: VariantCollectionSection Component and Page Wiring Summary

VariantCollectionSection client component created with per-variant +/- controls, optimistic count state, and a read-only total line; card detail RSC updated to fetch same-set printings via getSameSetPrintingsWithCounts and render the new section in place of CollectionControls.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create VariantCollectionSection client component | 6ba781e | src/components/catalog/variant-collection-section.tsx |
| 2 | Update card detail page.tsx to use VariantCollectionSection | 867680d | src/app/cards/[set-code]/[card-number]/page.tsx |

## Verification

```
npx tsc --noEmit
```
Result: exits 0 — TypeScript clean after both tasks.

```
grep -n "CollectionControls" src/app/cards/[set-code]/[card-number]/page.tsx
```
Result: no matches (removed).

```
grep -n "VariantCollectionSection" src/app/cards/[set-code]/[card-number]/page.tsx
```
Result: lines 6 and 62 — import and JSX render present.

```
grep -n "getSameSetPrintingsWithCounts" src/app/cards/[set-code]/[card-number]/page.tsx
```
Result: lines 5 and 31 — import and call present.

```
grep -n "font-semibold" src/components/catalog/variant-collection-section.tsx
```
Result: no matches (UI-SPEC weight constraint met).

```
npx vitest run src/lib/filter-cards.test.ts
```
Result: 15 passed (15) — no regressions introduced.

## Deviations from Plan

None — plan executed exactly as written.

## Pre-existing Test Failures (not introduced by this plan)

7 test files were already failing at the base commit (documented in Plan 04 SUMMARY):
- tests/auth-config.test.ts
- __tests__/api-deck-validation.test.ts
- src/app/decks/page.test.tsx
- src/lib/sync/prices.test.ts
- tests/data-isolation.test.ts (1 test)
- __tests__/cron-route.test.ts (4 tests)
- src/lib/collection/normalize.test.ts (2 tests — wave 2 RED tests from Plan 03)

These are out-of-scope for this plan.

## Known Stubs

None. VariantCollectionSection renders all printings from getSameSetPrintingsWithCounts with live count state. Total line recalculates from client state. No placeholders or empty mock data.

## Threat Surface Scan

No new network endpoints introduced. VariantCollectionSection fires fetch to existing POST /api/collection/variants (created in Plan 03). The plan's threat model was fully implemented:

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-17-05-01 | router.push('/login') when session missing; RSC hides section when userId null | Implemented |
| T-17-05-02 | Math.max(0, newCount) floor before optimistic update and fetch | Implemented |
| T-17-05-03 | Server validates cardPrintingId (Plan 03) | Accept — no client-side change needed |
| T-17-05-04 | userId from auth.api.getSession({ headers: await headers() }) — not from URL | Implemented |

## Self-Check: PASSED

Files exist:
- FOUND: src/components/catalog/variant-collection-section.tsx
- FOUND: src/app/cards/[set-code]/[card-number]/page.tsx (contains VariantCollectionSection, getSameSetPrintingsWithCounts, no CollectionControls)

Commits exist:
- 6ba781e: feat(17-05): create VariantCollectionSection client component
- 867680d: feat(17-05): update card detail page to use VariantCollectionSection

TypeScript: clean (npx tsc --noEmit exits 0).
Filter-cards tests: 15/15 GREEN (no regressions).
