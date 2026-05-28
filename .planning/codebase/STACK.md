---
focus: tech
last_updated: 2026-05-28
---
# Technology Stack

**Analysis Date:** 2026-05-28

## Languages

**Primary:**
- TypeScript 5.x — all application code (`src/`, `scripts/`, config files)

**Secondary:**
- CSS (Tailwind utility classes) — styling

## Runtime

**Environment:**
- Node.js 20.x (inferred from `@types/node: ^20`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.4 — full-stack React framework (App Router, API routes, server components)
- React 19.2.4 — UI rendering

**Testing:**
- Vitest 4.1.5 — test runner (`vitest.config.mts`, environment: node)
- @testing-library/react 16.3.2 — React component testing
- @testing-library/dom 10.4.1 — DOM utilities
- jsdom 29.1.1 — DOM environment for browser-like unit tests

**Build/Dev:**
- Tailwind CSS 4.x — utility-first CSS (v4 with `@tailwindcss/postcss`)
- ESLint 9 with `eslint-config-next` 16.2.4 — linting
- tsx 4.21.0 — TypeScript script runner (used for `scripts/seed.ts`)
- drizzle-kit 0.31.10 — database schema management and migration CLI

## Key Dependencies

**Critical:**
- `drizzle-orm` 0.45.2 — ORM for all database queries; `src/db/index.ts`, `src/db/queries/`
- `@neondatabase/serverless` 1.1.0 — Neon PostgreSQL client with WebSocket support; `src/db/index.ts`
- `better-auth` 1.6.9 — authentication framework (email/password + OAuth); `src/lib/auth.ts`, `src/lib/auth-client.ts`
- `ws` 8.20.0 — WebSocket polyfill required by Neon serverless driver in Node.js environments

**UI:**
- `@base-ui/react` 1.4.1 — unstyled accessible UI primitives
- `shadcn` 4.6.0 — component scaffolding tool
- `lucide-react` 1.14.0 — icon library
- `class-variance-authority` 0.7.1 — variant-based className builder
- `clsx` 2.1.1 — conditional className merging
- `tailwind-merge` 3.5.0 — Tailwind class deduplication
- `tw-animate-css` 1.4.0 — CSS animation utilities for Tailwind

**Utilities:**
- `nuqs` 2.8.9 — URL search parameter state management (type-safe)
- `@tanstack/react-virtual` 3.13.26 — virtualised list/grid rendering
- `papaparse` 5.5.3 — CSV parsing for collection import/export
- `@vercel/speed-insights` 2.0.0 — Vercel performance telemetry
- `dotenv` 17.4.2 — env var loading for standalone scripts

## Configuration

**Environment:**
- `.env.local` for local development (not committed)
- `.env.example` documents all required variables
- Required vars: `DATABASE_URL`, `CRON_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `POKEMON_API_KEY`

**Build:**
- `next.config.ts` — Next.js config; enables `cacheComponents`, configures remote image patterns for `cdn.swu-db.com`, sets `unoptimized: true` (Vercel quota workaround), `minimumCacheTTL: 2678400`
- `vitest.config.mts` — Vitest config (node environment, global APIs, vite-tsconfig-paths plugin)
- `vercel.json` — Vercel deployment config (daily cron at 06:00 UTC)

**Database CLI commands:**
```bash
npm run db:push       # Push schema to database without migration files
npm run db:generate   # Generate Drizzle migration files
npm run db:migrate    # Run pending migrations
npm run db:studio     # Open Drizzle Studio UI
npm run db:seed       # Seed database (scripts/seed.ts via tsx)
```

## Platform Requirements

**Development:**
- Node.js 20+
- `.env.local` with `DATABASE_URL` pointing to a Neon PostgreSQL instance

**Production:**
- Vercel hosting (inferred from `@vercel/speed-insights`, `vercel.json`, serverless driver usage)
- Neon PostgreSQL serverless database

---

*Stack analysis: 2026-05-28*
