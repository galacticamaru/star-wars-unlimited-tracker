# Research Summary — v2 Features (Star Wars Unlimited Tracker)

**Researched:** 2026-05-07

---

## Stack Additions

| Area | Package / Service | Version | Notes |
|------|-----------------|---------|-------|
| Auth | `better-auth` | ^1.6.x | Next.js 16: use proxy.ts (not middleware.ts) |
| Auth adapter | `@better-auth/drizzle-adapter` | latest | Works with existing neon-http Drizzle setup |
| Pricing | pokemon-api.com API | REST | Cardmarket EUR + TCGPlayer USD; SWU supported; 100 req/day free |
| Tournament decklists | swuapi.com API | REST | API key required for tournament/decklist endpoints |

**No new client libraries needed** for trade binder — built on existing auth + collection stack.

---

## Key Research Findings

### swubase.com
No public API. Web UI only. **Cannot use as data source.** Use swuapi.com instead (has full tournament + decklist API, API key required).

### Australian Pricing
No AU-native SWU price API exists. Best proxy: pokemon-api.com which returns both Cardmarket EUR and TCGPlayer USD. EU prices are closest to AU secondary market reality. Show both currencies with labels.

### Better Auth + Next.js 16
Fully compatible. One breaking change vs v15: rename `middleware.ts` → `proxy.ts`, export `proxy` function (not `middleware`). Auth.js/NextAuth is deprecated — Better Auth is the successor.

---

## Feature Table Stakes

| Feature | Must-Have |
|---------|-----------|
| Auth | Email/password login, session persistence, per-user data isolation |
| Pricing | Price per card (catalog + deck builder), total deck cost, daily cache refresh |
| Deck of the Day | Featured deck from PQ+ tournament, missing-card overlay, copy to library |
| Trade Binder | Quantity-based offering from collection, public URL, catalog-style filters |

---

## Watch Out For

1. **userId=1 migration** — Audit every DB query; replace all hardcodes before shipping auth
2. **proxy.ts naming** — Next.js 16 renamed middleware to proxy; wrong filename = silently unprotected routes
3. **Live price fetch** — Never fetch pokemon-api.com per-request; cache in DB, refresh daily
4. **swuapi.com API key** — Server-side only (`SWUAPI_KEY`, no NEXT_PUBLIC_ prefix)
5. **Cron slot** — 1 cron/day (Hobby tier); run catalog sync → price refresh → deck fetch sequentially
6. **Trade binder integrity** — Clamp offering quantity when collection count decreases

---

## Suggested Build Order

```
Phase 6: Auth          → Must be first; all other phases need real userId
Phase 7: Market Pricing → Independent once auth is done
Phase 8: Deck of the Day → Needs auth (copy-to-library) + pricing (cost summary)
Phase 9: Trade Binder  → Needs auth; independent of pricing and deck-of-day
```
