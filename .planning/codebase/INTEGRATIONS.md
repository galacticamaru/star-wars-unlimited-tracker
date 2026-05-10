# External Integrations

**Analysis Date:** 2025-05-24

## APIs & External Services

**Star Wars Unlimited Data:**
- SWU-DB API (`https://api.swu-db.com`) - Used for card definitions, set lists, and market pricing.
  - SDK/Client: Native `fetch`
  - Implementation: `src/lib/sync/upsert-cards.ts`, `src/lib/sync/prices.ts`

**Card Images:**
- SWU-DB CDN (`https://cdn.swu-db.com`) - Source for all card artwork.
  - Config: `next.config.ts` (remotePatterns)

## Data Storage

**Databases:**
- Neon (Serverless Postgres)
  - Connection: `DATABASE_URL`
  - Client: Drizzle ORM (`drizzle-orm`, `@neondatabase/serverless`)

**File Storage:**
- Local filesystem only (scripts/seed.ts uses local JSON if applicable, but primary data is in DB)

**Caching:**
- Next.js Image Cache: Configured in `next.config.ts` for card images.
- Next.js Data Cache: Default behavior for fetch in server components.

## Authentication & Identity

**Auth Provider:**
- Better Auth
  - Implementation: `src/lib/auth.ts`, `src/lib/auth-client.ts`
  - Social Providers: Google (`GOOGLE_CLIENT_ID`), Discord (`DISCORD_CLIENT_ID`)
  - Local: Email and Password enabled

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Console logging in server actions and sync scripts.

## CI/CD & Deployment

**Hosting:**
- Vercel

**CI Pipeline:**
- Vercel (GitHub Integration)
- Testing: Vitest runs via GitHub Actions (inferred from common patterns, though `.github/workflows` not explicitly checked)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL`: Neon Postgres connection string
- `BETTER_AUTH_SECRET`: Secret for auth token signing
- `BETTER_AUTH_URL`: Base URL for auth callbacks
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`: Discord OAuth

**Secrets location:**
- Vercel Environment Variables (Production)
- `.env.local` (Development)

## Webhooks & Callbacks

**Incoming:**
- `/api/auth/*`: Better Auth callback handlers
- `/api/cron/sync-cards`: Vercel Cron triggered endpoint (`vercel.json`)

**Outgoing:**
- None detected

---

*Integration audit: 2025-05-24*
