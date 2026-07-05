# External Integrations

**Analysis Date:** 2026-07-05

## APIs & External Services

**Card Database & Pricing:**
- SWU-DB (Star Wars Unlimited Database) - Card definitions, printings, and market prices
  - Endpoint: `https://api.swu-db.com`
  - Used by: `src/lib/sync/upsert-cards.ts`, `src/lib/sync/prices.ts`
  - Endpoints:
    - `GET /sets` - Fetch all active card sets
    - `GET /cards/{setId}` - Fetch cards for a specific set
    - `GET /cards/search?q=set:{setCode}&format=json` - Search cards by set for pricing
  - Data flow:
    - Card sync (daily cron): Fetches set definitions and card details, upserts into `cardDefinitions` and `cardPrintings` tables
    - Price sync (daily cron): Fetches pricing data for active sets (SOR, SHD, TWI, JTL, SEC, LAW, IBH), converts USD to EUR using 0.92 exchange rate
  - Auth: None (public API)

**Performance Analytics:**
- Vercel Speed Insights - Web Vitals monitoring
  - Library: `@vercel/speed-insights` v2.0.0
  - Implementation: `src/app/layout.tsx`
  - Collects: Core Web Vitals metrics
  - Debug mode enabled in development

## Data Storage

**Databases:**
- Neon PostgreSQL Serverless
  - Connection: `DATABASE_URL` environment variable (required)
  - Client: `@neondatabase/serverless` v1.1.0 with WebSocket support
  - Connection pool: Node.js Pool from `@neondatabase/serverless`
  - ORM: Drizzle ORM v0.45.2
  - Location: `src/db/index.ts` (main database instance)
  - Schema: `src/db/schema.ts` (PostgreSQL tables)

**Tables:**
- `user` - User authentication records
- `session` - Active user sessions
- `account` - OAuth account links
- `verification` - Email verification tokens
- `cardDefinitions` - Card catalog (all unique cards)
- `cardPrintings` - Card print variants (foil, hyperspace, etc.)
- `userCollections` - User card inventory
- `decks` - Saved deck lists
- `binder` - Binder settings per user
- `wantList` - User want list for trading
- `tradeHistory` - Trade records between users

**File Storage:**
- Local filesystem only (no cloud storage integration)
- Public assets served from `public/` directory

**Caching:**
- Next.js built-in caching (via `next.config.ts`)
  - Image cache TTL: 2678400 seconds (31 days) for `cdn.swu-db.com`
  - Tag-based revalidation on card/price sync (tags: `'cards'`)
  - Component caching enabled

## Authentication & Identity

**Auth Provider:**
- Custom via Better Auth v1.6.9
  - Implementation: `src/lib/auth.ts` (server-side setup)
  - Client: `src/lib/auth-client.ts` (browser-side integration)

**Social Login Providers:**
- Google OAuth
  - Client ID: `GOOGLE_CLIENT_ID` environment variable
  - Client Secret: `GOOGLE_CLIENT_SECRET` environment variable
- Discord OAuth
  - Client ID: `DISCORD_CLIENT_ID` environment variable
  - Client Secret: `DISCORD_CLIENT_SECRET` environment variable

**Authentication Methods:**
- Email/Password - Native email registration and login
- OAuth - Google and Discord
- Username/Display Name - Custom profile via Better Auth username plugin

**Session Management:**
- Database-backed sessions (PostgreSQL)
- Session table: `session` with `token`, `userId`, `expiresAt`
- Cookie-based session tokens (checked via `getSessionCookie()` in middleware)
- Middleware: `src/proxy.ts` protects routes `/collection` and `/decks` with session check

**Authorization:**
- Route protection via middleware in `src/proxy.ts`
- Protected routes: `/collection/*`, `/decks/*` (require active session)

## Monitoring & Observability

**Error Tracking:**
- None (console.error used in code)

**Logs:**
- Console logging only
  - Error logs: `src/app/api/cron/sync-cards/route.ts`, `src/lib/sync/prices.ts`
  - Debug output: Cron job timing and sync results

**Web Vitals:**
- Vercel Speed Insights (performance only, not error tracking)

## CI/CD & Deployment

**Hosting:**
- Vercel (Next.js native platform)

**Cron Jobs:**
- Vercel Crons (`vercel.json`)
  - Job: `/api/cron/sync-cards`
  - Schedule: Daily at 06:00 UTC (`0 6 * * *`)
  - Authorization: `CRON_SECRET` header (Bearer token required)
  - Tasks:
    1. Sync card definitions and printings from SWU-DB
    2. Sync card prices (USD to EUR conversion)
    3. Invalidate cache tag `'cards'`

**CI Pipeline:**
- None detected (no GitHub Actions, Jenkins, etc.)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - Neon PostgreSQL connection string (mandatory)
- `CRON_SECRET` - Authorization token for Vercel cron endpoints (for daily sync)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `DISCORD_CLIENT_ID` - Discord OAuth app ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth app secret

**Optional env vars:**
- `NEXT_PUBLIC_APP_URL` - Base URL for auth redirect (defaults to request origin)
- `NODE_ENV` - Development/production (used for Speed Insights debug mode)
- `BETTER_AUTH_URL` - Override auth base URL (fallback after NEXT_PUBLIC_APP_URL)

**Secrets location:**
- Vercel Environment Variables dashboard (for production)
- `.env.local` file (for local development, not in git)

## Data Synchronization

**Card & Price Sync:**
- Source: SWU-DB API
- Frequency: Daily at 06:00 UTC (Vercel Cron)
- Endpoint: `GET /api/cron/sync-cards`
- Process:
  1. Fetch all active sets from SWU-DB
  2. For each set, fetch card definitions and upsert to `cardDefinitions` and `cardPrintings`
  3. Fetch current market prices and update `priceUsd` and `priceEur` columns
  4. Invalidate Next.js cache tag `'cards'`
- Execution: `src/lib/sync/upsert-cards.ts` and `src/lib/sync/prices.ts`
- Error handling: Catch and log errors, return 500 on failure

## Webhooks & Callbacks

**Incoming:**
- Cron webhook: `/api/cron/sync-cards` (triggered by Vercel Crons)

**Outgoing:**
- OAuth callbacks: Handled by Better Auth (Google, Discord redirects)

## Third-Party CDN

**Image CDN:**
- `cdn.swu-db.com` - Hosts card artwork images
- Currently serving unoptimized (Vercel Image Transformations quota exhausted as of 2026-06-04)
- Optimization settings: 75% quality, 31-day cache TTL

---

*Integration audit: 2026-07-05*
