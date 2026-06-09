# Star Wars Unlimited Tracker

A web app for Star Wars: Unlimited TCG players to track their card collection, build legal decks, and manage public trade binders — all in one place.

**v5 shipped 2026-05-27** · [Project docs](.planning/PROJECT.md)

## Features

- **Card Catalog** — Browse, search, and filter the full SWU card catalog with images, metadata, and variant art. Auto-syncs from swu-db.com daily.
- **Collection Tracking** — Track owned copies per card and per variant (Normal, Foil, Showcase, Hyperspace, Serialized). Bulk-import via CSV.
- **Deck Builder** — Build legal decks (1 Leader + 1 Base + 50-card main + 10-card sideboard) with owned-count overlay and shortfall highlights.
- **Want List** — Per-deck and combined want lists showing exactly which cards and quantities you're missing.
- **Trade Binder** — Public shareable binder at `/binder/[username]` with "Available for Trade" and "Looking For" sections, variant badges, and catalog filters.
- **Market Pricing** — EUR/USD card prices and deck valuations via PokéWallet API.
- **Auth** — Email, Google, and Discord sign-in via Better Auth, with per-user data isolation.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| UI | shadcn/ui + Base UI + Tailwind CSS v4 |
| URL state | nuqs |
| Testing | Vitest + Testing Library |
| Deployment | Vercel (Hobby tier) |

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- Better Auth credentials (see `.env.local` below)

### Environment

Create `.env.local` at the project root:

```env
DATABASE_URL=your_neon_connection_string
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

### Install and run

```bash
npm install
npm run db:push      # push schema to database
npm run db:seed      # seed card data (optional, cron handles this in production)
npm run dev          # start dev server at http://localhost:3000
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed card data from swu-db.com |

## Routes

| Route | Description |
|---|---|
| `/` | Home page with hero and highest-value cards |
| `/cards` | Full card catalog with filters |
| `/cards/[set-code]/[card-number]` | Card detail with variant tracking and trade section |
| `/collection` | Manage owned card counts |
| `/decks` | Deck list |
| `/decks/[id]` | Deck builder |
| `/binder/[username]` | Public trade binder |
| `/binder/manage` | Manage your trade offerings and wants |
| `/(auth)/login` | Sign in |

## Architecture Notes

- **Two-table card model** — `card_definitions` (identity) + `card_printings` (variants/sets) keeps card identity separate from print variants, enabling per-variant collection and trade tracking.
- **integer cents for prices** — avoids floating point issues in currency math.
- **nuqs for all filter state** — snappy filters, shareable URLs, no `useState` proliferation.
- **Vercel daily cron** — multiplexes card sync and price sync into one job (Hobby tier limit).
- **No `@radix-ui` imports** — Base UI (`@base-ui/react`) only for headless primitives.
