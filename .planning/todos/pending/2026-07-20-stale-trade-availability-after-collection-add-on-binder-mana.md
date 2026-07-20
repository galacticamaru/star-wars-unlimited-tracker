---
created: 2026-07-20T14:14:12.990Z
title: Fix stale trade availability after collection add on /binder/manage
area: ui
files:
  - src/components/catalog/variant-collection-section.tsx:30-63
  - src/components/binder/variant-trade-sheet.tsx:16-64
  - src/app/binder/manage/page.tsx:100-155
---

## Problem

On `/binder/manage`, adding a card to your collection via the variant sheet's
"Your Collection" +/- control does **not** make the card available for trade until
a full page reload. Reported during Phase 32 UAT; separate from Phase 32 scope.

Root cause (investigated 2026-07-20):
- `VariantCollectionSection` (`src/components/catalog/variant-collection-section.tsx:30-63`)
  POSTs to `/api/collection/variants`, updates only its **own** local `counts` state,
  and calls `router.refresh()` on success.
- But `/binder/manage` is a **fully client-fetched** page: it loads `ownedCards` via
  `fetch('/api/collection/owned-cards')` **exactly once** (guarded by
  `hasFetchedCatalogRef`, `page.tsx:131`) and keeps it in React state. `router.refresh()`
  only re-renders server/RSC components — it does not re-run this client fetch, and the
  once-only guard blocks a refetch anyway.
- `VariantTradeSheet` (`variant-trade-sheet.tsx:51`) renders `VariantCollectionSection`
  with only `printings={printings}` — **no callback** to notify the parent page of the
  new owned count. So the page's `ownedCards` (and derived `mergedCards`) still shows
  `ownedCount: 0`. A card must be owned to be offered for trade, so it stays untradeable
  until a hard reload re-mounts the page and re-runs the once-only fetch.

Not a server/cache issue: `getOwnedCardDefinitions` is uncached (no `'use cache'`/
`cacheTag`), so the server always returns fresh data — consistent with "a refresh fixes it."

## Solution

Add an `onOwnedCountChange(cardPrintingId, newCount)` callback threaded
`VariantCollectionSection` → `VariantTradeSheet` → `ManageBinderPage`, and have the page
optimistically update its `ownedCards` state (mirroring the existing
`updateTradeQuantity` / `updateWantQuantity` optimistic patterns in `page.tsx`). Because
the sheet re-derives its printings from live `mergedCards` each render, the trade section
then reflects new ownership immediately — no reload. `router.refresh()` can remain for the
catalog/RSC pages that rely on it.
