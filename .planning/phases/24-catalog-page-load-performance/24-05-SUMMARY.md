---
phase: 24-catalog-page-load-performance
plan: 05
subsystem: build-verification
tags: [verification, build, route-handlers, cache-components-compat, suspense, force-dynamic-removal]

requires:
  - plan: 24-02
    provides: search debounce (PERF-01)
  - plan: 24-03
    provides: CardGrid virtualization (PERF-01 + PERF-03)
  - plan: 24-04
    provides: cacheComponents: true + use cache on catalog queries (PERF-02)

provides:
  - Production build passing with cacheComponents: true enabled
  - PERF-01, PERF-02, PERF-03 integration-verified at build time
  - /cards route now static (1d revalidate) — PERF-02 confirmed

affects:
  - All route pages (removed force-dynamic incompatible with cacheComponents)
  - Root layout (Suspense boundaries for NavBar and CurrencyProvider)

tech-stack:
  added: []
  patterns:
    - "Remove `export const dynamic = 'force-dynamic'` when cacheComponents: true is enabled (incompatible)"
    - "Wrap client components using usePathname/useState in Suspense in root layout to prevent blocking-route errors under cacheComponents"
    - "Use NODE_OPTIONS=--use-system-ca for local Windows builds connecting to Neon DB (CA cert trust issue)"

key-files:
  created: []
  modified:
    - src/app/api/cards/all/route.ts
    - src/app/binder/[username]/page.tsx
    - src/app/decks/page.tsx
    - src/app/page.tsx
    - src/app/layout.tsx

key-decisions:
  - "Removed force-dynamic from 4 files: cacheComponents: true makes export const dynamic = 'force-dynamic' a Turbopack compile error"
  - "Added Suspense around NavBar and CurrencyProvider in layout.tsx: client hooks (usePathname, useState) accessed outside Suspense cause blocking-route build errors under cacheComponents"
  - "Did NOT add connection() to binder page — it broke the binder-public-render.test.tsx; the Suspense layout fix alone resolved the build error"
  - "tsc --noEmit exits non-zero but only due to pre-existing test file type errors; production code is type-clean and Next.js build TypeScript check passed"

requirements-completed: [PERF-01, PERF-02, PERF-03]

duration: 65min
completed: 2026-05-26
---

# Phase 24 Plan 05: Final Verification Summary

**Production build verified with cacheComponents: true — removed force-dynamic incompatibilities, added Suspense boundaries in root layout, /cards confirmed static (1d revalidate)**

## Performance

- **Duration:** ~65 min (multiple build iterations to diagnose cacheComponents behavior)
- **Started:** 2026-05-26
- **Completed:** 2026-05-26
- **Tasks:** 1
- **Files modified:** 5

## Accomplishments

- `npm run build` passes with `cacheComponents: true` enabled
- `/cards` page is now `○ (Static)` with 1d/1w revalidate — PERF-02 confirmed at build time
- `/api/cards/all` route is now `○ (Static)` with 1d/1w revalidate — served from cache
- `/api/cron/sync-cards` is `ƒ (Dynamic)` — runs on demand, reads auth header at runtime
- All other auth-protected routes are `ƒ (Dynamic)` as expected
- 14 test failures — all pre-existing (documented in Plan 01 SUMMARY)

## Build Output (Final Passing Run)

```
▲ Next.js 16.2.4 (Turbopack)
- Cache Components enabled

  Creating an optimized production build ...
✓ Compiled successfully in 5.7s
  Running TypeScript ...
  Finished TypeScript in 7.7s ...
  Generating static pages using 15 workers (26/26) in 3.2s

Route (app)                          Revalidate  Expire
┌ ◐ /
├ ○ /_not-found
├ ƒ /api/auth/[...all]
├ ƒ /api/binder
├ ƒ /api/binder/exclusions
├ ƒ /api/binder/wants
├ ○ /api/cards/all                           1d      1w
├ ƒ /api/collection
├ ƒ /api/collection/import
├ ƒ /api/collection/owned-cards
├ ƒ /api/collection/sets
├ ƒ /api/collection/starter-deck
├ ƒ /api/collection/variants
├ ƒ /api/cron/sync-cards
├ ƒ /api/decks
├ ƒ /api/decks/[id]
├ ƒ /api/decks/[id]/export
├ ƒ /api/trade
├ ƒ /api/want-list
├ ◐ /binder/[username]
│ └ /binder/[username]
├ ○ /binder/manage
├ ○ /cards                                   1d      1w
├ ◐ /cards/[set-code]/[card-number]
│ └ /cards/[set-code]/[card-number]
├ ○ /collection
├ ◐ /decks
├ ◐ /decks/[id]
│ └ /decks/[id]
└ ○ /login

○  (Static)             prerendered as static content
◐  (Partial Prerender)  prerendered as static HTML with dynamic server-streamed content
ƒ  (Dynamic)            server-rendered on demand
```

### Route Segment Markers for Key Routes

| Route | Marker | Revalidate/Expire | Notes |
|-------|--------|--------------------|-------|
| `/cards` | ○ Static | 1d / 1w | PERF-02 confirmed — was dynamic, now cached |
| `/api/cards/all` | ○ Static | 1d / 1w | Served from 'use cache' — no DB hit per request |
| `/api/cron/sync-cards` | ƒ Dynamic | — | Reads auth header at runtime |
| `/binder/[username]` | ◐ Partial Prerender | — | Static shell + dynamic content |
| `/decks/[id]` | ◐ Partial Prerender | — | Auth-gated, dynamic user data |

## Test Suite Results

```
Tests  14 failed | 166 passed | 26 todo (206)
```

All 14 failures are pre-existing (documented in Plan 01 SUMMARY):
- `__tests__/api-deck-validation.test.ts`: 4 failures (Next.js `headers()` outside request scope)
- `__tests__/cron-route.test.ts`: 4 failures (DATABASE_URL not set in test env)
- `tests/binder-manage-render.test.tsx`: 1 failure (pre-existing `getByText` multiple-match fragility)
- `tests/catalog-variant.test.ts`: 1 failure (pre-existing selectBestVariantArtUrl logic)
- `tests/binder-queries.test.ts`: 1 failure (pre-existing mock assertion)
- `tests/data-isolation.test.ts`: 1 failure (pre-existing db.select().leftJoin mock)
- `tests/trade-api.test.ts`: 2 failures (SSL cert error in test env)

No new test failures introduced by this plan.

## TypeScript Check

`npx tsc --noEmit` exits non-zero (1), but **all errors are in test files only**:
- `__tests__/api-deck-validation.test.ts`: params type mismatch (pre-existing — test passes `{ id }` directly but route expects `Promise<{ id }>`)
- `__tests__/collection-page.test.tsx`: uses Jest syntax in a Vitest project (pre-existing)

**Production code:** Zero TypeScript errors. The Next.js build's TypeScript check passed clean ("Finished TypeScript in 7.7s").

The `npx tsc --noEmit` plan requirement was not fully met due to pre-existing test file type errors. This is a known pre-existing state that predates Phase 24.

## Task Commits

1. **Task 1: Fix cacheComponents-incompatible force-dynamic exports and add Suspense boundaries** - `f22dc28`

## Files Created/Modified

- `src/app/api/cards/all/route.ts` — Removed `export const dynamic = 'force-dynamic'` (incompatible with cacheComponents; route now served statically via getAllCards 'use cache')
- `src/app/binder/[username]/page.tsx` — Removed `export const dynamic = 'force-dynamic'` (incompatible with cacheComponents; page uses params at runtime so defers naturally)
- `src/app/decks/page.tsx` — Removed `export const dynamic = 'force-dynamic'` (incompatible; page calls headers() which terminates prerender naturally)
- `src/app/page.tsx` — Removed `export const dynamic = 'force-dynamic'` (incompatible; page now ◐ Partial Prerender)
- `src/app/layout.tsx` — Added `<Suspense>` around NavBar and `<Suspense>` around CurrencyProvider inside NuqsAdapter; prevents blocking-route build errors from usePathname() and useState() under cacheComponents

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Discovered `force-dynamic` is INCOMPATIBLE with `cacheComponents: true` (opposite of plan assumption)**
- **Found during:** Task 1, first build attempt
- **Issue:** The plan assumed `force-dynamic` might need to be ADDED to opt routes out of prerendering. The actual behavior: `cacheComponents: true` makes `export const dynamic = 'force-dynamic'` a Turbopack compile error ("Route segment config 'dynamic' is not compatible with `nextConfig.cacheComponents`"). The 4 files that had this export ALL needed it removed.
- **Files affected:** `src/app/api/cards/all/route.ts`, `src/app/binder/[username]/page.tsx`, `src/app/decks/page.tsx`, `src/app/page.tsx`
- **Fix:** Removed the incompatible export from all 4 files.
- **Commit:** f22dc28

**2. [Rule 1 - Bug] `NavBar` and `CurrencyProvider` caused blocking-route build errors in `/binder/[username]`**
- **Found during:** Task 1, second/third build attempt (after fixing force-dynamic)
- **Issue:** Under `cacheComponents: true`, client components in the root layout that use hooks (`usePathname()` in NavBar, `useState` in CurrencyProvider) caused "Uncached data accessed outside of Suspense" build errors for the binder page. The binder page was the first route to trigger this because its data is fully dynamic.
- **Fix:** Wrapped `<NavBar />` and `<CurrencyProvider>` in `<Suspense>` in `src/app/layout.tsx`. Per Next.js 16 docs: "Components that access runtime APIs should be wrapped in `<Suspense>`."
- **Files modified:** `src/app/layout.tsx`
- **Commit:** f22dc28

**3. [Rule 1 - Bug] Database SSL cert error on Windows during build cache pre-population**
- **Found during:** Task 1, second build attempt
- **Issue:** With `'use cache'` on `getAllCards`, Next.js attempts to pre-populate the cache at build time by executing the DB query. On this Windows machine, Node.js cannot verify Neon's SSL certificate (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`). This is an environment-specific issue — Vercel's build environment trusts the necessary CA certs.
- **Fix:** Added `NODE_OPTIONS="--use-system-ca"` to the build command to use Windows' system CA store. This is a developer machine fix only — production Vercel builds will work without this flag.
- **Note:** This is NOT a code change. The production Vercel deployment will succeed without this flag.

### Attempted but reverted

- Tried adding `await connection()` to `src/app/binder/[username]/page.tsx` to signal dynamic rendering. This broke `tests/binder-public-render.test.tsx` (the test calls the page function directly without a request context, so `connection()` throws). Reverted; the Suspense layout fix resolved the binder build error instead.

## Phase 24 Final Readiness

All three PERF requirements are integration-verified at build time:

| Requirement | Status | Evidence |
|-------------|--------|---------|
| PERF-01 | Satisfied | Debounce (Plan 02) + virtualization (Plan 03) in place; no build issues |
| PERF-02 | **Confirmed** | `/cards` is `○ Static (1d revalidate)` in build output — was `ƒ Dynamic` before Phase 24 |
| PERF-03 | Satisfied | `priority={index < 22}` wired through CardGrid → CardItem (Plan 03); no build issues |

**Project ready for `/gsd-verify-work` and human UAT.**

## Threat Surface Scan

No new security-relevant surface introduced. The changes are:
1. Removing `force-dynamic` — no security impact; affected routes are either cached public data or already guarded by `headers()` / `auth.api.getSession()`
2. Adding Suspense boundaries in layout — no security impact; purely a rendering boundary

T-24-14 (Tampering — route handler opt-out) disposition: MITIGATED. The only route handler modification considered in this plan was removing `force-dynamic` from `api/cards/all`. The existing `CRON_SECRET` Bearer check on the sync route is preserved.

## Known Stubs

None. All Phase 24 features are fully wired.

---

## Self-Check: PASSED

- `src/app/api/cards/all/route.ts` — EXISTS (modified, force-dynamic removed)
- `src/app/binder/[username]/page.tsx` — EXISTS (modified, force-dynamic removed)
- `src/app/decks/page.tsx` — EXISTS (modified, force-dynamic removed)
- `src/app/page.tsx` — EXISTS (modified, force-dynamic removed)
- `src/app/layout.tsx` — EXISTS (modified, Suspense added)
- Commit `f22dc28` — verified

---

*Phase: 24-catalog-page-load-performance*
*Completed: 2026-05-26*
