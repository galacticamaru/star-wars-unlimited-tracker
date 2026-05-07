# Phase 1: Foundation - Research

**Researched:** 2026-05-03
**Domain:** Next.js 16 App Router + Drizzle ORM + Neon PostgreSQL + swu-db.com API + Vercel Cron
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Capture full game data in Phase 1 — do not defer fields to later phases.
- **D-02:** `card_definitions` holds game identity: name, subtitle, type, aspects, arena, traits, keywords, cost, power, HP, card text, unique flag, and the card's canonical identifier from swu-db.com.
- **D-03:** `card_printings` holds physical variant data: collector number (e.g. `SOR-001`), set code, rarity, image URL, and a foreign key to `card_definitions`.
- **D-04:** Owned count lives on `card_definitions` (future `user_collections` table). Variant tracking is v2 scope.
- **D-05:** Token cards are filtered by T-prefixed collector numbers (e.g., `SOR-T001`). Exclude all T-prefixed cards from every catalog/deck-builder query.
- **D-06:** Use Neon for both local dev and production. No Docker. The plan must include step-by-step Neon account and project setup.
- **D-07:** First-time population via `npm run db:seed` — fetches all card sets and cards, upserts into DB.
- **D-08:** Cron job does NOT handle first-time seeding — only ongoing upserts.
- **D-09:** Full upsert every sync run — INSERT ... ON CONFLICT DO UPDATE. No incremental tracking needed.
- **D-10:** Cron frequency: daily. Stays within Vercel free tier cron limits.
- **D-11:** User is new to both Neon and Vercel. Plan must include explicit step-by-step setup guidance.

### Claude's Discretion

- Next.js file structure follows App Router conventions (no prescriptive layout imposed by user)
- Drizzle ORM migration strategy (standard `drizzle-kit push` for dev, `drizzle-kit migrate` for prod)
- Vercel Cron schedule syntax and configuration in `vercel.json`
- swu-db.com API endpoint discovery and field mapping

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CATALOG-04 | Card catalog automatically syncs new card sets from the swu-db.com API without manual intervention | Covered by: Vercel Cron daily sync job calling `/api/cron/sync-cards`, shared upsert function, full `GET /Cards/{Set}` + `/sets` API usage |
</phase_requirements>

---

## Summary

Phase 1 is a pure infrastructure phase: scaffold Next.js 16, stand up Neon PostgreSQL with Drizzle ORM, seed the card catalog from swu-db.com, and wire up a Vercel Cron job for daily re-sync. No UI is built.

The swu-db.com API is a simple, unauthenticated REST API with no documented rate limits. The sync strategy is: call `GET /sets` to enumerate all sets, then call `GET /Cards/{setId}` per set to fetch card data. Token sets are identifiable by a T-prefixed setId (e.g., `TSOR`), which is the correct filter mechanism — token cards live in separate token sets, not as T-prefixed numbers within regular sets. The collector number field is a plain numeric string like `"059"`; the compound collector number used in the app (e.g., `SOR-059`) must be constructed by joining `Set + "-" + Number`.

Drizzle ORM with the `neon-http` driver is the correct choice for Next.js on Vercel (serverless). `drizzle-kit push` is used for local dev (fast iteration, no migration files); `drizzle-kit generate` + `drizzle-kit migrate` is used for production schema changes. The seed script and cron sync handler share a single `upsertCards()` function — the seed script calls it directly, the cron route handler calls it after verifying `CRON_SECRET`.

**Primary recommendation:** Build the shared `upsertCards(setId, cards)` function first, test it against the dev Neon database, then wire the seed script and the cron route to call it. This is the critical path for CATALOG-04.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Card catalog sync | API / Backend (Cron Route) | — | External API call + DB write; must not be in user request path |
| Database schema | Database / Storage | — | Drizzle schema defines all tables |
| Seed script | Build / CLI Script | — | One-time run, not a request handler |
| Environment config | API / Backend | — | `.env.local` / Vercel env vars for DATABASE_URL, CRON_SECRET |
| Token filtering | API / Backend | — | SQL WHERE clause on collector number; enforced in all queries |
| Next.js scaffold | Frontend Server (SSR) | — | App Router project structure, layout, root page |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.4 | App Router framework | Project decision; latest stable [VERIFIED: npm registry] |
| drizzle-orm | 0.45.2 | Type-safe ORM for PostgreSQL | Project decision; pairs with Neon [VERIFIED: npm registry] |
| @neondatabase/serverless | 1.1.0 | Neon HTTP driver for serverless | Required for Neon on Vercel (no TCP) [VERIFIED: npm registry] |
| drizzle-kit | 0.31.10 | Migrations, push, studio CLI | Official Drizzle toolkit [VERIFIED: npm registry] |
| dotenv | latest | Load `.env.local` for scripts | Required for seed script and drizzle.config.ts [ASSUMED] |

### Supporting (Dev/Test)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.5 | Test runner | Project decision; Phase 1 uses for upsert logic tests [VERIFIED: npm registry] |
| @vitejs/plugin-react | latest | Vitest React support | Required by official Next.js Vitest setup [CITED: nextjs.org/docs] |
| jsdom | latest | DOM environment for Vitest | Recommended environment per official docs [CITED: nextjs.org/docs] |
| vite-tsconfig-paths | latest | Resolve `@/` imports in Vitest | Required for `@/*` alias to work in tests [CITED: nextjs.org/docs] |
| @testing-library/react | latest | Component testing utilities | Standard companion to Vitest [CITED: nextjs.org/docs] |
| tsx | latest | TypeScript runner for seed script | Allows `npx tsx src/scripts/seed.ts` without compilation step [ASSUMED] |

### Installation

```bash
# Core runtime
npm install next@latest react@latest react-dom@latest
npm install drizzle-orm @neondatabase/serverless dotenv

# Drizzle tooling
npm install -D drizzle-kit tsx

# Testing
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

**Version verification:** Versions above confirmed via `npm view [package] version` on 2026-05-03. [VERIFIED: npm registry]

---

## swu-db.com API

### Endpoints Used for Phase 1

| Endpoint | Purpose | Response Shape |
|----------|---------|----------------|
| `GET https://api.swu-db.com/sets` | List all sets | Array of set objects |
| `GET https://api.swu-db.com/cards/{setId}` | All cards in a set | `{ total_cards: N, data: Card[] }` |

No API key or authentication is required. No rate limits are documented. [VERIFIED: api.swu-db.com/api, api.swu-db.com/sets, api.swu-db.com/cards/sor]

### Set Object Shape

```typescript
// Source: api.swu-db.com/sets — verified 2026-05-03
interface SWUSet {
  setId: string;        // e.g., "SOR", "SHD", "TSOR"
  fullName: string;     // e.g., "Spark of Rebellion"
  numberCards: number;  // total cards in set
  maxElement: string;   // highest card number/identifier
  releaseDate?: string; // M/D/YY format, optional
  parentSetId?: string; // links token/promo sets to parent
}
```

**Current sets (36 total as of 2026-05-03):** SOR, SHD, JTL, TWI, SEC, ASH, LOF, LAW plus promo, OP, and token variants. [VERIFIED: api.swu-db.com/sets]

### Card Object Shape

```typescript
// Source: api.swu-db.com/cards/sor — verified 2026-05-03
interface SWUCard {
  Set: string;           // e.g., "SOR"
  Number: string;        // e.g., "059" (numeric string, no prefix)
  Name: string;
  Subtitle?: string;     // present on leaders and some units
  Type: string;          // "Unit" | "Leader" | "Event" | "Upgrade" | "Base" | "Token Unit" | "Token Upgrade"
  Aspects?: string[];    // e.g., ["Vigilance", "Villainy"]
  Traits?: string[];     // e.g., ["DROID", "IMPERIAL"]
  Arenas?: string[];     // ["Ground"] | ["Space"] | absent for non-units
  Keywords?: string[];   // ability keyword names
  Cost?: string;         // numeric string
  Power?: string;        // numeric string
  HP?: string;           // numeric string
  FrontText?: string;    // card ability text
  BackText?: string;     // leader back text (DoubleSided: true)
  EpicAction?: string;   // leader epic action text
  DoubleSided: boolean;
  Rarity: string;        // "Common" | "Uncommon" | "Rare" | "Legendary" | "Special"
  Unique: boolean;
  Artist?: string;
  VariantType: string;   // "Normal" | "Foil" | "Hyperspace" | "Hyperspace Foil" | "Showcase"
  FrontArt?: string;     // CDN URL: https://cdn.swu-db.com/images/cards/SOR/059.png
  BackArt?: string;      // leader back art URL (e.g., SOR/015-b.png)
  MarketPrice?: string;  // monetary string; omit from DB
  FoilPrice?: string;    // omit from DB
  LowPrice?: string;     // omit from DB
  LowFoilPrice?: string; // omit from DB
}
```

**Critical finding — Token detection:** [VERIFIED: api.swu-db.com/cards/search?q=type:token]

Token cards do NOT live in regular sets with T-prefixed card numbers. They live in **separate token sets** with T-prefixed set IDs (e.g., `TSOR` = "Spark of Rebellion - Tokens"). The CONTEXT.md decision D-05 describes filtering by "T-prefixed collector numbers" — this should be interpreted as: **skip all sets where `setId` starts with "T"** during sync, OR filter by `Type` containing "Token" in the card data. The Type field for token cards is `"Token Unit"` or `"Token Upgrade"`.

Recommended filter strategy: when iterating sets, skip sets where `setId.startsWith("T")` (these are token sets). This is simpler and avoids storing tokens in the first place.

**Collector number construction:** The API returns `Set = "SOR"` and `Number = "059"` as separate fields. The compound collector number `"SOR-059"` must be constructed as `${Set}-${Number}`. This is the value to store in `card_printings.collector_number`. [VERIFIED: api.swu-db.com/cards/sor]

**Variant cards:** Foil variants have number suffixes like `"059F"`. Hyperspace variants use higher numbers (e.g., `"281"` for a Hyperspace Boba Fett in SOR). These are different `Number` values within the same set — they are separate rows in `card_printings` referencing the same `card_definitions` row.

**Image CDN:** Card images are served from `https://cdn.swu-db.com/images/cards/{Set}/{Number}.png`. This CDN hostname must be added to Next.js `next.config.ts` `remotePatterns` in Phase 2 (catalog UI), not Phase 1.

---

## Architecture Patterns

### System Architecture Diagram

```
[swu-db.com API]
     |
     | GET /sets → iterate non-T sets
     | GET /Cards/{setId} per set
     v
[upsertCards() — shared function]
     |
     | INSERT ... ON CONFLICT DO UPDATE
     v
[Neon PostgreSQL]
  card_definitions (game identity)
  card_printings   (physical variant, FK → card_definitions)
     ^                   ^
     |                   |
[npm run db:seed]   [GET /api/cron/sync-cards]
(one-time, local)   (daily, Vercel Cron via vercel.json)
                         |
                    [CRON_SECRET check]
                    (Authorization: Bearer <secret>)
```

### Recommended Project Structure

```
star-wars-unlimited-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # root layout
│   │   ├── page.tsx            # placeholder home page
│   │   └── api/
│   │       └── cron/
│   │           └── sync-cards/
│   │               └── route.ts  # GET handler, checks CRON_SECRET
│   ├── db/
│   │   ├── index.ts            # drizzle client (neon-http)
│   │   └── schema.ts           # card_definitions + card_printings tables
│   └── lib/
│       └── sync/
│           └── upsert-cards.ts # shared upsert logic (seed + cron both call this)
├── scripts/
│   └── seed.ts                 # npm run db:seed entry point
├── __tests__/
│   └── upsert-cards.test.ts    # unit tests for upsert logic
├── drizzle/                    # migration files (generated by drizzle-kit)
├── drizzle.config.ts
├── vitest.config.mts
├── vercel.json
├── .env.local                  # DATABASE_URL, CRON_SECRET (not committed)
└── next.config.ts
```

### Pattern 1: Drizzle Client Initialization (Neon HTTP)

```typescript
// src/db/index.ts
// Source: orm.drizzle.team/docs/get-started/neon-new
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });
```

Use `neon-http` (not `neon-serverless` WebSocket variant) for Next.js on Vercel. The HTTP driver is faster for single-transaction serverless queries and does not require WebSocket setup. [CITED: orm.drizzle.team/docs/connect-neon]

### Pattern 2: Drizzle Schema Definition

```typescript
// src/db/schema.ts
// Source: orm.drizzle.team/docs/column-types/pg + indexes-constraints
import {
  pgTable, serial, text, boolean, integer, timestamp, unique
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const cardDefinitions = pgTable('card_definitions', {
  id: serial('id').primaryKey(),
  swudbId: text('swudb_id').notNull().unique(), // "{Set}-{Number}" from first canonical printing
  name: text('name').notNull(),
  subtitle: text('subtitle'),
  type: text('type').notNull(),
  aspects: text('aspects').array().notNull().default(sql`'{}'::text[]`),
  arenas: text('arenas').array().notNull().default(sql`'{}'::text[]`),
  traits: text('traits').array().notNull().default(sql`'{}'::text[]`),
  keywords: text('keywords').array().notNull().default(sql`'{}'::text[]`),
  cost: integer('cost'),
  power: integer('power'),
  hp: integer('hp'),
  frontText: text('front_text'),
  backText: text('back_text'),
  epicAction: text('epic_action'),
  doubleSided: boolean('double_sided').notNull().default(false),
  unique: boolean('unique').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cardPrintings = pgTable('card_printings', {
  id: serial('id').primaryKey(),
  cardDefinitionId: integer('card_definition_id')
    .notNull()
    .references(() => cardDefinitions.id),
  setCode: text('set_code').notNull(),           // e.g., "SOR"
  collectorNumber: text('collector_number').notNull(), // e.g., "SOR-059"
  rarity: text('rarity').notNull(),
  variantType: text('variant_type').notNull(),   // "Normal" | "Foil" | "Hyperspace" etc.
  frontArtUrl: text('front_art_url'),
  backArtUrl: text('back_art_url'),
  artist: text('artist'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  unique().on(t.setCode, t.collectorNumber), // composite unique: one row per printing
]);
```

### Pattern 3: Bulk Upsert with Drizzle

```typescript
// src/lib/sync/upsert-cards.ts — shared by seed script and cron handler
// Source: orm.drizzle.team/docs/guides/upsert
import { db } from '@/db';
import { cardDefinitions, cardPrintings } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function upsertCards(setId: string, cards: SWUCard[]) {
  // Skip token sets
  if (setId.startsWith('T')) return;

  for (const card of cards) {
    // Skip token card types as a secondary filter
    if (card.Type.toLowerCase().includes('token')) continue;

    const collectorNumber = `${card.Set}-${card.Number}`;

    // 1. Upsert card_definitions (keyed on swudb_id = collectorNumber of Normal variant)
    //    For variants (Foil, Hyperspace), we match on Name+Subtitle to find the definition
    const [def] = await db
      .insert(cardDefinitions)
      .values({
        swudbId: collectorNumber,
        name: card.Name,
        subtitle: card.Subtitle ?? null,
        // ... map all fields
      })
      .onConflictDoUpdate({
        target: cardDefinitions.swudbId,
        set: {
          name: sql`excluded.name`,
          frontText: sql`excluded.front_text`,
          updatedAt: new Date(),
          // ... update all mutable fields
        },
      })
      .returning({ id: cardDefinitions.id });

    // 2. Upsert card_printings (keyed on setCode + collectorNumber)
    await db
      .insert(cardPrintings)
      .values({
        cardDefinitionId: def.id,
        setCode: card.Set,
        collectorNumber,
        rarity: card.Rarity,
        variantType: card.VariantType,
        frontArtUrl: card.FrontArt ?? null,
        backArtUrl: card.BackArt ?? null,
        artist: card.Artist ?? null,
      })
      .onConflictDoUpdate({
        target: [cardPrintings.setCode, cardPrintings.collectorNumber],
        set: {
          rarity: sql`excluded.rarity`,
          variantType: sql`excluded.variant_type`,
          frontArtUrl: sql`excluded.front_art_url`,
          updatedAt: new Date(),
        },
      });
  }
}
```

**Design note on card_definitions identity:** The `swudb_id` field is used as the upsert key for `card_definitions`. For a card like Boba Fett that has multiple printings (Normal SOR-179, Hyperspace SOR-281), the `swudb_id` should be the Normal printing collector number. All other variant printings point to the same `card_definitions` row. The upsert strategy must handle variants (Foil/Hyperspace cards) by looking up existing definitions by name+subtitle rather than creating duplicate rows. See Open Questions section for the recommended approach.

### Pattern 4: Vercel Cron Route Handler

```typescript
// src/app/api/cron/sync-cards/route.ts
// Source: vercel.com/docs/cron-jobs/manage-cron-jobs — verified 2026-05-03
import type { NextRequest } from 'next/server';
import { syncAllCards } from '@/lib/sync/upsert-cards';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await syncAllCards();
    return Response.json({ success: true, ...result });
  } catch (error) {
    console.error('Card sync failed:', error);
    return new Response('Sync failed', { status: 500 });
  }
}
```

```json
// vercel.json — Source: vercel.com/docs/cron-jobs/quickstart — verified 2026-05-03
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/sync-cards",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### Pattern 5: Seed Script

```typescript
// scripts/seed.ts — run via: npm run db:seed
// Uses tsx for direct TS execution without compilation
import { config } from 'dotenv';
config({ path: '.env.local' });

import { syncAllCards } from '../src/lib/sync/upsert-cards';

async function seed() {
  console.log('Starting seed...');
  const result = await syncAllCards();
  console.log('Seed complete:', result);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

```json
// package.json scripts addition
{
  "scripts": {
    "db:seed": "tsx scripts/seed.ts",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Pattern 6: drizzle.config.ts

```typescript
// drizzle.config.ts — Source: orm.drizzle.team/docs/get-started/neon-new
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Note:** `dotenv/config` must be imported before `DATABASE_URL` is read. When running `drizzle-kit push` locally, it reads `.env.local`. However, `drizzle-kit` reads `.env` by default, not `.env.local`. Use `dotenv` with explicit path OR rename to `.env` for local development. The seed script uses `config({ path: '.env.local' })` explicitly.

### Anti-Patterns to Avoid

- **Using WebSocket driver (`neon-serverless`) on Vercel:** Requires `ws` package and WebSocket proxy setup. The HTTP driver (`drizzle-orm/neon-http`) works natively in serverless environments. [CITED: orm.drizzle.team/docs/connect-neon]
- **Calling swu-db.com in API routes that serve user requests:** The cron job is the only caller. User-facing routes query the local Neon DB exclusively.
- **Storing token cards in card_definitions:** Token sets (setId starts with "T") must be skipped during sync — tokens are not deck-buildable cards.
- **Duplicating upsert logic:** The seed script and cron handler MUST share the same `upsertCards()` function. Copy-paste leads to schema drift bugs.
- **Hardcoding CRON_SECRET in source:** Generate with `openssl rand -hex 32`, store in `.env.local` and Vercel project env vars. [CITED: vercel.com/docs/cron-jobs/manage-cron-jobs]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type-safe SQL queries | Custom query builder | drizzle-orm | Type inference, null safety, migration tracking |
| Database migrations | Manual ALTER TABLE scripts | `drizzle-kit generate` + `migrate` | Version-controlled, repeatable |
| Upsert conflict handling | Manual SELECT → INSERT/UPDATE | `onConflictDoUpdate()` | Atomic, handles race conditions |
| Env var loading in scripts | Manual `fs.readFileSync('.env')` | `dotenv` | Standard, handles quoting/escaping |
| Cron job scheduling | External cron service | Vercel Cron in `vercel.json` | Free tier supports daily, zero infra |

**Key insight:** The `onConflictDoUpdate()` pattern with `sql\`excluded.column\`` is the correct atomic upsert in PostgreSQL — a SELECT-then-INSERT pattern has TOCTOU race conditions and is always wrong for concurrent upsert scenarios. [CITED: orm.drizzle.team/docs/guides/upsert]

---

## Common Pitfalls

### Pitfall 1: drizzle-kit push reads `.env`, not `.env.local`

**What goes wrong:** `drizzle-kit push` fails with "DATABASE_URL is not defined" even though `.env.local` exists.
**Why it happens:** drizzle-kit loads `.env` by default. Next.js loads `.env.local`, but `drizzle-kit` is a separate CLI tool.
**How to avoid:** In `drizzle.config.ts`, use `import 'dotenv/config'` which reads `.env`. Keep a `.env` file (or symlink) for local drizzle-kit usage, OR add `--env-file=.env.local` to the drizzle-kit commands.
**Warning signs:** Error message includes "process.env.DATABASE_URL is undefined" when running `npm run db:push`.

### Pitfall 2: Token sets included in sync

**What goes wrong:** Token cards (Type: "Token Unit", "Token Upgrade") end up in `card_definitions` and appear in catalog queries.
**Why it happens:** If the sync loop iterates ALL sets from `/sets`, it will also fetch `TSOR`, `TSHD`, etc.
**How to avoid:** In the `syncAllCards()` function, filter out sets where `setId.startsWith('T')` before calling `GET /Cards/{setId}`. Secondary filter: skip any card where `card.Type.toLowerCase().includes('token')`.
**Warning signs:** Card count in DB exceeds expected ~1,000 non-token cards; catalog shows cards like "Experience" and "Shield".

### Pitfall 3: Variant cards creating duplicate card_definitions rows

**What goes wrong:** Boba Fett Normal (`SOR-179`) and Boba Fett Hyperspace (`SOR-281`) create two separate `card_definitions` rows, but they represent the same card.
**Why it happens:** Using the collector number as `swudb_id` for all variants will create separate rows for each variant printing.
**How to avoid:** Define `swudb_id` as `{Set}-{NormalNumber}` — only Normal (`VariantType === "Normal"`) printings anchor the `card_definitions` row. For Foil/Hyperspace variants, look up the existing `card_definitions` row by `name + subtitle + set` before inserting the `card_printings` row. See Open Questions Q-1 for the recommended approach.
**Warning signs:** More `card_definitions` rows than unique card names (accounting for same-name different-subtitle cards).

### Pitfall 4: Missing CRON_SECRET causes open sync endpoint

**What goes wrong:** The `/api/cron/sync-cards` route is publicly accessible — anyone can trigger a sync, hammering swu-db.com and Neon.
**Why it happens:** If `CRON_SECRET` is not set, the guard `if (!cronSecret || ...)` returns 401 correctly — but if the check is written incorrectly (e.g., only checking header without checking env var), it's open.
**How to avoid:** The guard MUST check that `cronSecret` is truthy before comparing. The pattern `if (!cronSecret || authHeader !== \`Bearer ${cronSecret}\`)` from official Vercel docs is correct. [CITED: vercel.com/docs/cron-jobs/manage-cron-jobs]
**Warning signs:** Route returns 200 with no Authorization header in browser.

### Pitfall 5: Vercel Hobby tier cron expression wrong

**What goes wrong:** Deployment fails with "Hobby accounts are limited to daily cron jobs. This cron expression would run more than once per day."
**Why it happens:** Expressions like `0 * * * *` (hourly) fail on Hobby tier.
**How to avoid:** Use `0 6 * * *` (once daily at 6am UTC). D-10 already mandates daily frequency. [VERIFIED: vercel.com/docs/cron-jobs/usage-and-pricing]
**Warning signs:** `vercel deploy --prod` exits with cron validation error.

### Pitfall 6: Vercel Cron does not retry on failure

**What goes wrong:** A sync job fails silently — swu-db.com was down during the cron window — and there is no retry.
**Why it happens:** Vercel explicitly states it will not retry failed invocations. [CITED: vercel.com/docs/cron-jobs/manage-cron-jobs]
**How to avoid:** The cron handler should return structured error responses (not throw unhandled exceptions) and log to Vercel runtime logs. The next daily run will succeed. Accept this as a design constraint.
**Warning signs:** No 200 response in Vercel cron job logs.

### Pitfall 7: Cost/Power/HP stored as strings from API

**What goes wrong:** Sorting cards by cost/power/hp in Phase 2 produces lexicographic ordering (`"10"` < `"2"`).
**Why it happens:** The swu-db.com API returns these as string fields (`"Cost": "3"`). If stored as `text`, alphabetic sort applies.
**How to avoid:** Parse to integer on ingest: `parseInt(card.Cost ?? '0', 10)`. Store as `integer` in `card_definitions`. Null for non-unit cards (Events, Bases with no cost).
**Warning signs:** Cards sorted by cost show `1, 10, 11, 2, 3...` ordering.

---

## Schema Design Reference

Based on the verified API response shape, the recommended schema maps as follows:

### card_definitions columns

| Column | DB Type | Source Field | Notes |
|--------|---------|-------------|-------|
| id | serial PK | — | Auto-increment |
| swudb_id | text UNIQUE | `{Set}-{Number}` of Normal variant | Upsert key |
| name | text NOT NULL | `Name` | |
| subtitle | text | `Subtitle` | Null for most cards |
| type | text NOT NULL | `Type` | "Unit", "Leader", "Event", "Upgrade", "Base" |
| aspects | text[] | `Aspects` | Default `'{}'::text[]` |
| arenas | text[] | `Arenas` | Default `'{}'::text[]` |
| traits | text[] | `Traits` | Default `'{}'::text[]` |
| keywords | text[] | `Keywords` | Default `'{}'::text[]` |
| cost | integer | `Cost` (parsed) | Null for non-cost cards |
| power | integer | `Power` (parsed) | Null for non-units |
| hp | integer | `HP` (parsed) | Null for non-units |
| front_text | text | `FrontText` | |
| back_text | text | `BackText` | Leader back side |
| epic_action | text | `EpicAction` | Leader epic action |
| double_sided | boolean | `DoubleSided` | |
| unique | boolean | `Unique` | |
| created_at | timestamp | — | defaultNow() |
| updated_at | timestamp | — | defaultNow() |

### card_printings columns

| Column | DB Type | Source Field | Notes |
|--------|---------|-------------|-------|
| id | serial PK | — | Auto-increment |
| card_definition_id | integer FK | — | References card_definitions.id |
| set_code | text NOT NULL | `Set` | e.g., "SOR" |
| collector_number | text NOT NULL | `{Set}-{Number}` | e.g., "SOR-059" |
| rarity | text NOT NULL | `Rarity` | |
| variant_type | text NOT NULL | `VariantType` | "Normal" \| "Foil" \| "Hyperspace" etc. |
| front_art_url | text | `FrontArt` | CDN URL |
| back_art_url | text | `BackArt` | Leader back art |
| artist | text | `Artist` | |
| created_at | timestamp | — | defaultNow() |
| updated_at | timestamp | — | defaultNow() |

Unique constraint: `(set_code, collector_number)` — one row per physical printing.

**Fields deliberately omitted:** `MarketPrice`, `FoilPrice`, `LowPrice`, `LowFoilPrice` — pricing data is volatile, not needed for collection tracking, and bloats the DB needlessly. [ASSUMED — user did not explicitly confirm, but aligns with project scope]

---

## Neon Setup (Step-by-Step for New Users)

> **Decision D-11:** User is new to Neon. Include explicit steps.

1. Go to [console.neon.tech](https://console.neon.tech) and sign up (free tier: 0.5 GB storage, 100 compute-hours/month, 1 project). [CITED: neon.tech sign-up flow]
2. Click "Create project" → enter a project name (e.g., `swu-tracker`) → select a region (us-east-1 if targeting US) → click "Create project".
3. In the project dashboard, click "Connect" → the Connection Details panel shows your connection string.
4. Copy the **pooled** connection string (hostname contains `-pooler`): `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`
5. Create `.env.local` in project root (never commit this file): `DATABASE_URL="postgresql://..."` 
6. For `drizzle-kit` (which reads `.env` not `.env.local`), also create `.env` with the same `DATABASE_URL` line (add `.env` to `.gitignore`).
7. Run `npm run db:push` to apply the schema to Neon.
8. Verify in Neon Console → Tables panel that `card_definitions` and `card_printings` exist.

**Pooled vs Direct connection strings:**
- Use **pooled** (`-pooler` in hostname) for all application queries and the seed script — optimal for serverless.
- Use **direct** (no `-pooler`) if `drizzle-kit migrate` fails — migration tools sometimes require direct connections. [CITED: neon.com/docs/connect/connection-pooling]

---

## Vercel Deployment Setup (Step-by-Step for New Users)

> **Decision D-11:** User is new to Vercel. Include explicit steps.

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click "Add New Project" → import your GitHub repository.
3. In "Environment Variables", add:
   - `DATABASE_URL` = your Neon pooled connection string (production Neon database)
   - `CRON_SECRET` = a random 32-character hex string (generate with `openssl rand -hex 32`)
4. Deploy. The `vercel.json` crons config activates automatically on production deployments.
5. After deploy, verify the cron job appears in Project Settings → Cron Jobs.
6. To seed the production database: run `npx vercel env pull .env.production.local` to pull production env vars locally, then `DATABASE_URL=$(cat .env.production.local | grep DATABASE_URL | cut -d= -f2) npm run db:seed`. Alternatively, trigger the cron endpoint manually via curl with the CRON_SECRET.

**Cron job behavior on Hobby tier:** Runs once daily; Vercel may invoke up to 59 minutes after the scheduled hour. No retry on failure. [VERIFIED: vercel.com/docs/cron-jobs/usage-and-pricing]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getTableColumns()` | `getColumns()` | drizzle-orm@1.0.0-beta.2 | Use `getColumns()` in bulk upsert helpers |
| `next lint` runs on `next build` | `next build` no longer runs linter | Next.js 16 | Must run linter explicitly via npm scripts |
| Create Next App prompts: TypeScript? | Default setup auto-enables TypeScript | Next.js 16 | `--yes` flag uses all recommended defaults |

**Deprecated/outdated:**
- `drizzle-orm-pg` package: Old package name. Use `drizzle-orm` with `drizzle-orm/pg-core` imports. [ASSUMED — based on npm ecosystem knowledge]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Pricing fields (MarketPrice, FoilPrice, etc.) should be excluded from schema | Schema Design | Low — pricing data could be added later; schema is additive |
| A2 | `dotenv` latest version is suitable for loading .env.local in seed script | Standard Stack | Low — dotenv is extremely stable |
| A3 | `tsx` is the appropriate tool for running seed script TypeScript directly | Standard Stack | Low — `ts-node` is an alternative; both work |
| A4 | `drizzle-orm-pg` is deprecated (old package name) | State of the Art | Low — informational note only |

---

## Open Questions

### Q-1: How to link variant printings to the same card_definitions row?

**What we know:** A card like Boba Fett has a Normal printing (SOR-179) and a Hyperspace printing (SOR-281). Both represent the same card identity and should share one `card_definitions` row.

**What's unclear:** The `swudb_id` field in `card_definitions` is proposed as the Normal printing's collector number. But when processing SOR-281 (Hyperspace), the sync code needs to find the existing `card_definitions` row to attach the printing to.

**Recommendation:** Two-pass approach within each set:
1. First pass: process `VariantType === "Normal"` cards — upsert `card_definitions` keyed on `{Set}-{Number}`, creating the canonical row.
2. Second pass: process all other VariantTypes — look up `card_definitions` by `(name, subtitle)` using a WHERE clause to get the `id`, then insert only `card_printings`.

This avoids a separate lookup on every card and keeps the logic sequential.

### Q-2: Should promo sets (SOROP, PSOR, etc.) be synced?

**What we know:** There are 36 sets total; ~15 are promo, OP, event exclusive, or token sets. These contain cards that are legal in Premier format and some collectors own them.

**What's unclear:** The user's collection import (Phase 3) uses card collector numbers. If a user owns a promo card, it needs a `card_printings` row.

**Recommendation:** Sync all non-token sets (sets where `setId` does NOT start with "T"). Promo sets have their own collector numbers and printings. Including them ensures completeness. The token filter is the only filter needed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js, seed script | Yes | v24.14.1 | — |
| npm | Package management | Yes | 11.11.0 | — |
| Neon account | Database | Not yet | — | Must create (Step-by-step in plan) |
| Vercel account | Deployment, Cron | Not yet | — | Must create (Step-by-step in plan) |
| swu-db.com API | Card data | Yes (verified) | N/A | No fallback needed |

**Missing dependencies with no fallback:**
- Neon account: User must create one. Plan must include setup steps.
- Vercel account: User must create one. Plan must include setup steps.

**Missing dependencies with fallback:**
- None that block local development. The seed script can be tested against Neon from day 1.

---

## Validation Architecture

> `nyquist_validation: true` in config.json — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.mts` (does not exist yet — Wave 0 gap) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CATALOG-04 | `upsertCards()` handles token filtering (skips T-prefix sets and Token types) | unit | `npm test -- --run __tests__/upsert-cards.test.ts` | Wave 0 |
| CATALOG-04 | `upsertCards()` constructs correct collector_number `{Set}-{Number}` format | unit | `npm test -- --run __tests__/upsert-cards.test.ts` | Wave 0 |
| CATALOG-04 | `upsertCards()` is idempotent — running twice produces same DB state | unit (mock DB) | `npm test -- --run __tests__/upsert-cards.test.ts` | Wave 0 |
| CATALOG-04 | Cron route returns 401 without valid CRON_SECRET | unit | `npm test -- --run __tests__/cron-route.test.ts` | Wave 0 |
| CATALOG-04 | Seed script exits 0 on success | smoke (manual) | `npm run db:seed` | — |

**Note:** `upsertCards()` unit tests should mock the Neon DB client rather than hitting Neon directly. Use `vi.mock('@/db')` to inject a mock `db` object.

### Sampling Rate

- **Per task commit:** `npm test -- --run` (runs all tests once, no watch)
- **Per wave merge:** `npm test -- --run` (full suite)
- **Phase gate:** Full suite green + `npm run db:seed` succeeds against dev Neon DB + `npm run dev` starts without errors

### Wave 0 Gaps

- [ ] `vitest.config.mts` — framework config, covers all phase tests
- [ ] `__tests__/upsert-cards.test.ts` — covers CATALOG-04 upsert logic
- [ ] `__tests__/cron-route.test.ts` — covers cron auth guard

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user auth in Phase 1 |
| V3 Session Management | No | No sessions in Phase 1 |
| V4 Access Control | Yes (cron endpoint) | CRON_SECRET via Authorization: Bearer header |
| V5 Input Validation | Low | swu-db.com response is trusted; no user input in Phase 1 |
| V6 Cryptography | No | No secrets storage beyond env vars |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated cron invocation | Elevation of privilege | `CRON_SECRET` + `Authorization: Bearer` guard [CITED: vercel.com/docs] |
| DATABASE_URL in source code | Information disclosure | `.env.local` in `.gitignore`, Vercel env vars for production |
| Cron idempotency violation (double-run) | Tampering | Full upsert (`ON CONFLICT DO UPDATE`) is inherently idempotent [CITED: orm.drizzle.team/docs/guides/upsert] |
| swu-db.com response injection | Tampering | Fields stored as parameterized values via Drizzle (no raw SQL interpolation) |

---

## Sources

### Primary (HIGH confidence)

- `api.swu-db.com/sets` — verified all 36 sets, setId format, token set naming convention
- `api.swu-db.com/cards/sor` — verified Card object shape, Number field format, VariantType values
- `api.swu-db.com/cards/search?q=type:token` — verified token card structure (Type: "Token Upgrade", Set: "TSOR")
- `www.swu-db.com/api` — verified endpoint list, no auth/rate limits documented
- [Vercel Cron Quickstart](https://vercel.com/docs/cron-jobs/quickstart) — vercel.json syntax, GET handler pattern
- [Vercel Cron Manage](https://vercel.com/docs/cron-jobs/manage-cron-jobs) — CRON_SECRET pattern, Authorization header format
- [Vercel Cron Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) — Hobby tier: once/day, 100 jobs max
- [Next.js Installation](https://nextjs.org/docs/app/getting-started/installation) — create-next-app command, Node.js 20.9+ requirement, default setup
- [Next.js Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest) — vitest.config.mts, required packages
- [Drizzle Get Started with Neon](https://orm.drizzle.team/docs/get-started/neon-new) — neon-http setup, drizzle.config.ts
- [Drizzle Upsert Guide](https://orm.drizzle.team/docs/guides/upsert) — `onConflictDoUpdate()` syntax, `sql.raw('excluded.col')` pattern
- [Drizzle Column Types PG](https://orm.drizzle.team/docs/column-types/pg) — text, integer, boolean, timestamp, jsonb, serial column syntax
- [Drizzle Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints) — unique constraint, composite unique, foreign key syntax
- [Neon Connection Pooling](https://neon.com/docs/connect/connection-pooling) — pooled vs direct connection strings
- npm registry: `next@16.2.4`, `drizzle-orm@0.45.2`, `@neondatabase/serverless@1.1.0`, `drizzle-kit@0.31.10`, `vitest@4.1.5`

### Secondary (MEDIUM confidence)

- [Drizzle Push vs Migrate guide](https://www.oreateai.com/blog/drizzle-push-vs-migrate...) — push=dev, generate+migrate=prod; cross-verified with official Drizzle docs
- [Neon free tier limits](https://neon.tech sign-up) — 0.5 GB storage, 100 compute-hours/month, 1 project

### Tertiary (LOW confidence — flagged in Assumptions Log)

- None — all claims in Assumptions Log are LOW-risk design choices, not factual claims needing verification.

---

## Metadata

**Confidence breakdown:**
- swu-db.com API shape: HIGH — directly verified endpoints, inspected live responses
- Token card detection: HIGH — verified via type:token search and /sets endpoint
- Standard stack versions: HIGH — verified via npm registry
- Vercel Cron limits and auth: HIGH — read official Vercel docs (updated 2026-03-17)
- Drizzle upsert patterns: HIGH — read official Drizzle guides
- Neon connection setup: HIGH — read official Neon docs
- Schema design field mapping: HIGH — derived directly from verified API response shape

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (swu-db.com API structure is stable; package versions may drift)
