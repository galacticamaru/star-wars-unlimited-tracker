---
phase: 29-card-detail-page-performance
verified: 2026-06-03T09:00:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Navigate to a card detail URL (e.g. /cards/SOR/059) without being logged in and confirm the two-column skeleton renders immediately before data loads"
    expected: "A pulsing two-column layout (image placeholder left, metadata column right) appears instantly on navigation; no blank page flicker"
    why_human: "Route-segment loading.tsx activation is a browser/navigation timing behaviour; grep confirms the file exists and has correct structure, but actual FCP improvement cannot be confirmed without a browser"
  - test: "Log in, go to a card detail page, update a variant owned count (+1), and then navigate back to the card detail page"
    expected: "The updated count is reflected in the variant collection section (cache invalidated); no stale counts shown"
    why_human: "Two-layer cache invalidation (revalidateTag + router.refresh) requires a live request cycle with an active DB to confirm; code-level wiring is verified but runtime behaviour must be observed"
  - test: "Using browser DevTools or a WebPageTest / Lighthouse run, check that the card hero image does NOT have transition-opacity or duration-300 applied on first paint"
    expected: "The LCP image is immediately fully opaque on initial page load; the opacity classes are only present after the leader-flip button is clicked"
    why_human: "The isTogglingRef guard is a runtime ref — its initial value (false) controls className application dynamically; static grep confirms the guard code but cannot simulate the React render path"
---

# Phase 29: Card Detail Page Performance Verification Report

**Phase Goal:** The `/cards/[set]/[id]` card detail page has measurably improved FCP, LCP, and INP — specific regressions identified via Vercel Speed Insights are resolved
**Verified:** 2026-06-03T09:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `getCardDefinition` returns card data with no userCollections join and no collectionCount field | VERIFIED | `card-detail.ts` line 10-67: function signature has no userId param; SELECT list contains no collectionCount; no `.leftJoin(userCollections` anywhere; `userCollections` absent from schema imports |
| 2 | `getCardDefinition` is cached on the 'cards' tag and survives across requests until the daily sync revalidates it | VERIFIED | Lines 11-13 of `card-detail.ts`: `'use cache'`, `cacheTag('cards')`, `cacheLife('days')` are the first three statements; cron route calls `revalidateTag('cards', 'max')` confirming invalidation path |
| 3 | `getSameSetPrintingsWithCounts` is cached per-user under tag `card-printings-{cardDefinitionId}-user-{userId}` | VERIFIED | Lines 76-82 of `card-detail.ts`: signature `userId: number` (required, not optional); body starts with `'use cache'` then `cacheTag(\`card-printings-${cardDefinitionId}-user-${userId}\`)`. No `cacheLife` present — explicit revalidateTag-only invalidation |
| 4 | The card detail page renders without the legacy hydration block and without upsertVariantCount | VERIFIED | `page.tsx`: imports only `getCardDefinition` and `getSameSetPrintingsWithCounts`; no `import { upsertVariantCount }`; no `card.collectionCount` reference; call site is `getCardDefinition(setCode, cardNumber)` with no third argument; grep confirms `getCardByPrinting` absent from all of src/ |
| 5 | Updating a variant owned count revalidates the per-user printings cache server-side and refreshes the router client-side | VERIFIED | `variants/route.ts` line 59: `revalidateTag(\`card-printings-${printing.cardDefinitionId}-user-${userId}\`, 'max')` — two-argument form; `variant-collection-section.tsx` line 56: `router.refresh()` in the `else` (success) branch only |
| 6 | Updating a trade quantity revalidates the per-user printings cache server-side and refreshes the router client-side | VERIFIED | `trade/route.ts` line 43: `revalidateTag(\`card-printings-${printing.cardDefinitionId}-user-${userId}\`, 'max')` — two-argument form; `variant-trade-section.tsx` line 57: `router.refresh()` in the `else` success branch after `onQuantityChange?.()` |
| 7 | Both mutation routes derive cardDefinitionId before calling revalidateTag | VERIFIED | `variants/route.ts` lines 40-48: DB lookup `SELECT cardDefinitionId FROM cardPrintings WHERE id = cardPrintingId LIMIT 1` with 404 guard; `trade/route.ts` lines 32-41: identical lookup pattern with 404 guard (`cardPrintingId not found`) |
| 8 | Navigating to a card detail URL shows a full two-column skeleton immediately, before DB queries resolve | VERIFIED (code) / UNCERTAIN (runtime) | `loading.tsx` exists at correct Next.js route segment path; contains `animate-pulse`, `max-w-5xl mx-auto px-4 py-12`, `w-full md:w-[320px] md:flex-shrink-0 aspect-[2/3] bg-slate-200 rounded-lg`; no `'use client'`; no VariantCollectionSection/VariantTradeSection. Runtime FCP impact requires human confirmation |
| 9 | The above-fold card image renders with the Next.js priority prop and no invalid preload prop or @ts-ignore | VERIFIED | `card-image-section.tsx` line 84: bare `priority` prop present on `<Image>`; grep confirms `preload` and `@ts-ignore` are absent; `sizes="(max-width: 768px) 100vw, 320px"` unchanged |
| 10 | Vercel Speed Insights data for the card detail route was reviewed and the recorded LCP regression (opacity-transition delay) has a corresponding targeted fix applied | VERIFIED | `29-04-SPEED-INSIGHTS.md`: `Decision: targeted-fixes-needed`; regression: LCP Poor on `img.object-cover.transition-opacity.duration-300`. Fix in `card-image-section.tsx`: `isTogglingRef` (useRef, initial value false) guards `transition-opacity duration-300` and `opacity-0` classes — applied only after first leader-flip toggle, not on initial paint. Commit `64f7ce3` confirms the change |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/queries/card-detail.ts` | Cached public getCardDefinition + per-user cached getSameSetPrintingsWithCounts | VERIFIED | Exists, substantive, wired from page.tsx; `getCardDefinition` exported and called; cache directives present |
| `src/app/cards/[set-code]/[card-number]/page.tsx` | RSC page calling getCardDefinition with legacy hydration removed | VERIFIED | Exists, substantive; calls `getCardDefinition(setCode, cardNumber)`; no legacy hydration block; no upsertVariantCount import |
| `src/app/api/collection/variants/route.ts` | revalidateTag on card-printings tag after variant upsert | VERIFIED | Contains `revalidateTag(\`card-printings-...\`, 'max')` after recomputeTotal |
| `src/app/api/trade/route.ts` | cardDefinitionId lookup + revalidateTag after trade upsert | VERIFIED | Contains DB lookup, 404 guard, and `revalidateTag(\`card-printings-...\`, 'max')` |
| `src/components/catalog/variant-collection-section.tsx` | router.refresh() on successful variant mutation | VERIFIED | `router.refresh()` in the `else` (res.ok) branch, not in rollback path |
| `src/components/catalog/variant-trade-section.tsx` | router.refresh() on successful trade mutation | VERIFIED | `router.refresh()` in the `else` success branch after `onQuantityChange?.()` |
| `src/app/cards/[set-code]/[card-number]/loading.tsx` | Route-segment loading skeleton for the card detail page | VERIFIED | Created; contains `animate-pulse`, correct dimensions, no 'use client', no below-fold components |
| `src/components/catalog/card-image-section.tsx` | Image with priority prop for above-fold LCP + LCP opacity-transition fix | VERIFIED | `priority` prop present; `@ts-ignore` and `preload` absent; `isTogglingRef` guards transition classes from initial paint |
| `.planning/phases/29-card-detail-page-performance/29-04-SPEED-INSIGHTS.md` | Recorded Speed Insights findings or insufficient-data determination | VERIFIED | Exists; `## Findings` section present; `Decision: targeted-fixes-needed`; LCP regression itemised |
| `.planning/phases/29-card-detail-page-performance/29-05-SUMMARY.md` | Record of targeted fixes applied | VERIFIED | Exists; references PERF-10; documents the isTogglingRef LCP fix; maps finding to fix |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/cards/[set-code]/[card-number]/page.tsx` | `getCardDefinition` | import + call | WIRED | Line 5 import, line 26 call `getCardDefinition(setCode, cardNumber)` |
| `src/db/queries/card-detail.ts` | `next/cache` | cacheTag/cacheLife import | WIRED | Line 5: `import { cacheTag, cacheLife } from 'next/cache'` |
| `src/app/api/trade/route.ts` | card-printings cache tag | revalidateTag with derived cardDefinitionId | WIRED | Line 43: `revalidateTag(\`card-printings-${printing.cardDefinitionId}-user-${userId}\`, 'max')` |
| `src/components/catalog/variant-collection-section.tsx` | Router Cache | router.refresh in fetch success branch | WIRED | Line 56: `router.refresh()` inside `else { }` branch after `!res.ok` guard |
| `src/app/cards/[set-code]/[card-number]/loading.tsx` | card detail route segment | Next.js loading.tsx file convention | WIRED | Default export `CardDetailLoading`; file at correct route segment path |
| `src/components/catalog/card-image-section.tsx` | Next.js Image priority | priority boolean prop | WIRED | Line 84: bare `priority` on `<Image>` element |
| `29-04-SPEED-INSIGHTS.md` | 29-05 targeted fix | findings drive targeted fixes | WIRED | Decision `targeted-fixes-needed`; fix in card-image-section.tsx maps to the recorded LCP regression |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `card-detail.ts / getCardDefinition` | `card` (SELECT result) | Drizzle query on `cardDefinitions` + `cardPrintings` tables | Yes — `db.select().from(cardPrintings).innerJoin(...)` | FLOWING |
| `card-detail.ts / getSameSetPrintingsWithCounts` | printings array | Drizzle query on `cardPrintings` with leftJoin to `userPrintingCollections` and `userTradeOfferings` | Yes — full SELECT with COALESCE aggregates | FLOWING |
| `page.tsx` | `card`, `printings` | getCardDefinition + getSameSetPrintingsWithCounts above | Yes — RSC awaits real cached queries | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED for DB-dependent queries (no DATABASE_URL in dev environment prevents live query execution). Code-level wiring is fully verified through static analysis. Runtime behaviour deferred to human verification items.

### Probe Execution

No probe scripts declared in PLAN files and no conventional `scripts/*/tests/probe-*.sh` found for this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PERF-10 | 29-01, 29-02, 29-03, 29-04, 29-05 | `/cards/[set]/[id]` card detail page has measurably improved FCP, LCP, and INP — specific regressions identified via Speed Insights are resolved | SATISFIED | SC1: Speed Insights reviewed (29-04-SPEED-INSIGHTS.md); SC2: LCP regression (opacity transition) has targeted fix (isTogglingRef in card-image-section.tsx, commit 64f7ce3); SC3: build confirmed successful, trade offer/collection/variant tracking sections untouched structurally |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No TBD/FIXME/XXX markers found in any modified file; no empty return stubs; no hardcoded empty data in rendering paths |

### Human Verification Required

All 10 must-have truths verified at code level. Three items require human/browser confirmation to close out the full PERF-10 intent:

#### 1. Loading skeleton FCP improvement

**Test:** Navigate to a card detail URL (e.g. `/cards/SOR/059`) in a browser and observe the loading state before data resolves.
**Expected:** A pulsing two-column skeleton (image placeholder left, metadata column right) renders immediately on navigation with no blank-page flicker before DB queries complete.
**Why human:** `loading.tsx` file convention activation is a Next.js router behaviour that requires a live browser navigation to observe. Static analysis confirms the file exists at the correct path with correct structure; actual FCP improvement cannot be confirmed without a browser.

#### 2. Two-layer cache invalidation correctness

**Test:** Log in, navigate to a card detail page, update a variant owned count using the +/- buttons, then navigate away and back to the same card detail page.
**Expected:** The updated owned count is shown correctly (not a stale value from the previous cache entry). Repeat for trade quantity via the trade section.
**Why human:** `revalidateTag` + `router.refresh()` wiring is verified in code but the invalidation chain requires a live DB connection, an authenticated session, and an actual Next.js data cache to confirm the full round-trip behaviour.

#### 3. LCP opacity-transition guard on first paint

**Test:** In browser DevTools (Elements panel or Computed styles), inspect the card hero image's applied CSS classes on initial page load before any leader-flip button click.
**Expected:** The image is immediately fully opaque — `transition-opacity`, `duration-300`, and `opacity-0` classes are absent on first paint. After clicking the leader-flip toggle, those classes should appear on the subsequent image render.
**Why human:** `isTogglingRef.current` starts as `false`, gating the className logic dynamically at render time. Static analysis confirms the guard code is correct; the React render path and Tailwind class application can only be confirmed in a live browser.

### Gaps Summary

No blocking gaps found. All 10 must-have truths are verified in the codebase with complete artifact existence, substantive implementation, wiring, and data-flow evidence. The three human verification items above are quality/runtime confirmation items, not implementation gaps.

---

_Verified: 2026-06-03T09:00:00Z_
_Verifier: Claude (gsd-verifier)_
