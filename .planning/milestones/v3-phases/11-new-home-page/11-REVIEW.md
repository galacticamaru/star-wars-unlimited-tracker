---
phase: 11-new-home-page
reviewed: 2026-05-12T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/app/page.tsx
  - src/app/cards/page.tsx
  - src/app/cards/[set-code]/[card-number]/page.tsx
  - src/components/home/hero-section.tsx
  - src/components/home/high-value-grid.tsx
  - src/components/home/hero-section.test.tsx
  - src/components/home/high-value-grid.test.tsx
  - src/components/nav-bar.tsx
  - src/db/queries/catalog.ts
  - src/db/queries/catalog.test.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-05-12T00:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This phase introduces a new home page with a hero section and a "Highest Value Cards" grid, adds `getTopCardsByPrice` to the catalog query module, and makes minor changes to the nav bar and card detail page. The hero section and its tests are clean. The catalog query module contains one correctness bug that causes wrong data in the featured grid. Several UI display bugs degrade the user experience. The nav bar has a security-adjacent quality issue with user-supplied image URLs.

---

## Critical Issues

### CR-01: `getTopCardsByPrice` returns duplicate entries for reprinted cards

**File:** `src/db/queries/catalog.ts:81-105`

**Issue:** The query joins `cardDefinitions` to `cardPrintings` without any deduplication guard. A card definition that has a "Normal" printing in more than one set (i.e., a reprint) has multiple matching rows in `cardPrintings`, one per set. Because there is no `DISTINCT ON`, `GROUP BY`, or subquery limiting the join to a single printing per definition, the query returns one row per matching printing — causing the same logical card to appear multiple times in the top-10 grid. This is not a hypothetical: the SWU card database includes reprints across sets. The grid could show the same card twice while excluding other high-value cards that should be ranked in their place, and the tile URLs would differ only by set-code.

**Fix:** Limit the join to one printing per card definition. The cleanest approach in Drizzle/Postgres is a lateral or a subquery that picks the canonical printing (e.g., lowest setCode alphabetically, or whichever setCode matches the definition's `swudbId` prefix):

```ts
// Option A — use a subquery to pick one printing per cardDefinitionId
const canonicalPrinting = db
  .selectDistinctOn([cardPrintings.cardDefinitionId], {
    cardDefinitionId: cardPrintings.cardDefinitionId,
    setCode: cardPrintings.setCode,
    collectorNumber: cardPrintings.collectorNumber,
    frontArtUrl: cardPrintings.frontArtUrl,
    backArtUrl: cardPrintings.backArtUrl,
  })
  .from(cardPrintings)
  .where(eq(cardPrintings.variantType, 'Normal'))
  .orderBy(asc(cardPrintings.cardDefinitionId), asc(cardPrintings.setCode))
  .as('canonical_printing');

return db
  .select({ ... })
  .from(cardDefinitions)
  .innerJoin(canonicalPrinting, eq(cardDefinitions.id, canonicalPrinting.cardDefinitionId))
  .where(and(isNotNull(cardDefinitions.priceUsd), notIlike(cardDefinitions.type, '%token%')))
  .orderBy(desc(cardDefinitions.priceUsd))
  .limit(limit);
```

---

## Warnings

### WR-01: Falsy price check hides `$0.00` — should use `!== null`

**File:** `src/components/home/high-value-grid.tsx:73`
Also: `src/app/cards/[set-code]/[card-number]/page.tsx:131,134`

**Issue:** `priceUsd ? ... : '—'` treats `priceUsd === 0` as "no price" and renders an em-dash. A card with a legitimate market price of $0.00 (cents value of 0) would silently display `—` instead of `$0.00`. The same falsy check is repeated for `priceEur` and `priceUsd` on the card detail page. The schema defines these columns as `integer` (nullable), so `0` is a valid stored value.

**Fix:** Use an explicit null check:

```tsx
// high-value-grid.tsx line 73
{priceUsd !== null ? `$${(priceUsd / 100).toFixed(2)}` : '—'}

// card detail page lines 131, 134
{card.priceEur !== null ? `€${(card.priceEur / 100).toFixed(2)}` : '—'}
{card.priceUsd !== null ? `$${(card.priceUsd / 100).toFixed(2)}` : '—'}
```

---

### WR-02: Both price badges on card detail have the identical label "Market (NM):"

**File:** `src/app/cards/[set-code]/[card-number]/page.tsx:130-135`

**Issue:** Both the EUR and USD price badges render the label `Market (NM):`. A user who knows the currencies can infer which is which from the `€`/`$` symbol, but only when a price is present. When one price is missing the badge reads `Market (NM): —` for both, and there is no way to distinguish them. This is a functional labeling bug.

**Fix:** Use distinct labels:

```tsx
<Badge ...>
  Market EUR (NM): {card.priceEur !== null ? `€${(card.priceEur / 100).toFixed(2)}` : '—'}
</Badge>
<Badge ...>
  Market USD (NM): {card.priceUsd !== null ? `$${(card.priceUsd / 100).toFixed(2)}` : '—'}
</Badge>
```

---

### WR-03: `getCardByPrinting` `userId` parameter is accepted but never passed by its only caller — `collectionCount` is always 0

**File:** `src/db/queries/card-detail.ts:5` / `src/app/cards/[set-code]/[card-number]/page.tsx:27`

**Issue:** `getCardByPrinting(setCode, cardNumber)` is called on line 27 of the card detail page without a `userId`, even though `userId` is available on line 24. The query's LEFT JOIN on `userCollections` includes `userId ? eq(...) : sql\`FALSE\`` — so without a userId the join always produces no rows and `collectionCount` is always `COALESCE(null, 0) = 0`. The page separately calls `getUserCollection(userId)` and performs a `.find()` client-side to compute `ownedCount`, so the displayed count is correct. However, the `collectionCount` column in `getCardByPrinting`'s result is wasted: it is never read anywhere in the page, and the LEFT JOIN adds unnecessary query complexity on every request for an authenticated user.

**Fix:** Either (a) pass `userId` to `getCardByPrinting` and drop the separate `getUserCollection` call, or (b) remove the `userId` parameter and `collectionCount` column from `getCardByPrinting` entirely, since the page already handles collection lookup independently.

---

### WR-04: User avatar rendered with raw `<img>` tag — unvalidated OAuth image URL

**File:** `src/components/nav-bar.tsx:77`

**Issue:** The user avatar is rendered as a raw `<img src={session.user.image}>` where `session.user.image` is a URL supplied by the OAuth provider and stored verbatim by better-auth. This bypasses Next.js image optimization (`next/image`) and, more importantly, renders an arbitrary external URL with no domain allowlist. A malicious or compromised OAuth provider could supply a tracking pixel URL, a URL to a slow/broken resource causing layout shifts, or (in some Content-Security-Policy configurations) a URL that violates the app's image-src directive. The missing `width`/`height` attributes also cause layout shift (CLS).

**Fix:** Use `next/image` with an `unoptimized` fallback or configure `remotePatterns` in `next.config` for known OAuth providers (e.g., `googleusercontent.com`, `avatars.githubusercontent.com`), then replace the `<img>` with `<Image>`:

```tsx
// next.config.ts — add remotePatterns for each OAuth provider used
images: {
  remotePatterns: [
    { hostname: 'lh3.googleusercontent.com' },
    { hostname: 'avatars.githubusercontent.com' },
  ],
},

// nav-bar.tsx line 77
<Image
  src={session.user.image}
  alt={session.user.name ?? 'User avatar'}
  width={32}
  height={32}
  className="h-full w-full rounded-full"
/>
```

---

## Info

### IN-01: All catalog query tests are `.todo` stubs — zero assertions execute

**File:** `src/db/queries/catalog.test.ts:1-27`

**Issue:** Every test case in `catalog.test.ts` is `it.todo(...)`. The file comment states "These tests require a live DB connection; mark as todo for CI." This means `getTopCardsByPrice`, `getAllCards`, and `getFilterOptions` have no automated test coverage at all. The CR-01 duplicate-printing bug described above would have been caught by the `it.todo('returns at most \`limit\` cards')` test had it been implemented. The stubs should be promoted to real tests using a test database or mocked Drizzle client.

---

### IN-02: `collectorNumber` URL parsing assumes dash is the set/number separator — fragile

**File:** `src/components/home/high-value-grid.tsx:31-32`

**Issue:** The card tile parses the collector number with `collectorNumber.indexOf('-')`, then slices after the first dash to derive the card number for the URL (`SOR-059` → `059`). This works for all current SWU sets. However, if a future set code contains a dash (e.g., a hypothetical `SWU-A`), the parse would produce the wrong segment. The logic is also duplicated — the same reconstruction happens in `card-detail.ts` line 7 in reverse (`${setCode}-${cardNumber}`). A centralized utility function would prevent drift.

**Fix:** Extract the parsing into a shared utility (e.g., `src/lib/card-utils.ts`) or derive `cardNumber` by stripping the known `setCode` prefix rather than relying on the first dash:

```ts
// More robust: strip known setCode prefix
const cardNumber = collectorNumber.startsWith(`${setCode}-`)
  ? collectorNumber.slice(setCode.length + 1)
  : collectorNumber;
```

---

### IN-03: `isActive` in nav bar matches any path that starts with the href string

**File:** `src/components/nav-bar.tsx:26-27`

**Issue:** `pathname.startsWith(href)` for href `/cards` would also mark the link active on `/cards-anything`. With the current route structure this is harmless, but it is a known fragility. The conventional fix is to append a trailing slash or check for an exact prefix segment boundary:

```ts
const isActive = (href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
```

---

_Reviewed: 2026-05-12T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
