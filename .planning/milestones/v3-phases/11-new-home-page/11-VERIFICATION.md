---
phase: 11-new-home-page
verified: 2026-05-12T12:00:00Z
status: passed
score: 13/13 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 11: New Home Page — Verification Report

**Phase Goal:** Route refactor (/cards), Hero section, and Highest Value card grid
**Verified:** 2026-05-12T12:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

All truths are drawn from the merged must-haves of plans 11-01, 11-02, and 11-03 plus the ROADMAP success criteria (REQ-HOME-01, REQ-HOME-02, REQ-HOME-03).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Navigating to /cards loads the existing catalog with full filter and search functionality | VERIFIED | `src/app/cards/page.tsx` exists, exports `CatalogPage`, imports `getAllCards`, `getFilterOptions`, and renders `CatalogClient` with full plainCards serialization |
| 2 | Clicking 'Back to catalog' from a card detail page goes to /cards, not / | VERIFIED | `src/app/cards/[set-code]/[card-number]/page.tsx` line 41: `href="/cards"` — grep confirms `href="/"` is absent from the back-link |
| 3 | getTopCardsByPrice(10) returns at most 10 cards ordered by priceUsd DESC with no nulls and no duplicates | VERIFIED | `src/db/queries/catalog.ts` lines 81–112: uses `isNotNull(cardDefinitions.priceUsd)`, `notIlike(...token...)`, `eq(cardPrintings.variantType, 'Normal')`, `DISTINCT ON [cardDefinitions.id]` for dedup, outer `orderBy(desc(deduped.priceUsd))`, `.limit(limit)` |
| 4 | HeroSection renders the exact locked title and subtitle text | VERIFIED | `src/components/home/hero-section.tsx` line 9: exact title string; line 12: exact subtitle string; both confirmed via grep |
| 5 | HeroSection renders three CTA links to /collection, /decks, and /binder/manage | VERIFIED | Lines 15, 18, 21 in hero-section.tsx: `href="/collection"`, `href="/decks"`, `href="/binder/manage"` — all present |
| 6 | HighValueGrid renders a 5-column × 2-row grid of CardPriceTile components | VERIFIED | `src/components/home/high-value-grid.tsx` line 89: `grid-cols-2 sm:grid-cols-3 md:grid-cols-5`; cards.map renders one `CardPriceTile` per card |
| 7 | CardPriceTile displays price as $X.XX (cents ÷ 100) and '—' when null | VERIFIED | Line 73: `{priceUsd !== null ? \`$\${(priceUsd / 100).toFixed(2)}\` : '—'}` — uses strict null check |
| 8 | CardPriceTile links to /cards/{setCode}/{cardNumber} using collector number parsing | VERIFIED | Lines 31–32: `collectorNumber.indexOf('-')` slice; line 44: `href={\`/cards/\${setCode}/\${cardNumber}\`}` |
| 9 | NavBar 'Catalog' href is /cards; brand 'SWU Tracker' links to / | VERIFIED | nav-bar.tsx line 17: `{ href: '/cards', label: 'Catalog' }`; line 37: `<Link href="/" className="font-heading...">SWU Tracker</Link>` with `hover:opacity-80 transition-opacity` |
| 10 | NavBar isActive function is unchanged (correct for post-migration routes) | VERIFIED | Line 27: `href === '/' ? pathname === '/' : pathname.startsWith(href)` — unchanged per plan requirement D-11 |
| 11 | Navigating to / shows the hero section and Highest Value Cards grid — not the catalog | VERIFIED | `src/app/page.tsx` exports `HomePage` (not `CatalogPage`); imports `HeroSection` and `HighValueGrid`; no `getAllCards`, no `auth` import |
| 12 | src/app/page.tsx calls getTopCardsByPrice(10) and passes plainCards to HighValueGrid | VERIFIED | Lines 8, 13–22, 27: `getTopCardsByPrice(10)` called, result serialized to plain objects, passed as `cards={plainCards}` to `HighValueGrid` |
| 13 | Wave 0 test stubs (catalog.test.ts, hero-section.test.tsx, high-value-grid.test.tsx) exist; component tests are implemented and passing | VERIFIED | catalog.test.ts has 5 `it.todo` in `getTopCardsByPrice()` describe block; hero-section.test.tsx has 5 real passing tests; high-value-grid.test.tsx has 4 real passing tests |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/cards/page.tsx` | CatalogPage server component at /cards route | VERIFIED | Exists; exports `CatalogPage`; `export const dynamic = 'force-dynamic'`; imports `getAllCards`, `getFilterOptions`, `CatalogClient` |
| `src/db/queries/catalog.ts` | getTopCardsByPrice query exported | VERIFIED | Function exists at line 81; all WHERE conditions present; DISTINCT ON dedup; DESC order; limit |
| `src/db/queries/catalog.test.ts` | getTopCardsByPrice test stubs | VERIFIED | `describe('getTopCardsByPrice()')` block with 5 `it.todo` stubs at lines 21–27 |
| `src/components/home/hero-section.test.tsx` | HeroSection test file | VERIFIED | @vitest-environment jsdom; 5 real passing test assertions (not todos) |
| `src/components/home/high-value-grid.test.tsx` | HighValueGrid and CardPriceTile test stubs | VERIFIED | @vitest-environment jsdom; 4 real passing test assertions |
| `src/components/home/hero-section.tsx` | HeroSection RSC component | VERIFIED | Exports `HeroSection`; no `'use client'`; locked title/subtitle; 3 CTA links via `buttonVariants` |
| `src/components/home/high-value-grid.tsx` | HighValueGrid client component + CardPriceTile | VERIFIED | `'use client'`; exports `HighValueGrid`; `CardPriceTile` inlined; image loading pattern; price formatting |
| `src/components/nav-bar.tsx` | Updated NavBar with corrected hrefs | VERIFIED | Catalog href `/cards`; brand link to `/`; `isActive` logic unchanged |
| `src/app/page.tsx` | New HomePage RSC at / route | VERIFIED | Exports `HomePage`; `force-dynamic`; imports all three dependencies; calls `getTopCardsByPrice(10)` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/cards/page.tsx` | `src/db/queries/catalog.ts` | `import { getAllCards, getFilterOptions }` | WIRED | Line 1 of cards/page.tsx confirmed |
| `src/app/cards/[set-code]/[card-number]/page.tsx` | `/cards` | Back to catalog href | WIRED | `href="/cards"` at line 41; `href="/"` absent |
| `src/components/home/hero-section.tsx` | `/collection`, `/decks`, `/binder/manage` | Link + buttonVariants | WIRED | All three hrefs confirmed at lines 15, 18, 21 |
| `src/components/home/high-value-grid.tsx` | `/cards/{setCode}/{cardNumber}` | Link href in CardPriceTile | WIRED | Template literal at line 44: `/cards/${setCode}/${cardNumber}` |
| `src/components/nav-bar.tsx` | `/` | Brand Link href | WIRED | Line 37: `<Link href="/">SWU Tracker</Link>` |
| `src/app/page.tsx` | `src/components/home/hero-section.tsx` | `import { HeroSection }` | WIRED | Line 2; rendered at line 26 |
| `src/app/page.tsx` | `src/components/home/high-value-grid.tsx` | `import { HighValueGrid }` | WIRED | Line 3; rendered at line 27 with `cards={plainCards}` |
| `src/app/page.tsx` | `src/db/queries/catalog.ts` | `import { getTopCardsByPrice }` | WIRED | Line 1; called at line 8 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/app/page.tsx` | `plainCards` | `getTopCardsByPrice(10)` in catalog.ts | Yes — Drizzle `selectDistinctOn` with inner join on live DB, WHERE filters, ORDER BY, LIMIT | FLOWING |
| `src/components/home/high-value-grid.tsx` | `cards` prop | Passed as `plainCards` from HomePage RSC | Yes — identity-projected from DB result; all fields primitives | FLOWING |
| `src/components/home/hero-section.tsx` | N/A (static RSC) | Hardcoded strings | N/A — static component by design (D-01, D-02) | N/A — correct by design |

### Behavioral Spot-Checks

Step 7b: Skipped for server-rendered Next.js pages (requires dev server). However, the human visual checkpoint (Plan 03, Task 2) was approved by the user on 2026-05-12, confirming all 5 checklist items: home page hero, grid with 10 tiles, navigation, back-link, and responsive grid. This counts as human-verified behavioral evidence.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REQ-HOME-01 | 11-01, 11-03 | Move catalog to /cards; update root route and navigation | SATISFIED | `src/app/cards/page.tsx` (catalog at /cards); `src/app/page.tsx` (new HomePage at /); `nav-bar.tsx` Catalog href `/cards`; back-link `href="/cards"` |
| REQ-HOME-02 | 11-02, 11-03 | Hero section with Title, Subtitle, and clear CTAs (Import, Build, Trade) | SATISFIED | `hero-section.tsx` — locked title and subtitle; CTAs `/collection`, `/decks`, `/binder/manage`; rendered in HomePage |
| REQ-HOME-03 | 11-02, 11-03 | "Highest Value Cards" 10-card grid (5x2) on home page | SATISFIED | `high-value-grid.tsx` responsive grid (`md:grid-cols-5`); `getTopCardsByPrice(10)` limited to 10 results; price formatting; card detail links; rendered in HomePage |

No orphaned requirements detected — all three phase-11 requirements are covered by the plans.

### Anti-Patterns Found

No blockers or warnings. Scan of modified files:

- `src/app/page.tsx` — no TODO/FIXME, no `return null`, no stub patterns. `force-dynamic` present.
- `src/components/home/hero-section.tsx` — no stub indicators. Uses `buttonVariants` (correct codebase pattern) instead of `Button asChild` (valid deviation documented in 11-02-SUMMARY.md).
- `src/components/home/high-value-grid.tsx` — no stub indicators. `priceUsd !== null` (strict null check, tighter than the plan's `priceUsd ?` which would also falsy-catch 0).
- `src/components/nav-bar.tsx` — no stub indicators.
- `src/db/queries/catalog.ts` — no stub indicators. Query uses subquery dedup pattern (`selectDistinctOn` + outer `select`), which is more correct than the plan's simpler `isNotNull + limit` sketch — produces genuinely distinct card definitions.

**Note on getTopCardsByPrice implementation:** The actual implementation uses a two-step `selectDistinctOn([cardDefinitions.id])` subquery to deduplicate cards before ordering by price. This is more robust than the plan's original single-query sketch (which could still yield duplicates for cards with multiple Normal printings). The WHERE clause is equivalent: `isNotNull(priceUsd)`, `notIlike(type, '%token%')`, `eq(variantType, 'Normal')`. The final ordering `desc(deduped.priceUsd)` and `.limit(limit)` satisfy the plan's contract. This is an implementation improvement, not a deviation.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No anti-patterns found |

### Human Verification Required

Human visual checkpoint (Plan 03 Task 2) was completed and approved by user on 2026-05-12. The following items were confirmed:

1. Home page hero visible at / with correct locked title, subtitle, and three CTAs
2. Highest Value Cards grid visible with 10 tiles, prices, and card detail links
3. SWU Tracker brand clickable; navigates to /
4. Catalog nav link not active on /; active on /cards
5. Back to catalog on card detail page returns to /cards
6. Responsive grid (2/3/5 columns at mobile/tablet/desktop)

All human-verification items are resolved. No open items remain.

### Gaps Summary

No gaps. All 13 must-have truths are VERIFIED, all 9 required artifacts exist and are substantive, all 8 key links are WIRED, data flows from the live DB through the RSC to the client component, and the human visual checkpoint was approved by the user.

---

_Verified: 2026-05-12T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
