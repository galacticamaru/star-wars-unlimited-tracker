# Technology Stack

**Analysis Date:** 2026-07-05

## Languages

**Primary:**
- TypeScript 5 - Full codebase, both frontend and backend

**Runtime Support:**
- JavaScript (via TypeScript compilation)

## Runtime

**Environment:**
- Node.js (version not explicitly specified in package.json; Next.js 16.2.4 requires Node 18.17+)

**Package Manager:**
- npm - Lockfile: package-lock.json (present)

## Frameworks

**Core:**
- Next.js 16.2.4 - Full-stack React framework with API routes, server components, caching
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering

**ORM & Database:**
- Drizzle ORM 0.45.2 - SQL query builder and ORM for PostgreSQL
- Drizzle Kit 0.31.10 - Database schema migration and management

**Authentication:**
- Better Auth 1.6.9 - Authentication framework with multi-provider support
  - Includes email/password and OAuth (Google, Discord)
  - Drizzle adapter for database integration
  - Username plugin for custom user profiles

**Testing:**
- Vitest 4.1.5 - Unit and integration testing framework
  - Configuration: `vitest.config.mts`
- Testing Library React 16.3.2 - React component testing utilities
- JSDOM 29.1.1 - DOM implementation for Node.js tests

**Build/Dev:**
- PostCSS 4 - CSS transformations via `postcss.config.mjs`
- Tailwind CSS 4 - Utility-first CSS framework

**Linting/Code Quality:**
- ESLint 9 - JavaScript linting (flat config in `eslint.config.mjs`)
- eslint-config-next 16.2.4 - Next.js specific ESLint rules

## Key Dependencies

**Critical:**
- @neondatabase/serverless 1.1.0 - Neon PostgreSQL serverless driver
- ws 8.20.0 - WebSocket client (required for Neon connections in Node.js)
- dotenv 17.4.2 - Environment variable loading

**UI & Styling:**
- @base-ui/react 1.4.1 - Unstyled, accessible React components
- shadcn 4.6.0 - Pre-built component library
- Lucide React 1.14.0 - Icon library
- class-variance-authority 0.7.1 - Type-safe CSS class composition
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.5.0 - Tailwind class conflict resolver
- tw-animate-css 1.4.0 - Tailwind animation utilities

**Data & Performance:**
- @tanstack/react-virtual 3.13.26 - Virtual scrolling for large lists
- papaparse 5.5.3 - CSV parsing for collection import
- nuqs 2.8.9 - URL state management for React

**Monitoring:**
- @vercel/speed-insights 2.0.0 - Vercel Web Vitals analytics

**Type Definitions:**
- @types/node 20 - Node.js type definitions
- @types/react 19 - React type definitions
- @types/react-dom 19 - React DOM type definitions
- @types/papaparse 5.5.2 - PapaParse type definitions
- @types/ws 8.18.1 - WebSocket type definitions

**Development:**
- @vitejs/plugin-react 6.0.1 - Vite React plugin (for Vitest)
- vite-tsconfig-paths 6.1.1 - TypeScript path alias support in Vite
- tsx 4.21.0 - TypeScript executor (for running scripts)
- @testing-library/dom 10.4.1 - DOM testing utilities

## Configuration

**Environment:**
- Database URL: `DATABASE_URL` (required, points to Neon PostgreSQL)
- Authentication: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
- Cron: `CRON_SECRET` (authorization token for Vercel cron jobs)
- App URL: `NEXT_PUBLIC_APP_URL` (optional, public base URL)

**Compiler:**
- TypeScript config: `tsconfig.json` (ES2017 target, strict mode enabled, path aliases)
  - Path alias: `@/*` → `./src/*`

**Build:**
- Next.js config: `next.config.ts`
  - Image optimization from `cdn.swu-db.com` (external CDN)
  - Currently unoptimized due to Vercel Image Transformations quota exhausted (TODO-2026-06-04)
  - Cache components enabled

**Linting:**
- ESLint: `eslint.config.mjs` (flat config with Next.js core web vitals + TypeScript rules)

**Testing:**
- Vitest config: `vitest.config.mts` (Node environment, global test APIs, React plugin, tsconfig paths)

**PostCSS:**
- Config: `postcss.config.mjs` (Tailwind CSS v4 plugin)

## Platform Requirements

**Development:**
- Node.js 18.17+ (required by Next.js 16)
- npm (or compatible package manager)
- PostgreSQL client libraries (included via @neondatabase/serverless)

**Production:**
- Deployment: Vercel (native Next.js hosting)
- Database: Neon PostgreSQL Serverless
- Cron jobs: Vercel Crons (configured in `vercel.json`)
  - Daily sync job at 06:00 UTC

---

*Stack analysis: 2026-07-05*
