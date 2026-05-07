# Stack Research — v2 Features (Star Wars Unlimited Tracker)

**Researched:** 2026-05-07 (inline — agents hit rate limit)
**Overall confidence:** HIGH (Better Auth, swuapi.com), MEDIUM (pricing API selection)

---

## Auth — Better Auth

| Package | Version | Purpose |
|---------|---------|---------|
| `better-auth` | ^1.6.x | Core auth library — sessions, accounts, social login |
| `@better-auth/drizzle-adapter` | latest | Drizzle ORM adapter (replaces Prisma adapter) |

**Why Better Auth over Auth.js:** Auth.js team transferred Better Auth in Sept 2025; Auth.js is now in security-patch mode only. All new projects use Better Auth. Better Auth has first-class Drizzle adapter support and Next.js 16 App Router integration.

**Next.js 16 specific:** Next.js 16 renames "middleware" to "proxy". Use `proxy.ts` (not `middleware.ts`). The `proxy` function replaces `middleware`. All Better Auth APIs are otherwise identical.

**Setup pattern:**
- API route: `/app/api/auth/[...all]/route.ts` — `toNextJsHandler(auth)` exports GET + POST
- Client: `lib/auth-client.ts` — `createAuthClient()` from `better-auth/react`
- Server sessions: `auth.api.getSession({ headers })` in RSCs and Server Actions
- Plugin: `nextCookies()` for automatic cookie handling in server actions

---

## Market Pricing — pokemon-api.com

| Service | Cost | Rate Limit | Currencies |
|---------|------|-----------|-----------|
| pokemon-api.com Basic | Free | 100 req/day | EUR + USD |
| pokemon-api.com Pro | $9.90/mo | 3,000 req/day | EUR + USD |

**Why pokemon-api.com:**
- Natively supports Star Wars: Unlimited
- Aggregates **Cardmarket (EU)** + **TCGPlayer (US)** pricing
- Returns both EUR and USD in one response
- Simple REST API, no OAuth dance required
- Free tier (100 req/day) sufficient for cache-refresh approach

**Australian market:** No AU-native SWU price API exists. Cardmarket EU prices (EUR) are the closest proxy to Australian secondary market — AU buyers typically import from EU. Show both EUR and USD; add AUD conversion via a fixed exchange rate or separate FX API.

**What NOT to use:**
- TCGPlayer API directly — US-only, no AU relevance
- Cardmarket direct API — requires OAuth 1.0 HMAC-SHA1 + partner approval (impractical)
- Real-time per-request price fetching — always cache in DB

---

## Deck of the Day — swuapi.com

| Endpoint | Auth Required | Notes |
|----------|-------------|-------|
| `GET /tournaments` | API key (Bearer) | Lists PQ, SQ, RQ, GC, LCQ events |
| `GET /decklists` | API key (Bearer) | All submitted decklists across tournaments |
| `GET /decklists/:meleeId` | API key (Bearer) | Single decklist: leader, base, 50-card list |
| `GET /cards`, `GET /metas` | None | Public endpoints |

**swubase.com:** No public API found. Web UI only. Not suitable as a data source.

**Decklist data shape:**
```json
{
  "melee_id": "...",
  "player_name": "...",
  "tournament_name": "...",
  "tier": "PQ",
  "leader_name": "...",
  "base_name": "...",
  "decklist": [{ "id": "SOR_010", "count": 1 }]
}
```
Card IDs use swudb set notation (`SOR_010`) — matches our existing `card_printings.swudb_id` column.

**API key:** Must register at swuapi.com. Store as `SWUAPI_KEY` env var. Never expose client-side.

---

## Trade Binder

No new libraries required. Trade binder is a feature built on top of existing auth + collection infrastructure.

---

## What NOT to Add

- `next-auth` / `@auth/core` — deprecated, security-patch mode only
- Prisma — bundle size incompatible with Vercel cold starts (1.6 MB vs Drizzle's 7 KB)
- Real-time WebSocket price feeds — Vercel serverless doesn't support persistent connections
- `react-query` / TanStack Query — already handled by Next.js Server Actions + nuqs; no client-side data layer needed
