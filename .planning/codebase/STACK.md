# Technology Stack

**Analysis Date:** 2025-05-24

## Languages

**Primary:**
- TypeScript 5.x - Entire codebase (Next.js components, API routes, scripts, database schema)

**Secondary:**
- SQL - Database migrations and complex queries (via Drizzle ORM)
- CSS - Global styles and Tailwind 4 configuration

## Runtime

**Environment:**
- Node.js (Vercel Runtime)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.4 - Full-stack React framework
- React 19.2.4 - UI library

**Testing:**
- Vitest 4.1.5 - Test runner
- React Testing Library 16.3.2 - UI component testing

**Build/Dev:**
- Vite (underlying Vitest)
- Tailwind CSS 4 - Utility-first CSS framework
- PostCSS 4 - CSS transformation
- ESLint 9 - Linting

## Key Dependencies

**Critical:**
- Drizzle ORM 0.45.2 - Type-safe database access
- Better Auth 1.6.9 - Authentication framework
- Lucide React 1.14.0 - Icon set
- shadcn/ui 4.6.0 - Component library

**Infrastructure:**
- @neondatabase/serverless 1.1.0 - Neon Postgres driver
- ws 8.20.0 - WebSocket support for Neon in serverless

## Configuration

**Environment:**
- `.env.local` for local development
- Vercel Environment Variables for production
- Key configs: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `DISCORD_CLIENT_ID`

**Build:**
- `next.config.ts`: Image domains, unoptimized flag
- `tsconfig.json`: TypeScript paths and target
- `drizzle.config.ts`: Database schema and migration settings
- `postcss.config.mjs`: CSS processing

## Platform Requirements

**Development:**
- Node.js (implied by Next.js version)
- Local Postgres or Neon account

**Production:**
- Vercel (Next.js deployment)
- Neon (Postgres database)

---

*Stack analysis: 2025-05-24*
