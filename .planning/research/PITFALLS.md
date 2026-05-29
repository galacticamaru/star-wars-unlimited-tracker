# Domain Pitfalls — v6 Mobile, Performance & Polish

**Domain:** Mobile responsiveness + performance for existing Next.js 16 TCG deck builder
**Researched:** 2026-05-29
**Scope:** v6 milestone — fixed-height layout retrofit, per-user caching, INP, catalog state invalidation

---

## Critical Pitfalls

### Pitfall 1: Applying `use cache` to per-user deck or collection queries

**What goes wrong:** `getAllCards()` and `getFilterOptions()` are correctly tagged `'use cache'` with `cacheLife('days')` — these are public catalog queries and safe to share across all users. The risk is if v6 performance work adds `use cache` to any query that returns user-scoped data: deck lists, collection counts, want lists. If `getDecks(userId)` is called inside a `'use cache'` block without `userId` being captured as part of the cache key, two users with matching other inputs will share a cache entry. User B receives User A's private deck data with no runtime error.

`cacheComponents: true` is enabled in `next.config.ts`. Next.js 16 `use cache` does automatically capture closed-over scope variables into the cache key — but only if `userId` is in the function's closed-over scope or passed as an explicit argument. A top-level `export async function getDecks() { 'use cache'; ... }` with no userId argument captures nothing about the caller's identity.

**Consequences:** Silent cross-user data exposure. No error thrown. Affects only sessions that hit a warmed cache entry from a different user. Does not reproduce in development (serverless resets every request in dev).

**Prevention:**
- Never add `use cache` to `getDecks()`, `getWantList()`, `getUserCollection()`, or any function whose WHERE clause filters on `userId`.
- The current `/decks` and `/decks/[id]` pages already call `auth.api.getSession()` first and pass `userId` explicitly as a plain argument to each query — maintain this pattern, and do not hoist these into cached wrappers.
- If per-user caching is genuinely needed, pass `userId` as an explicit argument so it becomes part of the serialized cache key, and tag it with `cacheTag('user-' + userId)` to allow targeted invalidation.
- Do not use `'use cache: private'` for auth-gated data in this project. It is marked experimental in Next.js 16, results are browser-only (never stored on server), and there is a confirmed open bug where it does not isolate data correctly during client-side navigation (vercel/next.js #85672).

**Detection:** Open two separate browser sessions with different user accounts. In session A, create a deck named "SESSION-A-DECK". In session B, navigate to `/decks`. If that deck appears, a cache leak exists.

---

### Pitfall 2: `router.refresh()` does not bust the server-side `use cache` Data Cache — these are two independent cache layers

**What goes wrong:** After a user edits collection counts on the card detail page, the catalog (`/cards`) should show updated owned-count overlays. `VariantCollectionSection` calls `useRouter().refresh()` on successful mutation. This is correct for flushing the client-side Router Cache (so the next navigation re-fetches the RSC payload), but it does not invalidate server-side `use cache` entries. If any query in the catalog chain were wrapped in `use cache`, `router.refresh()` would cause the browser to re-request the RSC payload and the server would return the already-cached (stale) version — no DB query is re-run.

Additionally, `revalidateTag` called inside a Route Handler (e.g. `POST /api/collection/variants`) does schedule server-side Data Cache invalidation, but it does NOT immediately flush the client Router Cache. The client still serves the cached route for soft-navigations until its 30-second minimum stale time expires or `router.refresh()` is also called.

This is DEBT-04 in specific form: collection state does not invalidate correctly after card detail page mutations.

**Consequences:** Users see stale owned count badges in the catalog after editing a card. The detail page itself (optimistic update) shows the correct count, but the catalog page shows the previous value.

**Prevention:**
- `GET /api/collection` and the DB query it calls (`getUserCollection`) must have no `use cache` wrapper — they are per-user, request-time queries. Confirm this remains true as v6 work progresses.
- The current architecture is safe: `CatalogClient` fetches collection client-side via `useEffect(() => fetch('/api/collection'))`, so every mount re-fetches live data. A navigation back to `/cards` re-mounts `CatalogClient` and gets fresh collection counts. No server-side caching is in this path.
- If Server Actions replace Route Handlers in future phases, call `revalidateTag('collection-' + userId)` inside the Server Action. This updates both the Data Cache and (via the response header) signals the Router Cache to treat the current route as stale.
- For DEBT-04 specifically: confirm the mutation path ends with `router.refresh()` (already present), and verify there is no `use cache` wrapper on the `/cards` RSC data queries that would short-circuit the refresh.

**Detection:** On `/cards/SOR/001`, change the Normal count from 1 to 3. Navigate back to `/cards`. The owned-count badge for SOR 001 should show 3. If it shows 1, the Data Cache is serving stale data.

---

## Critical Pitfalls — Mobile Layout

### Pitfall 3: `h-[calc(100svh-56px)] overflow-hidden` is not mobile keyboard-safe

**What goes wrong:** The deck builder root uses `h-[calc(100svh-56px)] overflow-hidden` (line 307 of `deck-builder.tsx`). `svh` (Small Viewport Height) is the correct fix for iOS Safari toolbar-resize jitter, and it is stable. However, it does not account for the soft keyboard. When the deck name `<input>` gains focus on mobile, the on-screen keyboard consumes ~40% of the screen. `svh` does not shrink to reflect the reduced visual space — the container height stays fixed, and the keyboard overlaps the lower portion. On iOS Safari, `position: fixed` elements inside an `overflow: hidden` ancestor are clipped to that ancestor's bounds rather than the viewport, so any bottom Sheet added as a mobile sidebar trigger will also be clipped if it is rendered inside the container rather than in a portal.

**Consequences:** Deck name input gets obscured by the keyboard. Mobile bottom bar (`md:hidden fixed bottom-0`) may be unreachable. Sheet-based sidebar may clip or disappear at the `overflow-hidden` boundary.

**Prevention:**
- Apply `dvh` on mobile and keep `svh` on desktop. Tailwind does not have a built-in `h-dvh` utility for `calc`, so use: `className="h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)] overflow-hidden"`. `dvh` (Dynamic Viewport Height) updates as the visual viewport changes (keyboard appear/collapse) and matches across iOS Safari, Chrome Android, and Firefox Mobile.
- Ensure the deck name `<input>` renders at a computed font-size of at least 16px. iOS Safari auto-zooms any focused input with `font-size < 16px`, causing an additional layout shift.
- For the mobile sidebar Sheet: render it via `SheetPortal` (already present in `src/components/ui/sheet.tsx` via `@base-ui/react/dialog`'s Portal, which targets `document.body`). Confirm the portal root is never overridden to a nested element.

**Detection:** Open deck builder on a real iPhone (or Chrome DevTools with keyboard simulation enabled). Tap the deck name field. If the page layout shifts, content disappears under the keyboard, or the toolbar is no longer visible, the pitfall is active.

---

### Pitfall 4: Mobile breakpoints that break the desktop `flex overflow-hidden` shell

**What goes wrong:** The correct mobile approach for the deck builder is: hide the right-rail `DeckSidebar` below `md`, and expose its content via a Sheet triggered by a mobile button. A naive implementation wraps the whole sidebar in `hidden md:flex`. The problem is that the Sheet used for the mobile sidebar must not be a child of the `overflow-hidden` flex container — it needs to portal to `document.body`. If the Sheet component is placed as a sibling inside the container (e.g. as a child of `DeckBuilder`'s return), `overflow: hidden` on the root div clips it on WebKit. Additionally, hiding only the sidebar without providing a visible mobile trigger violates MOBILE-01 (stats sidebar must remain accessible on mobile).

**Why it happens:** `overflow: hidden` creates a clipping context. `position: fixed` is supposed to escape this, but WebKit treats fixed elements as clipped by the nearest ancestor with `overflow: hidden` when that ancestor is a flex or grid container with an explicit height. This is a long-standing known WebKit deviation from the spec.

**Consequences:** The Sheet renders but is partially or fully invisible on iOS Safari. The desktop layout is unaffected.

**Prevention:**
- The existing `Sheet` component uses `SheetPrimitive.Portal` from `@base-ui/react/dialog`. This renders the Sheet into a portal at `document.body`, entirely outside the deck builder's clipping context. Verify the portal is not being overridden.
- The mobile layout should be: add a sticky mobile footer bar to the deck builder's main content area (inside the scrollable flex-1 child, not the clipping root) that shows a summary (card count, legal status) and a "Stats" button that opens the Sheet. The Sheet content is `DeckSidebar`'s JSX, rendered via portal.
- The three-tab layout (Deck List, Add Cards, Want List) must remain structurally identical for `md` and above. Use `hidden md:block` / `md:hidden` utilities only.

**Detection:** At 375px viewport width in iOS Safari, open the deck builder. The Sheet trigger button must be visible. Tapping it must show the full sidebar content including save buttons. At 1024px, the Sheet trigger must be invisible and the right-rail sidebar must be present.

---

## Moderate Pitfalls

### Pitfall 5: INP regression when opening the mobile DeckSidebar Sheet

**What goes wrong:** Opening a Sheet (base-ui Dialog) triggers a synchronous React render cascade: `DeckSidebar`'s `useMemo` chains for validation, cost curve, and aspect breakdown all recompute within the same event handler flush. Simultaneously, base-ui applies `body { overflow: hidden }` to lock scroll — this triggers an expensive style recalculation across the entire document. The combination of a large React render plus a full-document style recalc can exceed 50ms, creating a long task before the browser paints the Sheet's initial frame. This is measurable INP regression.

Real-world data from production React apps at Framer shows that opening modals/dialogs is one of the most common INP regression sources, specifically because of the `overflow: hidden` body scroll-lock triggering document-wide style recalc.

**Consequences:** Users tap the mobile sidebar button and feel a jank delay before the Sheet appears. This will show up in Vercel Speed Insights as high INP on `/decks/[id]`.

**Prevention:**
- Wrap the open state update in `startTransition`: `import { startTransition } from 'react'; const handleOpen = () => startTransition(() => setOpen(true))`. This tells React the state update is non-urgent, yielding the main thread for the first paint frame (which the browser uses to show interaction feedback) before committing the full Sheet render.
- Keep `DeckSidebar`'s `useMemo` computations outside the Sheet's render cycle — they should run in the parent `DeckBuilder` regardless of Sheet open state, so there is no extra compute cost when the Sheet opens.
- Do not render `CatalogClient` (with its 10+ nuqs hooks and filter `useMemo` chain) inside the Sheet. The Add Cards view must stay in the main content area.
- After shipping, verify INP on `/decks/[id]` in Vercel Speed Insights real-user data. Target the same INP baseline as the catalog routes post-v5.

**Detection:** Chrome DevTools Performance recording of a tap on the mobile sidebar button. Look for long tasks (red bar >50ms) in the flame chart after the event handler. The first frame render should be fast; the full Sheet content can hydrate in the following frame.

---

### Pitfall 6: nuqs `useQueryState` hooks in `CatalogClient` will re-run on every unmount/remount

**What goes wrong:** `DeckBuilder` conditionally renders `CatalogClient` with `{view === 'catalog' ? <CatalogClient ... /> : ...}`. Every tab switch (Deck List ↔ Add Cards) unmounts and remounts `CatalogClient`. On remount, all 10+ nuqs `useQueryState` hooks re-read the URL and re-apply defaults, which fires a batch of URL-write operations and resets any local `searchInput` state. This is a pre-existing behavior, not introduced by v6. The v6 risk: if the mobile Sheet adds another level of conditional rendering around the catalog, this behavior gets triggered more frequently and more visibly.

**Prevention:**
- Do not move `CatalogClient` into the mobile Sheet. The Add Cards tab must remain in the main content area, conditionally shown/hidden via CSS (`hidden` class) rather than conditional JSX rendering.
- Change `{view === 'catalog' ? <CatalogClient ... /> : <div>...}` to render `CatalogClient` always but with `className={view !== 'catalog' ? 'hidden' : ''}`. This keeps all nuqs hooks mounted and avoids re-read-on-remount. Verify this does not cause a visible performance cost from having the full filter chain in memory during non-catalog views (it is fine; the `useMemo` results are already computed and stable).

**Detection:** In the Add Cards tab, type "Luke" in the search box. Switch to Deck List. Switch back to Add Cards. If the search box is cleared, the unmount/remount pitfall is active and the CSS-hidden approach should be used.

---

### Pitfall 7: Variant enum gaps (DEBT-03) silently break mobile filter exposure

**What goes wrong:** DEBT-03 adds `Prestige Foil` to `VARIANT_OPTIONS` and `Serialized` to `VARIANT_PRECEDENCE`. These enums drive the variant filter chip in `CatalogClient`. If the mobile Sheet or mobile filter exposure is built before DEBT-03 is resolved, users selecting `Prestige Foil` in the mobile filter will silently receive zero results — the DB has cards with `variantType = 'Prestige Foil'` but the filter option is missing from the enum, so the filter never matches. This is not a crash; it is a silent UX failure.

**Prevention:** Co-land DEBT-03 with the first phase that modifies the filter UI. It is a two-line enum addition with no DB migration required.

---

### Pitfall 8: `revalidateTag('cards', 'max')` in the cron handler passes an extra argument that is silently ignored

**What goes wrong:** `src/app/api/cron/sync-cards/route.ts` calls `revalidateTag('cards', 'max')`. The `revalidateTag` function in Next.js 16 accepts a single string argument. The second `'max'` argument is silently dropped by TypeScript (no type error because the function is variadic in some versions) and has no effect. If the intent was to enforce a maximum-depth revalidation, that behavior is not applied.

**Consequences:** The cron cache invalidation still works (the `'cards'` tag is correctly invalidated), but the `'max'` argument is dead code that may cause confusion when debugging cache behavior for `/decks` performance work.

**Prevention:** Change to `revalidateTag('cards')`. Confirm against the Next.js 16 type signature in `node_modules/next/dist/server/revalidate-tag.d.ts` that only one argument is accepted.

**Detection:** Check the TypeScript type of `revalidateTag` in the project's installed Next.js version. If it accepts a second argument, document what it does; if not, remove it.

---

## Minor Pitfalls

### Pitfall 9: `onTouchStart` on deck list rows fires during scroll, revealing the mobile bottom bar unintentionally

**What goes wrong:** Deck list rows use `onTouchStart={() => setHoveredCard(item.card)}` to trigger the mobile card preview. The mobile fixed bottom bar (`md:hidden fixed bottom-0 h-24`) appears whenever `hoveredCard` is non-null. `onTouchStart` fires at the beginning of any touch interaction, including scroll. So every scroll attempt through the deck list briefly reveals the 96px bottom bar, covering content and creating visual noise.

**Prevention:** Replace `onTouchStart` with `onClick` for the `setHoveredCard` trigger on mobile. `onClick` only fires when the browser confirms the gesture was a tap, not a scroll. Alternatively, evaluate whether the mobile bottom preview bar is still needed once the Sheet sidebar is in place — if the card preview is only relevant to identify a card while tapping +/-, `onClick` is the correct trigger.

---

### Pitfall 10: `window.confirm` popstate guard conflicts with mobile back-swipe gesture UX

**What goes wrong:** When `isDirty`, `DeckBuilder` intercepts `popstate` with a `window.confirm` dialog. On iOS Safari and Android Chrome, the browser back gesture fires `popstate` during the mid-swipe animation. `window.confirm` is a synchronous blocking dialog that halts the swipe animation, producing a jarring UX: the user sees the page partially swiped away with a dialog box overlaid.

**Prevention:** For v6 scope, document this as a known UX limitation rather than a full fix. The longer-term fix is replacing `window.confirm` with an in-page confirmation Sheet that the user dismisses explicitly. This is non-trivial because the Sheet must prevent navigation while open, which requires care with the base-ui Dialog's focus trap and the next `popstate` event.

---

## Phase-Specific Warnings

| Phase Topic | Pitfall | Mitigation |
|-------------|---------|------------|
| Mobile sidebar Sheet | Sheet clipped by `overflow-hidden` container | Confirm `SheetPortal` renders to `document.body`; Sheet must be a sibling of the deck builder root, not a child inside it |
| Mobile sidebar Sheet trigger | INP regression from synchronous render+scroll-lock | Wrap open state update in `startTransition` |
| Fixed-height layout on mobile | Soft keyboard covers container content | Use `dvh` on mobile, `svh` on desktop; deck name input must have font-size ≥ 16px |
| /decks + /decks/[id] performance | Adding `use cache` to deck/collection queries | These are per-user queries; never apply `use cache` without userId as an explicit argument in the cache key |
| DEBT-04 catalog state invalidation | `router.refresh()` does not bust server Data Cache | Verify no `use cache` on collection fetch path; client-side `useEffect` collection re-fetch on `/cards` mount is the correct mechanism |
| Mobile filter exposure | Silent variant filter gaps (Prestige Foil, Serialized) | Co-land DEBT-03 with any mobile filter work |
| Cron cache invalidation | `revalidateTag('cards', 'max')` second arg ignored | Fix to single-argument call; confirm invalidation actually runs after sync |
| Deck list scroll on mobile | `onTouchStart` reveals bottom bar during scroll | Replace with `onClick` |

---

## Sources

- [Next.js 16 `use cache` directive docs](https://nextjs.org/docs/app/api-reference/directives/use-cache) — HIGH confidence, official, version-matched (lastUpdated 2026-05-28)
- [Next.js `use cache: private` docs](https://nextjs.org/docs/app/api-reference/directives/use-cache-private) — HIGH confidence; note experimental status and navigation isolation bug vercel/next.js #85672
- [Next.js Caching Guide (Cache Components model)](https://nextjs.org/docs/app/getting-started/caching) — HIGH confidence, official
- [Next.js Caching (Previous Model) Guide](https://nextjs.org/docs/app/guides/caching-without-cache-components) — HIGH confidence; Router Cache vs Data Cache distinction
- [INP optimization for React — Jacob Groß / kurtextrem.de](https://kurtextrem.de/posts/improve-inp-react) — MEDIUM confidence; community article with Framer production data; `startTransition` recommendation corroborated by React docs
- [Fix mobile keyboard overlap with dvh — Francisco Moretti](https://www.franciscomoretti.com/blog/fix-mobile-keyboard-overlap-with-visualviewport) — MEDIUM confidence; `dvh` recommendation cross-referenced with MDN and Tailwind discussions
- [Tailwind CSS `100svh` iOS Safari discussion — tailwindlabs/tailwindcss #4515](https://github.com/tailwindlabs/tailwindcss/discussions/4515) — MEDIUM confidence; community confirmed; `dvh` as solution
- [web.dev INP documentation](https://web.dev/articles/inp) — HIGH confidence; general INP principles
- Codebase direct inspection: `src/components/decks/deck-builder.tsx`, `src/components/decks/deck-sidebar.tsx`, `src/components/ui/sheet.tsx`, `src/db/queries/catalog.ts`, `src/app/api/collection/variants/route.ts`, `src/app/api/collection/route.ts`, `src/app/api/cron/sync-cards/route.ts`, `next.config.ts`
