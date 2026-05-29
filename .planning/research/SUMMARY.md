# Research Summary — v6 Mobile, Performance & Polish (Star Wars Unlimited Tracker)

**Project:** Star Wars Unlimited Tracker
**Domain:** Mobile-responsive TCG deck builder — retrofit of existing Next.js 16 app
**Researched:** 2026-05-29
**Confidence:** HIGH

---

## Executive Summary

v6 is a retrofit milestone, not a greenfield build. The deck builder already works on desktop; the goal is to make it usable on mobile, improve /decks route performance, and clear five deferred tech debt items. Critically, this milestone adds zero new npm packages. Every technique needed — responsive layout, bottom sheet, INP optimisation, caching, image optimisation — is achievable with what is already installed: Tailwind CSS, the existing `Sheet` component (backed by `@base-ui/react`), React 19 `startTransition`/`useDeferredValue`, and Next.js 16 `use cache` + `revalidateTag`.

The highest-risk change is the mobile sidebar restructure. `DeckBuilder` uses `flex h-[calc(100svh-56px)] overflow-hidden` which creates a WebKit clipping context. Any Sheet used for the mobile stats panel must render through its existing portal (`document.body`) — it cannot live as a plain child inside the clipping container. The correct approach is `hidden md:flex` on the inline desktop sidebar, plus a `Sheet` trigger button (visible only on mobile) in the toolbar. `DeckSidebar` itself needs no changes; it renders identically in both contexts.

The performance story for /decks routes is largely already told: `getAllCards()` and `getFilterOptions()` (the expensive queries) are already cached via `use cache` from v5. The v6 opportunity is adding per-user-scoped `cacheTag` to `getDecks` and `getDeckWithCards`, wiring `revalidateTag` into the PATCH/DELETE/POST handlers, and switching the mobile layout height from `svh` to `dvh` so the deck name input does not disappear under the soft keyboard. The two-layer cache (Next.js Data Cache + Router Cache) means `router.refresh()` alone is not sufficient after mutations — both layers must be addressed, and the existing client-side `useEffect` collection re-fetch on `/cards` is already the correct mechanism for DEBT-04.

---

## Stack Additions

v6 adds **zero new npm packages**.

| Technique | What It Uses | Already Installed? |
|-----------|-------------|-------------------|
| Mobile sidebar hide/show | Tailwind `hidden md:flex` | Yes |
| Mobile stats panel | `Sheet`/`SheetContent` from `src/components/ui/sheet.tsx` | Yes — backed by `@base-ui/react/dialog` |
| Snap-point bottom drawer | Vaul (shadcn `Drawer`) | Yes — available via shadcn stack |
| INP reduction | `useTransition`, `useDeferredValue` — React 19.2.4 | Yes |
| Caching deck routes | `use cache`, `cacheTag`, `cacheLife`, `revalidateTag` — Next.js 16 | Yes — `cacheComponents: true` already on |
| INP measurement | `useReportWebVitals` from `next/web-vitals` | Yes — built into Next.js 16 |
| Image optimisation restore | Remove `unoptimized: true` from `next.config.ts` | Config change only, on 2026-06-04 |

**Do NOT add:** `use cache: remote` (requires paid Vercel Runtime Cache, not available on Hobby), any gesture library (Vaul handles drag/snap), any responsive layout library (Tailwind breakpoints suffice), or `@tanstack/react-query` (already decided against).

---

## Feature Table Stakes

Features that must ship for the deck builder to be usable on mobile. Missing = product feels broken on a phone.

| Feature | Requirement | Notes |
|---------|-------------|-------|
| Stats sidebar hidden on mobile, accessible via Sheet | MOBILE-01 | `hidden md:flex` on desktop sidebar; Sheet trigger in toolbar |
| Save / Complete Deck actions reachable on mobile | MOBILE-01 | Buttons live inside `DeckSidebar`, which renders in the Sheet |
| Touch targets on card row +/- buttons at least 44x44px | MOBILE-01 | Currently `h-8 w-8` (32px) — below Apple HIG minimum |
| Tab bar usable on small screens without overflow | MOBILE-02 | Three tabs + deck name + Export + Back clips below ~480px |
| Stats summary visible without navigating away | MOBILE-01 | Card count (X/50) and legal/illegal badge must always be visible |
| `dvh` instead of `svh` on mobile layout height | PERF-08 | Keyboard-safe; prevents content disappearing under soft keyboard |

### Differentiators (should have, not blocking)

| Feature | Value |
|---------|-------|
| Bottom tab bar on mobile (tabs move from toolbar to foot) | Thumb-zone access; mirrors native app convention |
| Snap-point Vaul drawer (peek 80px / full) for stats | Google Maps pattern — glance at cost curve without losing card list |
| `onTouchStart` replaced with `onClick` on deck list rows | Prevents bottom preview bar flash during scroll |

### Anti-features (explicitly out of scope)

- Drag-and-drop card reordering on mobile — conflicts with scroll; wider +/- targets suffice
- Separate mobile deck builder route — responsive layout of the same component is correct
- Stacked/nested bottom sheets — violates NNGroup back-navigation guidelines

---

## Architecture Integration

### Mobile Sidebar (MOBILE-01, MOBILE-02)

**Modified:** `deck-builder.tsx` only. `DeckSidebar` is untouched.

Desktop path (md+): wrap existing `<DeckSidebar>` with `<div className="hidden md:flex">` — zero desktop regression.

Mobile path (< md): add a `Sheet` trigger button (`md:hidden`) inside the toolbar. `SheetContent` renders `<DeckSidebar>` through the existing portal to `document.body`, entirely outside the `overflow-hidden` clipping context.

Height fix: `h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)] overflow-hidden` on the deck builder root.

**CatalogClient unmount fix (Pitfall 6):** Change JSX conditional rendering of `CatalogClient` to CSS-hidden: render it always with `className={view !== 'catalog' ? 'hidden' : ''}`. This keeps all nuqs `useQueryState` hooks mounted and prevents URL re-read on every tab switch.

### use-cache for /decks Routes (PERF-07)

Two independent layers that must both be wired:

**Layer 1 — Data Cache:**
- `getDeckWithCards` in `src/db/queries/decks.ts`: add `use cache` + `cacheTag('deck-{deckId}-user-{userId}')` + `cacheLife('seconds')`
- `getDecks` in `src/db/queries/decks.ts`: add `use cache` + `cacheTag('decks-user-{userId}')` + `cacheLife('seconds')`

**Layer 2 — Invalidation:**

| Mutation | File | Tag to Invalidate |
|----------|------|------------------|
| PATCH /api/decks/[id] | `app/api/decks/[id]/route.ts` | `deck-{deckId}-user-{userId}` |
| DELETE /api/decks/[id] | `app/api/decks/[id]/route.ts` | `decks-user-{userId}` |
| POST /api/decks | `app/api/decks/route.ts` | `decks-user-{userId}` |

Do not apply `use cache` at page level or with `cacheLife('days')` for user-scoped data. `getAllCards()` and `getFilterOptions()` are already cached — do not re-cache them.

### Tech Debt Integration Points

| Item | File(s) Touched | Notes |
|------|----------------|-------|
| DEBT-01: Remove CollectionControls dead code | `src/components/collection/` | 0 imports; safe delete |
| DEBT-02: Variant art in Add Cards tab | `deck-builder.tsx`, `CatalogClient` | Land after mobile sidebar change to avoid merge conflicts |
| DEBT-03: Prestige Foil + Serialized enum gaps | `src/lib/variants.ts` | Two-line enum addition; co-land with DEBT-02 |
| DEBT-04: Catalog collection state invalidation | `src/app/api/collection/variants/route.ts` | Verify no `use cache` on collection fetch path |
| DEBT-05: LAW spotlight deck unknowns | Seed/fixture data | Remove 9 commented TODOs; no DB migration |
| Cron handler fix | `src/app/api/cron/sync-cards/route.ts` | `revalidateTag('cards', 'max')` second arg silently ignored — remove it |

---

## Watch Out For (Pitfalls)

### Critical

1. **Per-user cache leak** — Never apply `use cache` to `getDecks()` or `getDeckWithCards()` without `userId` as an explicit function argument captured in the cache key. Silent cross-user data exposure, no runtime error. Test: two browser sessions with different accounts — deck names must not bleed across users.

2. **Two-layer cache invalidation** — `router.refresh()` flushes the client Router Cache but does NOT bust the server Data Cache. `revalidateTag()` busts the Data Cache but does NOT flush the Router Cache. Both must fire after mutations. The existing `router.refresh()` on collection mutations is correct only because `getUserCollection` has no `use cache` wrapper — preserve that invariant.

3. **`svh` not keyboard-safe on mobile** — The deck builder root must change to `h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)]`. `svh` is fixed and does not shrink when the soft keyboard appears — the deck name input vanishes underneath it. Deck name input must also have `font-size >= 16px` to prevent iOS Safari auto-zoom.

4. **WebKit `overflow:hidden` clips `position:fixed`** — The mobile stats Sheet must portal to `document.body`. If placed as a plain child inside the `overflow-hidden` deck builder container, WebKit clips it invisibly on iOS Safari. Verify `SheetPortal` renders to `document.body`, not a nested override.

### Moderate

5. **INP regression from Sheet open** — Opening the Sheet synchronously triggers `DeckSidebar` `useMemo` chains (validation, cost curve, aspect breakdown) plus `body { overflow: hidden }` (full document style recalc). Combined can exceed 50ms before first paint. Fix: wrap the open state update in `startTransition`. Keep `DeckSidebar` `useMemo` computations in the parent `DeckBuilder` regardless of Sheet open state.

6. **nuqs hooks re-run on CatalogClient remount** — Every tab switch unmounts/remounts `CatalogClient`, firing all 10+ nuqs hooks and resetting `searchInput`. Fix: CSS-hidden instead of JSX-conditional (see Architecture section above).

### Minor

7. **`onTouchStart` reveals bottom bar during scroll** — Replace with `onClick` on deck list rows. `onTouchStart` fires at the start of any touch including scroll, revealing the 96px bottom preview bar unintentionally.

8. **`window.confirm` vs back-swipe gesture** — The `isDirty` popstate guard blocks mid-swipe with a synchronous dialog on iOS/Android. Document as known limitation for v6; full fix (in-page Sheet) is deferred.

---

## Recommended Build Order

**Phase 26 — Mobile Deck Builder UX (MOBILE-01, MOBILE-02)**

First, highest user impact, pure UI with no data layer dependencies.

- Change layout height to `dvh` on mobile / `svh` on desktop
- `hidden md:flex` wrapper around desktop `DeckSidebar`
- `Sheet` trigger button (`md:hidden`) in toolbar; `DeckSidebar` in `SheetContent`
- Widen card row touch targets to 44px minimum
- `CatalogClient` CSS-hidden instead of JSX-conditional
- `onTouchStart` to `onClick` on deck list rows

Research flag: standard patterns, no additional research needed.

**Phase 27 — /decks Performance + Cache Wiring (PERF-07, PERF-08)**

After mobile. Save-flow test in Phase 26 will surface missing `revalidateTag` calls.

- `use cache` + per-user `cacheTag` on `getDecks` and `getDeckWithCards`
- `revalidateTag` in PATCH / DELETE / POST deck handlers
- `startTransition` on `handleDeckUpdate` dispatcher
- `useDeferredValue` on `deckCounts` prop to `CatalogClient`
- Fix `isDirty` JSON.stringify off the render path
- Fix cron handler: remove silently-ignored second arg from `revalidateTag`
- Remove `unoptimized: true` from `next.config.ts` on 2026-06-04

Research flag: standard Next.js 16 cache patterns, well documented in local docs. No additional research needed. Do not change to `use cache: remote` without verifying Vercel Hobby quota.

**Phase 28 — Tech Debt Sweep (DEBT-01 through DEBT-05)**

Independent of Phase 26/27 except DEBT-02: land after Phase 26 is merged to avoid conflicts on `deck-builder.tsx`.

- DEBT-01: Delete `CollectionControls` (0 imports, dead code)
- DEBT-03: Add `Prestige Foil` to `VARIANT_OPTIONS`, `Serialized` to `VARIANT_PRECEDENCE`
- DEBT-02: Wire `getPrintingArtMap()` into Add Cards tab (after Phase 26 merge)
- DEBT-04: Verify collection fetch path has no `use cache`; confirm `router.refresh()` + client re-fetch chain
- DEBT-05: Resolve 9 LAW spotlight deck unknowns, clear commented TODOs

Research flag: all items have identified files and minimal scope — no additional research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against live source + Next.js 16 local docs + Vercel pricing docs |
| Features | HIGH | Patterns verified against existing `mobile-filter-sheet.tsx` and `sidebar-filters.tsx` |
| Architecture | HIGH | All integration points verified against live source files |
| Pitfalls | HIGH (critical) / MEDIUM (minor) | Critical from official docs + code inspection; minor from community sources cross-referenced with MDN |

**Overall confidence:** HIGH

### Gaps to Address

- **INP baseline unknown:** Production INP data for `/decks/[id]` has not been reviewed yet. Use `useReportWebVitals` with `metric.attribution.interactionTarget` in Phase 27 to confirm hotspots before optimising.
- **Image optimisation quota date:** `unoptimized: true` remains until 2026-06-04. Plan Phase 27 to include the config restore on quota renewal.
- **`window.confirm` back-swipe regression:** Known mobile UX limitation. Track as a Phase 29+ item (in-page confirmation Sheet).

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` — cache key generation, serverless behaviour
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheTag.md` — tag namespacing, invalidation
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheLife.md` — lifetime configuration
- `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` — `next/dynamic` patterns
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-report-web-vitals.md` — INP attribution
- Vercel Runtime Cache docs: https://vercel.com/docs/caching/runtime-cache (fetched 2026-05-29)
- Vercel Pricing: https://vercel.com/docs/pricing (fetched 2026-05-29)
- Live source: `deck-builder.tsx`, `deck-sidebar.tsx`, `sheet.tsx`, `catalog.ts`, `decks.ts`, `next.config.ts`, `sync-cards/route.ts`

### Secondary (MEDIUM confidence)
- NN/Group Bottom Sheets guidelines — stacked sheet anti-pattern, non-modal recommendation
- Framer production INP data (via kurtextrem.de) — modal open as INP regression source, `startTransition` mitigation
- Francisco Moretti / MDN — `dvh` vs `svh` for keyboard-safe mobile layouts
- tailwindlabs/tailwindcss #4515 — community confirmation of `svh` keyboard issue on iOS Safari

---

*Research completed: 2026-05-29*
*Ready for roadmap: yes*
