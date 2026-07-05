---
phase: 29-card-detail-page-performance
reviewed: 2026-06-03T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/app/api/collection/variants/route.ts
  - src/app/api/trade/route.ts
  - src/app/cards/[set-code]/[card-number]/loading.tsx
  - src/app/cards/[set-code]/[card-number]/page.tsx
  - src/components/catalog/card-image-section.tsx
  - src/components/catalog/variant-collection-section.tsx
  - src/components/catalog/variant-trade-section.tsx
  - src/db/queries/card-detail.ts
findings:
  critical: 2
  warning: 3
  info: 3
  total: 8
status: issues_found
---

# Phase 29: Code Review Report

**Reviewed:** 2026-06-03T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Eight files implementing the card detail page and its supporting API routes were reviewed. The implementation is generally well-structured: RSC-first data fetching, optimistic UI updates with rollback, auth taken from session (never from request body), and `use cache` / `revalidateTag` wired correctly.

Two blockers were found. First, the `/api/trade` route accepts `cardPrintingId` and `tradeQuantity` without validating their types — a non-numeric or infinite value is passed straight into the ORM and the `Math.max` floor, bypassing the stricter validation present in the sibling collection route. Second, both price badges on the card detail page carry the identical label "Market (NM)" — the EUR badge and USD badge are indistinguishable to users.

Three warnings were found. The `getSameSetPrintingsWithCounts` query function lacks a `cacheLife` directive, so Next.js must fall back to its default cache lifetime for that `use cache` scope, which differs from the explicit `'days'` profile applied consistently elsewhere in the codebase. The `loaded` state in `CardImageSection` is not reset correctly when the image `key` changes on toggle without a click (e.g., if `displayUrl` changes as a result of prop re-render rather than the button). The `onQuantityChange` callback prop in `VariantTradeSection` is fired only on success — it is never called on rollback — leaving parent state out of sync after a network error in the binder sheet context.

---

## Critical Issues

### CR-01: Trade route skips type validation on `cardPrintingId` and `tradeQuantity`

**File:** `src/app/api/trade/route.ts:20-29`

**Issue:** The PATCH handler checks only that `cardPrintingId` and `tradeQuantity` are not `undefined`, but never validates their types. If either value is a string, `NaN`, `Infinity`, or an object, they are passed directly to `upsertTradeOffering` and `Math.max(0, tradeQuantity)`. `Math.max(0, Infinity)` returns `Infinity` — which the DB driver will reject at the wire level, producing an unhandled 500 and leaking the error to `console.error`. `Math.max(0, NaN)` returns `NaN`, which Postgres will also reject. `Math.max(0, "5")` returns `5` via implicit coercion, so a string is silently accepted. A numeric string `cardPrintingId` such as `"1"` is accepted by Drizzle's `eq()` via coercion, defeating the numeric type guarantee. Compare with the collection route (`src/app/api/collection/variants/route.ts:24-29`) which has explicit `typeof` + `isNaN` / `Number.isFinite` guards.

**Fix:**
```typescript
// After the undefined check, add:
if (typeof cardPrintingId !== 'number' || !Number.isInteger(cardPrintingId) || cardPrintingId <= 0) {
  return new Response('cardPrintingId must be a positive integer', { status: 400 });
}
if (typeof tradeQuantity !== 'number' || !Number.isFinite(tradeQuantity)) {
  return new Response('tradeQuantity must be a finite number', { status: 400 });
}
```

---

### CR-02: Both price badges share the same label "Market (NM)"

**File:** `src/app/cards/[set-code]/[card-number]/page.tsx:132-138`

**Issue:** Lines 132-138 render two `<Badge>` elements that both read `"Market (NM):"` — one for EUR and one for USD. A user cannot tell which badge shows which currency without reading the value itself. Screen readers announce both badges identically. The EUR badge needs to be labelled "Market (NM) EUR:" or similar.

```tsx
<Badge ...>Market (NM): {card.priceEur ? `€${(card.priceEur / 100).toFixed(2)}` : '—'}</Badge>
<Badge ...>Market (NM): {card.priceUsd ? `$${(card.priceUsd / 100).toFixed(2)}` : '—'}</Badge>
//                ^^^^ both say "Market (NM)" — EUR badge is mislabelled
```

**Fix:**
```tsx
<Badge variant="secondary" className="px-2.5 py-1 h-auto text-[11px] font-bold">
  Market EUR (NM): {card.priceEur ? `€${(card.priceEur / 100).toFixed(2)}` : '—'}
</Badge>
<Badge variant="secondary" className="px-2.5 py-1 h-auto text-[11px] font-bold">
  Market USD (NM): {card.priceUsd ? `$${(card.priceUsd / 100).toFixed(2)}` : '—'}
</Badge>
```

---

## Warnings

### WR-01: `getSameSetPrintingsWithCounts` uses `use cache` without a `cacheLife` directive

**File:** `src/db/queries/card-detail.ts:81-83`

**Issue:** `getSameSetPrintingsWithCounts` declares `'use cache'` and sets `cacheTag(...)` but omits `cacheLife(...)`. Every other cached query in the project (`getCardDefinition`, `getCards`, `getCardsBySet`, `getDecks`, `getDeckWithCards`) explicitly sets `cacheLife('days')`. Without the directive Next.js applies its default lifetime, which is `'hours'` — not the intended `'days'`. The user-specific card-printings cache will therefore expire 24× more frequently than intended and generate unnecessary DB round-trips.

**Fix:**
```typescript
export async function getSameSetPrintingsWithCounts(
  cardDefinitionId: number,
  setCode: string,
  userId: number
) {
  'use cache'
  cacheTag(`card-printings-${cardDefinitionId}-user-${userId}`);
  cacheLife('days');   // <-- add this line; consistent with all other query caches
  return db.select({ ... })
```

---

### WR-02: `onQuantityChange` parent callback not invoked on rollback in `VariantTradeSection`

**File:** `src/components/catalog/variant-trade-section.tsx:52-63`

**Issue:** When `updateVariant` rolls back the optimistic state (lines 53 and 61), `onQuantityChange` is never called to inform the parent. The binder sheet (`src/components/binder/variant-trade-sheet.tsx:50`) passes `onTradeQuantityChange` for exactly this purpose. After a network failure the component's internal `counts` state is correctly restored, but the parent's copy of the trade quantity is now stale — it holds the value from the last successful call. On subsequent re-opens of the sheet, the parent's stale value is passed as the `printings[*].tradeQuantity` prop, overwriting the correctly restored client state.

**Fix:** Call the rollback variant of the callback (or a dedicated `onRollback` prop) so the parent can mirror the local rollback:
```typescript
} catch (err) {
  setCounts(c => ({ ...c, [cardPrintingId]: prev }));
  onQuantityChange?.(cardPrintingId, prev); // inform parent of rollback
  console.error('Failed to update trade quantity:', err);
}
```
Apply the same fix to the `!res.ok` branch (line 53).

---

### WR-03: `loaded` state not reset when `displayUrl` changes from outside the toggle button

**File:** `src/components/catalog/card-image-section.tsx:80-95`

**Issue:** The `loaded` state is reset to `false` only inside the button's `onClick` handler (line 95). The `Image` component's `key={displayUrl}` prop means React destroys and remounts the image element whenever `displayUrl` changes — but `loaded` is only explicitly cleared through the button click path. If the parent re-renders and changes `frontArtUrl` or `backArtUrl` (e.g., a navigation transition that reuses the same component instance without full unmount), `loaded` will remain `true` from the previous image while the new image is still loading. The new image will not show `animate-pulse` (because `loaded` is `true`) and will not transition from opacity-0 to opacity-100, leaving a flash of missing content.

In practice this is low-risk in the current routing model since each navigation creates a fresh component tree, but it is a latent bug for any future scenario where the component is reused with different props.

**Fix:** Add a `useEffect` keyed to `displayUrl` to reset `loaded`:
```typescript
useEffect(() => {
  setLoaded(false);
}, [displayUrl]);
```
This ensures `loaded` tracks the currently displayed URL regardless of how the change arrived.

---

## Info

### IN-01: Dead `userId ? ... : sql\`FALSE\`` branches in `getSameSetPrintingsWithCounts`

**File:** `src/db/queries/card-detail.ts:96, 103`

**Issue:** The function signature is `(cardDefinitionId: number, setCode: string, userId: number)` — `userId` is typed as `number`. The branches `userId ? eq(...) : sql\`FALSE\`` can only take the false path when `userId === 0`, which would mean an unauthenticated user ID of zero. The page at `src/app/cards/[set-code]/[card-number]/page.tsx:31-33` guards the call site: `getSameSetPrintingsWithCounts` is only called when `userId` is non-null. The `sql\`FALSE\`` defensive branches are therefore dead code and add unnecessary noise. If the intention is to support a zero/unauthenticated caller in future, the parameter type should be `number | null` and the callers updated accordingly.

**Fix:** Either remove the ternary guards and use `eq(...)` directly (since `userId` is always valid at this call site), or change the signature to `userId: number | null` to make the defensive branch type-correct and meaningful.

---

### IN-02: `parseInt(e.target.value, 10) || 0` silently drops the value `0` entered by typing

**File:** `src/components/catalog/variant-collection-section.tsx:101`, `src/components/catalog/variant-trade-section.tsx:99`

**Issue:** Both components use `parseInt(e.target.value, 10) || 0` as the input `onChange` handler value. `parseInt('0', 10)` returns `0`, which is falsy, so the expression correctly produces `0`. However, `parseInt('', 10)` returns `NaN`, which is also falsy and produces `0` — this is acceptable. The real issue is that clearing the field and then typing a new number works by passing intermediate empty/partial values (e.g. `''`, `'1'`), and the user never observes a `NaN` state because the `||` coerces it. This is acceptable but the pattern is fragile — if someone changes the `||` to `??` in the future the behavior breaks because `NaN ?? 0` evaluates to `NaN`. Using `isNaN(parsed) ? 0 : parsed` is more explicit.

**Fix:**
```typescript
onChange={(e) => {
  const parsed = parseInt(e.target.value, 10);
  updateVariant(printing.id, isNaN(parsed) ? 0 : parsed);
}}
```

---

### IN-03: `Image` component uses `priority` unconditionally for all card images

**File:** `src/components/catalog/card-image-section.tsx:85`

**Issue:** The `priority` prop is always set, regardless of whether this component is above the fold or embedded in a list. In the current card detail page it is appropriate (the card image is the LCP element). However, the component is also used via `variant-trade-sheet.tsx` where the image is inside a slide-over sheet that is initially hidden — marking a hidden image as LCP priority causes unnecessary preload of an invisible resource.

**Fix:** Accept an optional `priority` prop (defaulting to `true` for the card detail page) and thread it through, so sheet-embedded uses can pass `priority={false}`:
```typescript
interface CardImageSectionProps {
  name: string;
  type: string;
  frontArtUrl: string | null;
  backArtUrl: string | null;
  priority?: boolean;   // default true
}
```

---

_Reviewed: 2026-06-03T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
