---
focus: tech
last_updated: 2026-05-28
---
# External Integrations

**Analysis Date:** 2026-05-28

## APIs & External Services

**Star Wars Unlimited Card Data:**
- SWU-DB API (`https://api.swu-db.com`) — card definitions, set lists, and market pricing
  - SDK/Client: Native `fetch` (no SDK)
  - Endpoints used:
    - `GET /sets` — fetch all set metadata
    - `GET /cards/{setId}` — fetch all cards for a set (returns `{ data: SWUCard[] }`)
    - `GET /cards/search?q=set:{setCode}&format=json` — fetch cards with pricing (returns array directly)
  - Auth: None (public API)
  - Implementation: `src/lib/sync/upsert-cards.ts`, `src/lib/sync/prices.ts`
  - Rate limiting: 1-second delay between set price fetches (self-imposed)

**Card Images:**
- SWU-DB CDN (`https://cdn.swu-db.com`) — source for all card artwork
  - Access: Next.js `<Image>` component with remote pattern allowlist
  - Config: `next.config.ts` (`remotePatterns`, `minimumCacheTTL: 2678400`, `unoptimized: true`)

**Market Pricing (secondary):**
- PokéWallet API — referenced by `POKEMON_API_KEY` env var in `.env.example`
  - Status: Key present in env template; no active usage found in `src/` at time of analysis

## Data Storage

**Databases:**
- Neon (Serverless PostgreSQL)
  - Connection: `DATABASE_URL` env var (pooled connection string)
  - Client: Drizzle ORM (`drizzle-orm/neon-serverless`) + `@neondatabase/serverless` Pool
  - WebSocket: `ws` package injected via `neonConfig.webSocketConstructor = ws` in `src/db/index.ts`
  - Schema: `src/db/schema.ts`
  - Queries: `src/db/queries/`

**File Storage:**
- None (no S3/Blob/R2 integration detected)

**Caching:**
- Next.js data cache: `revalidateTag('cards', 'max')` called after cron sync (`src/app/api/cron/sync-cards/route.ts`)
- Next.js image cache: controlled via `next.config.ts` `minimumCacheTTL`

## Authentication & Identity

**Auth Provider:**
- Better Auth 1.6.9
  - Server config: `src/lib/auth.ts`
  - Client config: `src/lib/auth-client.ts`
  - Database adapter: `drizzleAdapter` with `pg` provider
  - Auth tables: `user`, `session`, `account`, `verification` (all in `src/db/schema.ts`)
  - Plugin: `username()` (allows username-based login)
  - Strategies:
    - Email/password (enabled)
    - Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
    - Discord OAuth (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`)
  - API route: `src/app/api/auth/[...all]/route.ts`
  - Hook: First-user data migration in `databaseHooks.user.create.after` (migrates seeded data to new user)

## Monitoring & Observability

**Performance:**
- Vercel Speed Insights (`@vercel/speed-insights` 2.0.0) — client-side performance metrics

**Error Tracking:**
- None detected (no Sentry, Datadog, or equivalent)

**Logs:**
- `console.log` / `console.error` in server-side sync functions (`src/lib/sync/upsert-cards.ts`, `src/lib/sync/prices.ts`)

## CI/CD & Deployment

**Hosting:**
- Vercel (Next.js serverless deployment)

**CI Pipeline:**
- No `.github/workflows/` directory detected; Vercel GitHub integration handles preview and production deploys

**Scheduled Jobs:**
- Vercel Cron: `GET /api/cron/sync-cards` — runs daily at 06:00 UTC
  - Defined in `vercel.json`
  - Auth: `Authorization: Bearer {CRON_SECRET}` header check in route handler
  - Actions: syncs card definitions then prices from SWU-DB API, then revalidates `'cards'` cache tag

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` — Neon PostgreSQL pooled connection string
- `CRON_SECRET` — 32-char hex secret for cron endpoint auth
- `BETTER_AUTH_URL` — base URL for auth callbacks (e.g. `http://localhost:3000`)
- `BETTER_AUTH_SECRET` — secret for auth token signing
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` — Discord OAuth credentials
- `POKEMON_API_KEY` — PokéWallet API key (purpose unclear, no active usage found)

**Secrets location:**
- Development: `.env.local` (not committed; see `.env.example`)
- Production: Vercel Environment Variables dashboard

## Webhooks & Callbacks

**Incoming:**
- `src/app/api/auth/[...all]/route.ts` — Better Auth catch-all handler (OAuth callbacks, session management)
- `src/app/api/cron/sync-cards/route.ts` — Vercel Cron trigger endpoint (`GET`, bearer-token protected)

**Outgoing:**
- None detected

---

*Integration audit: 2026-05-28*
