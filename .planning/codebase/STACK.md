# Technology Stack

**Analysis Date:** 2026-05-08

## Languages

**Primary:**
- TypeScript 5.x - All application code, server and client
- TSX - React component files throughout `src/components/` and `src/app/`

**Secondary:**
- SQL - Schema migrations in `drizzle/0000_handy_trish_tilby.sql`

## Runtime

**Environment:**
- Node.js 20.x (specified via `@types/node: ^20` in `package.json`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.4 - Full-stack React framework; App Router with RSC (React Server Components); configured in `next.config.ts`
- React 19.2.4 - UI rendering, both server and client components

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS; configured via `postcss.config.mjs` using `@tailwindcss/postcss`
- `tw-animate-css` 1.4.0 - Animation utilities for Tailwind
- `tailwind-merge` 3.5.0 - Conditional class merging; used via `src/lib/utils.ts`
- `class-variance-authority` 0.7.1 - Variant-based component styling (e.g., `src/components/ui/button.tsx`)

**UI Components:**
- shadcn 4.6.0 - Component scaffolding CLI; config at `components.json`; base style `base-nova`, icon library `lucide`
- `@base-ui/react` 1.4.1 - Low-level accessible UI primitives backing shadcn components
- `lucide-react` 1.14.0 - Icon library (e.g., `ChevronLeft` in card detail page)

**URL State:**
- `nuqs` 2.8.9 - Type-safe URL search parameter management; adapter mounted in `src/app/layout.tsx` (`NuqsAdapter`)

**CSV Parsing:**
- `papaparse` 5.5.3 - Client-side CSV parsing for Reddit collection spreadsheet import

**ORM / Database:**
- `drizzle-orm` 0.45.2 - Type-safe SQL ORM; schema at `src/db/schema.ts`; queries in `src/db/queries/`
- `drizzle-kit` 0.31.10 - CLI for schema push, generate, migrate, studio; config at `drizzle.config.ts`

**Testing:**
- `vitest` 4.1.5 - Test runner; config at `vitest.config.mts`
- `@testing-library/react` 16.3.2 - React component testing
- `@testing-library/dom` 10.4.1 - DOM testing utilities
- `jsdom` 29.1.1 - DOM environment for tests

**Build/Dev:**
- `tsx` 4.21.0 - TypeScript execution for scripts (e.g., `scripts/seed.ts`)
- `@vitejs/plugin-react` 6.0.1 - React plugin for Vite (used by Vitest)
- `vite-tsconfig-paths` 6.1.1 - Resolves TypeScript path aliases in Vitest
- `eslint` 9.x with `eslint-config-next` 16.2.4 - Linting; config at `eslint.config.mjs`

## Key Dependencies

**Critical:**
- `@neondatabase/serverless` 1.1.0 - Neon PostgreSQL serverless driver; used in `src/db/index.ts` with WebSocket transport
- `ws` 8.20.0 - WebSocket implementation; required by Neon serverless driver in Node.js environments (`neonConfig.webSocketConstructor = ws`)
- `@types/ws` 8.18.1 - Type definitions for `ws`
- `dotenv` 17.4.2 - Environment variable loading; used in `drizzle.config.ts` and seed scripts

**Infrastructure:**
- `drizzle-orm/neon-serverless` - Drizzle adapter for Neon's serverless pooled connections

## Configuration

**Environment:**
- `.env.local` - Local development (not committed); required vars: `DATABASE_URL`, `CRON_SECRET`
- `.env.example` - Committed template showing required variable names and format
- Variables loaded automatically by Next.js for app code; loaded via `dotenv` for CLI scripts

**Required environment variables:**
- `DATABASE_URL` - Neon PostgreSQL connection string (pooled); format: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`
- `CRON_SECRET` - 32-char hex secret for authenticating Vercel Cron requests to `/api/cron/sync-cards`

**Build:**
- `tsconfig.json` - TypeScript strict mode, `bundler` module resolution, path alias `@/*` → `src/*`, target ES2017
- `next.config.ts` - Image remote patterns (CDN: `cdn.swu-db.com`); image optimization currently disabled (`unoptimized: true`) due to Vercel quota exhaustion
- `postcss.config.mjs` - Tailwind CSS PostCSS plugin
- `drizzle.config.ts` - ORM config; dialect `postgresql`; schema `src/db/schema.ts`; output `drizzle/`

## Platform Requirements

**Development:**
- Node.js 20+
- npm
- `.env.local` with `DATABASE_URL` and `CRON_SECRET`
- Run `npm run db:push` to sync schema, `npm run db:seed` to seed card data

**Production:**
- Vercel (serverless deployment)
- Vercel Cron for daily card sync (scheduled 06:00 UTC, configured in `vercel.json`)
- Neon PostgreSQL serverless database

---

*Stack analysis: 2026-05-08*
