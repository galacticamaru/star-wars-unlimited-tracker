# Stack Research — Star Wars: Unlimited Tracker

**Researched:** 2026-05-03
**Overall confidence:** HIGH (core choices), MEDIUM (SWU-specific API details)

---

## Recommended Stack

### Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.x (current stable) | Full-stack React framework | App Router with RSC enables fast server-rendered card browsing; API routes eliminate a separate backend service; single repo deployment aligns with the project constraint in PROJECT.md. Dominant ecosystem (State of JS 2024) means answers are abundant. |
| React | 19.x (bundled with Next.js 16) | UI runtime | Required by Next.js 16; React Server Components are the right model for a card catalog (static data, SSR-friendly). |
| TypeScript | 5.x (latest stable) | Type safety | Non-negotiable for a codebase with complex relational data (cards, decks, collection quantities). Catches ORM schema drift and API shape mismatches at compile time. |
| Tailwind CSS | 4.x | Utility-first styling | Best-in-class for card-dense UIs where spacing, grid, and responsive layout need fine control without custom class proliferation. Works natively with Next.js. |
| shadcn/ui | latest | Component primitives | Accessible, headless components (dialogs, comboboxes, tables) that match the card browsing and deck building UX patterns. Installed per-component so bundle stays lean. |
| TanStack Query | 5.x | Client-side data fetching | For deck builder interactivity (add/remove card without full page reload). Pairs with Next.js Server Actions for mutations. Not needed for server-rendered catalog pages. |

**Why Next.js over Remix:** PROJECT.md already specifies Next.js. Beyond that constraint: Next.js 16 has a larger support surface (Stack Overflow answers, Next.js-native auth libraries, Vercel integration), ISR/on-demand revalidation is the right model for a card catalog that updates only when new sets release, and the App Router's RSC model fits the read-heavy browsing pattern well.

---

### Backend / API

Next.js App Router with Server Actions and Route Handlers. No separate backend service.

| Pattern | Use | Rationale |
|---------|-----|-----------|
| Server Components | Card catalog pages, deck view, collection view | Zero client JS for read-only rendering; streaming HTML improves perceived load |
| Server Actions | Add card to collection, add card to deck, import CSV | Colocated mutations with type safety; no REST boilerplate |
| Route Handlers (`/app/api/`) | SWU API proxy/cache sync webhook, CSV export endpoint | For operations that need a clean HTTP interface (e.g., scheduled card data refresh) |

The card catalog sync (fetching from swu-db.com API and writing to local DB) should run as a background job or scheduled cron, not inline in a user request. On Railway this is a cron service; on Vercel this is a Vercel Cron job or triggered via webhook.

---

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16.x | Primary data store | Project constraint. Correct for the relational model: users own cards (quantity), cards belong to sets, decks reference cards with quantities, legality rules enforce constraints. |
| Neon Serverless Postgres | latest | Hosted PostgreSQL | Best match for a Next.js/Vercel deployment. Powers Vercel Postgres natively. Scale-to-zero on free tier means no idle cost while in development. Instant DB branching for feature preview environments. After Databricks acquisition (May 2025), pricing dropped significantly — 0.5 GB storage free, 100 CU-hours/month free. |
| Drizzle ORM | 0.45.x (stable) | Database access layer | SQL-like TypeScript schema, ~7.4 KB gzip bundle vs Prisma's ~1.6 MB. Critical for Vercel serverless/edge cold starts. Schemas defined in TypeScript — no separate `.prisma` file or code generation step. Instant type feedback in editor. Drizzle Kit handles migrations. |

**Why Drizzle over Prisma:** Bundle size is the decisive factor for a Vercel deployment. Prisma's ~1.6 MB bundle causes cold start penalty on every new serverless instance. Drizzle generates clean SQL, the schema maps directly to the relational model needed here (cards, sets, users, collection_entries, decks, deck_cards), and the query builder is SQL-close enough that complex joins (e.g., "all cards in this deck with my owned count") are straightforward.

**Why Neon over Supabase:** Supabase bundles auth, storage, and realtime — features this project provides through better-targeted tools (Better Auth, Next.js image optimization, no realtime needed). Paying for Supabase's platform to only use Postgres is wasteful. Neon is pure Postgres with better Vercel integration.

---

### Auth

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Better Auth | 1.6.x (current stable) | Authentication framework | Open source, MIT licensed, no vendor lock-in, no per-MAU pricing. Auth.js (NextAuth) is now officially maintained by the Better Auth team — Better Auth is their recommended path for new projects as of 2025. Native Next.js App Router support. Built-in credential auth, social OAuth (Google, GitHub), email verification, session management. Database adapter stores sessions in the same Neon Postgres instance — no second database or external session store needed. |

**Why Better Auth over Clerk:** Clerk is a hosted identity platform — user records and sessions live in Clerk's infrastructure, adding vendor dependency and per-MAU cost ($25/month past 10K MAUs). For a community app that could grow, this cost curve is undesirable. Better Auth stores everything in your own Postgres.

**Why Better Auth over Auth.js v5:** Auth.js v5 is in beta, and Better Auth is now the actively developed successor recommended by the Auth.js team itself. Better Auth has a cleaner plugin system, more built-in features (MFA, passkeys, API keys), and a stable 1.x release series.

---

### Card Data / External APIs

#### Primary: swu-db.com API

**Base URL:** `https://api.swu-db.com`

| Endpoint | Use |
|---------|-----|
| `GET /cards/{set}` | Bulk-fetch all cards for a set (runs on catalog sync job) |
| `GET /cards/{set}/{number}` | Fetch a single card by set code + collector number |
| `GET /cards/search?q=...` | Search cards by name, trait, aspect, cost, etc. |
| `GET /cards/{set}/{number}?format=image` | Redirects to card artwork (used for `<Image>` src) |
| `GET /catalog/traits`, `/catalog/keywords`, etc. | Populate filter dropdowns |

**Data formats supported:** JSON, CSV, plain text, image redirect.

**Authentication:** None documented. Public API.

**Rate limits:** Not documented. Treat as unknown — implement local caching to be safe.

**Image strategy:** The API returns an image redirect at `?format=image`. Do NOT proxy all card images through Next.js `/api/` — it would be slow and costly. Instead:
1. On catalog sync, store the canonical image URL (the swu-db.com image URL) in the local database per card.
2. Use Next.js `<Image>` component with `remotePatterns` configured to allow the swu-db.com image domain. Next.js will optimize/cache on first request.
3. Add `blurDataURL` placeholder for graceful loading in the deck builder card grid.

#### Local Card Cache (resilience strategy)

Because the catalog depends on a third-party API (PROJECT.md notes this as a constraint), maintain a local `cards` table in Postgres populated by a sync job. The app never calls swu-db.com in the critical path of a user request — only the sync job does. If the external API goes down, the app continues serving the cached catalog.

Sync triggers:
- Manual admin trigger via a protected Route Handler
- Scheduled cron (Vercel Cron or Railway cron) — run weekly or on-demand after new set announcements

#### Community Data Source (fallback / supplement)

`github.com/turlockmike/swu-database` — npm package `swu-database` with card data in YAML/TypeScript. Can be used to bootstrap the local database before the API sync is wired up, or as a fallback if swu-db.com has an outage. Confidence: MEDIUM (package existence confirmed, completeness and update cadence unverified).

---

### Deployment

| Technology | Purpose | Why |
|------------|---------|-----|
| Vercel | Next.js hosting | Zero-config Next.js deployment, automatic preview environments per PR, native Neon Postgres integration, Vercel Cron for card sync jobs, global CDN for static assets. Free hobby tier is sufficient for early validation. Pro plan ($20/seat/month) for production when the app has users. |
| Neon (via Vercel integration) | PostgreSQL hosting | See Database section. Vercel's native integration means database URL is auto-injected into preview and production environments. |

**Why Vercel over Railway for this project:** Railway is better value for long-running servers (persistent compute), but Next.js on Vercel is the canonical deployment target. Vercel handles preview deployments, edge caching, image optimization CDN, and cron jobs natively — all of which this app needs. The main cost risk (bandwidth overages) doesn't apply until significant traffic. Railway is the right answer if the project ever moves off Next.js or needs persistent background workers beyond cron.

---

### Dev Tooling

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| Drizzle Kit | 0.30.x (paired with drizzle-orm) | Migration generation and push | `drizzle-kit generate` + `drizzle-kit migrate` for schema evolution |
| ESLint | 9.x | Linting | Next.js 16 ships `eslint-config-next` by default |
| Prettier | 3.x | Code formatting | Standard formatter; integrates with ESLint |
| Vitest | 3.x | Unit/integration testing | Vite-native test runner, faster than Jest for a Next.js project using Turbopack; good for testing ORM queries and business logic (deck legality validation) |
| Playwright | 1.x | E2E testing | Browser-level testing for critical flows (auth, add to collection, build deck). First-class Next.js support. |

---

## Rejected Alternatives

| Category | Rejected | Recommended Instead | Reason |
|----------|---------|---------------------|--------|
| Framework | Remix | Next.js | PROJECT.md specifies Next.js; also larger ecosystem and better Vercel integration for ISR card catalog |
| ORM | Prisma | Drizzle | ~1.6 MB vs 7.4 KB bundle; serverless cold start penalty is real on Vercel; Drizzle's TypeScript-native schema is simpler |
| ORM | TypeORM | Drizzle | Legacy decorator-based API, poor TypeScript inference, not actively keeping pace with modern Next.js patterns |
| Auth | Clerk | Better Auth | Per-MAU pricing ($25/month past 10K users), vendor lock-in, user data leaves your infrastructure |
| Auth | Auth.js v5 (NextAuth) | Better Auth | Still in beta as of 2025; Better Auth is the actively developed successor recommended by the Auth.js team itself |
| Auth | Custom JWT | Better Auth | Weeks of implementation for session management, CSRF, token rotation — solved problems; not a differentiator |
| Database host | Supabase | Neon | Supabase bundles features (auth, realtime, storage) this project handles elsewhere; paying platform premium for features unused |
| Database host | Railway Postgres | Neon | Railway Postgres is good but lacks Vercel-native integration and DB branching for preview environments |
| Database host | PlanetScale | Neon (PostgreSQL) | PlanetScale is MySQL, not PostgreSQL; incompatible with project constraint |
| Styling | CSS Modules | Tailwind CSS | Card grid UI requires responsive, granular spacing control; Tailwind's utility classes are faster to iterate with than module files for UI-dense interfaces |
| Styling | Styled Components / Emotion | Tailwind CSS | CSS-in-JS has a runtime cost and hydration complexity in App Router RSC model; Tailwind is zero-runtime |
| Component library | MUI / Chakra | shadcn/ui | MUI/Chakra ship large bundles with opinionated design systems; shadcn/ui is copied-in and tree-shakeable, no design system lock-in |
| Deployment | Railway | Vercel | Vercel is the canonical Next.js host with preview deployments and native Neon integration; Railway is better for non-Next.js full-stack |
| Deployment | Self-hosted (Docker/VPS) | Vercel | Operational overhead is unjustified for a side project; Vercel free tier is sufficient to validate |
| Card data | Manual database seeding | swu-db.com API sync | New sets release regularly; manual entry doesn't scale and is error-prone |
| Card data | Official FFG API | swu-db.com API | No official FFG/AMG public card API exists as of research date |

---

## Confidence Levels

| Area | Confidence | Basis |
|------|------------|-------|
| Next.js 16 as framework | HIGH | Official Next.js blog, npm verified at 16.2.4 |
| Drizzle ORM | HIGH | npm verified at 0.45.x stable; Drizzle v1 beta exists but stable branch is production-ready; multiple benchmarks and community consensus |
| Neon for PostgreSQL hosting | HIGH | Official Neon pricing page verified; Vercel integration documented; post-Databricks acquisition pricing reductions confirmed |
| Better Auth | HIGH | npm verified at 1.6.9 stable; Auth.js team formally merged into Better Auth project, confirmed on better-auth.com blog |
| swu-db.com API | MEDIUM | Endpoints verified via official API docs at swu-db.com/api; rate limits and uptime SLA not documented — treat as a community resource without guarantees |
| Card image URL pattern | MEDIUM | Confirmed `?format=image` redirect exists; specific CDN domain for the redirect target not verified — configure `remotePatterns` broadly or inspect at implementation time |
| `swu-database` npm package as fallback | LOW | GitHub repo confirmed (turlockmike/swu-database); completeness and update cadence for recent sets not verified |
| Vercel Cron for card sync | HIGH | Vercel Cron Jobs documented as stable in Next.js 13+ App Router; use `vercel.json` cron configuration |
| TanStack Query v5 | HIGH | Official docs verified; v5 is stable and the current major version |

---

## Installation Reference

```bash
# Create Next.js project
npx create-next-app@latest star-wars-unlimited-tracker \
  --typescript --tailwind --app --src-dir --import-alias "@/*"

# ORM + database driver
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Auth
npm install better-auth

# UI components (shadcn - install per component)
npx shadcn@latest init

# Client-side data fetching (deck builder)
npm install @tanstack/react-query

# Dev tooling
npm install -D vitest @vitejs/plugin-react playwright
```

---

## Sources

- Next.js releases: https://nextjs.org/blog/next-15 and https://github.com/vercel/next.js/releases
- Drizzle ORM npm: https://www.npmjs.com/package/drizzle-orm
- Drizzle vs Prisma comparison: https://makerkit.dev/blog/tutorials/drizzle-vs-prisma
- Neon pricing: https://neon.com/pricing and https://neon.com/docs/introduction/plans
- Neon vs Supabase: https://www.bytebase.com/blog/neon-vs-supabase/
- Better Auth npm: https://www.npmjs.com/package/better-auth
- Better Auth + Auth.js merger: https://better-auth.com/blog/authjs-joins-better-auth
- Better Auth vs NextAuth vs Clerk: https://starterpick.com/blog/better-auth-clerk-nextauth-saas-showdown-2026
- swu-db.com API documentation: https://www.swu-db.com/api
- swu-database npm package: https://github.com/turlockmike/swu-database
- Vercel vs Railway: https://designrevision.com/blog/vercel-vs-railway
- Next.js Image optimization: https://nextjs.org/docs/app/getting-started/images
