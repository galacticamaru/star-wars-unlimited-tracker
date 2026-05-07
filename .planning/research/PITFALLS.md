# Pitfalls Research — v2 Features (Star Wars Unlimited Tracker)

**Researched:** 2026-05-07 (inline)
**Confidence:** HIGH (based on existing codebase + known patterns)

---

## Auth Migration Pitfalls

### Pitfall 1: Missed userId=1 hardcodes
**What goes wrong:** Grepping for `userId` finds the obvious cases. Silent failures occur when queries use destructuring defaults, default parameters, or helper functions that internally default to userId=1.
**Warning sign:** After auth, user A can see user B's collection or decks.
**Prevention:** Full-codebase audit with `grep -r "userId.*1\|userId = 1\|userId: 1"`. Convert ALL to session lookup before shipping.
**Phase:** Auth phase (Phase 6) — must be 100% complete before any other v2 phase ships.

### Pitfall 2: Unprotected mutation routes
**What goes wrong:** GET routes are protected (user gets redirected to login), but POST/PATCH/DELETE API routes silently accept requests without a session and operate on userId=1.
**Warning sign:** A logged-out user can still modify collection counts.
**Prevention:** All API route handlers that write data must start with a session check that returns 401.
**Phase:** Auth phase (Phase 6).

### Pitfall 3: Next.js 16 proxy vs middleware naming
**What goes wrong:** Copying Better Auth setup guides written for Next.js 15 creates a `middleware.ts` file. Next.js 16 renamed this to `proxy.ts` — the middleware file is silently ignored.
**Warning sign:** Auth protection appears to work in dev but routes are completely unprotected in production.
**Prevention:** Use `proxy.ts` + export `proxy` function (not `middleware`).
**Phase:** Auth phase (Phase 6).

### Pitfall 4: First-user data migration
**What goes wrong:** All v1 data belongs to userId=1 (a row in the new `users` table). If the first registered user doesn't get id=1, or if auto-increment skips, v1 data becomes orphaned.
**Prevention:** Seed a user row with a known ID during auth setup, or run a migration that assigns all existing data to the first registered user post-signup.
**Phase:** Auth phase (Phase 6).

---

## Market Pricing Pitfalls

### Pitfall 5: Live price fetch on hot path
**What goes wrong:** Fetching prices from pokemon-api.com on every catalog page load burns the free tier (100 req/day) in minutes with normal usage. Latency spikes. 429 errors propagate to users.
**Prevention:** Cache in `card_prices` DB table. Fetch once per day in cron job. Serve cached prices in all UI queries. Pages should never fetch prices live.
**Phase:** Market pricing phase.

### Pitfall 6: API key in client bundle
**What goes wrong:** `NEXT_PUBLIC_POKEMON_API_KEY` exposes the key in the browser. Free tier keys get abused by scrapers.
**Prevention:** Store as `POKEMON_API_KEY` (no `NEXT_PUBLIC_` prefix). All price fetching in server-side cron or Server Actions only.
**Phase:** Market pricing phase.

### Pitfall 7: Currency mismatch shown to AU users
**What goes wrong:** Showing USD prices to AU users without context is confusing (USD ~1.55x AUD). Users think cards are more expensive than they are.
**Prevention:** Show both EUR and USD with currency labels. Add a note that prices are from EU/US marketplaces. Optional: AUD conversion using a fixed rate (update periodically).
**Phase:** Market pricing phase.

---

## Deck of the Day Pitfalls

### Pitfall 8: swuapi.com API key not set → cron silently skips
**What goes wrong:** If `SWUAPI_KEY` is missing in production env, the cron fetch returns 401 and today's deck is never fetched. No featured deck shown, no error reported.
**Prevention:** Cron handler must check for missing API key and log an explicit warning. Monitoring alert on cron failure.
**Phase:** Deck of the Day phase.

### Pitfall 9: Decklist references cards not in local catalog
**What goes wrong:** A tournament deck uses cards from a new set not yet synced. `INSERT featured_deck_cards` fails on FK constraint against `card_definitions`.
**Prevention:** Filter out any card IDs not present in local `card_definitions` before inserting. Log missing cards. Run catalog sync before deck fetch in the daily cron.
**Phase:** Deck of the Day phase.

### Pitfall 10: Cron slot collision
**What goes wrong:** The daily cron at 06:00 UTC now runs: catalog sync + price refresh + deck fetch. If catalog sync is slow (large set release), it may time out before the other two tasks run.
**Prevention:** Run tasks sequentially in cron: (1) catalog sync, (2) price refresh, (3) deck fetch. Add per-task timeouts. Vercel cron max duration is 10s on Hobby — keep each task fast.
**Phase:** Deck of the Day phase.

---

## Trade Binder Pitfalls

### Pitfall 11: Offering quantity exceeds owned quantity
**What goes wrong:** User adds 3 copies to binder, then trades 2 away (removes from collection). Binder still shows 3 available. Public visitors see false supply.
**Prevention:** Server action for updating binder quantities validates `quantity_offering <= owned_count` at write time. On collection decrement, auto-clamp binder offering. Consider a DB trigger or application-level hook.
**Phase:** Trade binder phase.

### Pitfall 12: Public binder route leaks auth-only data
**What goes wrong:** The public `/[username]/binder` route accidentally includes fields like email or internal user IDs in the JSON response.
**Prevention:** Public binder queries project only: username (display name), card data, quantity_offering. Never include userId, email, or session tokens in public responses.
**Phase:** Trade binder phase.
