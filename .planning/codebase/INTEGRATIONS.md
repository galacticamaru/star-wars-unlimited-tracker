# External Integrations

**Analysis Date:** 2026-05-08

## APIs & External Services

**Card Data API:**
- swu-db.com REST API - Canonical source of truth for all Star Wars Unlimited card and set data
  - Endpoint: `https://api.swu-db.com/sets` - Fetches all available sets
  - Endpoint: `https://api.swu-db.com/cards/{setId}` - Fetches all cards for a given set
  - Auth: None (public API, no key required)
  - Usage: Called from `src/lib/sync/upsert-cards.ts` (`syncAllCards`) at sync time
  - Response shape: `{ data: SWUCard[] }` for cards; `SWUSet[]` for sets

**Card Image CDN:**
- `cdn.swu-db.com` - Serves card artwork images
  - Pattern: `https://cdn.swu-db.com/images/cards/{SET}/{NUMBER}.png`
  - URLs stored in `cardPrintings.frontArtUrl` and `cardPrintings.backArtUrl` columns
  - Allowed in `next.config.ts` via `remotePatterns` for Next.js `<Image />`
  - Optimization currently bypassed (`unoptimized: true`) due to Vercel quota exhaustion

## Data Storage

**Databases:**
- Neon PostgreSQL (serverless)
  - Connection: `DATABASE_URL` environment variable (pooled connection string)
  - Client: Drizzle ORM with `drizzle-orm/neon-serverless` adapter
  - Pool config: `Pool` from `@neondatabase/serverless` in `src/db/index.ts`
  - WebSocket transport: `ws` package injected via `neonConfig.webSocketConstructor = ws`
  - Schema location: `src/db/schema.ts`
  - Tables:
    - `card_definitions` - Canonical card data (name, type, stats, text)
    - `card_printings` - Physical printing variants per set (art URLs, rarity, collector number)
    - `user_collections` - Per-user card counts (keyed on `user_id` + `card_definition_id`)
    - `decks` - User deck definitions with leader/base references
    - `deck_cards` - Cards within a deck (quantity + sideboard flag)

**File Storage:**
- None — card images served directly from `cdn.swu-db.com`; no local or cloud file storage

**Caching:**
- None at the application layer — Next.js page-level caching only
- Card pages use `export const dynamic = 'force-dynamic'` (no ISR/SSG caching)
- Image CDN cache TTL set to 2,678,400 seconds (31 days) in `next.config.ts`

## Authentication & Identity

**Auth Provider:**
- None — authentication is not implemented in v1
- All API routes and database queries hardcode `userId = 1` (single-user mode)
- Noted in code comments as decision D-04 and marked for future multi-user work

**Cron Auth:**
- Bearer token scheme for the Vercel Cron endpoint only
- Secret stored in `CRON_SECRET` environment variable
- Validated in `src/app/api/cron/sync-cards/route.ts`: header must equal `Bearer ${CRON_SECRET}`
- Guard explicitly checks `!cronSecret` before string comparison to prevent empty-string bypass

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Datadog, or equivalent integrated

**Logs:**
- `console.error(...)` throughout all API route catch blocks
- Vercel function logs capture these at runtime
- No structured logging or log aggregation service

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from `vercel.json` presence and Vercel-specific features used)
- Serverless functions for all API routes (`src/app/api/**`)

**CI Pipeline:**
- None detected — no `.github/workflows/`, CircleCI, or similar configuration

**Cron Jobs:**
- Vercel Cron — daily card sync
  - Path: `/api/cron/sync-cards`
  - Schedule: `0 6 * * *` (06:00 UTC daily)
  - Configured in `vercel.json`
  - Handler: `src/app/api/cron/sync-cards/route.ts`

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - Neon pooled PostgreSQL connection string (required at runtime and for `drizzle-kit` CLI)
- `CRON_SECRET` - 32-char hex string for authenticating cron requests

**Secrets location:**
- `.env.local` for local development (gitignored)
- Vercel project environment variables for production
- `.env.example` committed to repo as canonical reference for required variable names

## Webhooks & Callbacks

**Incoming:**
- `/api/cron/sync-cards` (GET) - Triggered by Vercel Cron scheduler daily at 06:00 UTC

**Outgoing:**
- None — no outgoing webhooks configured

## Third-Party Libraries with External Reach

**Google Fonts:**
- `next/font/google` used in `src/app/layout.tsx` to load Oxanium, Nunito Sans, Geist, and Geist Mono
- Fonts fetched at build time and self-hosted by Next.js (no runtime external requests)

---

*Integration audit: 2026-05-08*
