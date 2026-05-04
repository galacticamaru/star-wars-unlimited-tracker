---
phase: 01-foundation
plan: 02
subsystem: database
tags: [drizzle, neon, postgresql, schema, database]
dependency_graph:
  requires: [01-01]
  provides: [card-schema, drizzle-client, neon-tables]
  affects: [01-03, 01-04]
tech_stack:
  added: []
  patterns: [drizzle-neon-http, two-table-card-model, pg-array-columns, composite-unique-constraint]
key_files:
  created:
    - src/db/schema.ts
    - src/db/index.ts
  modified: []
decisions:
  - neon-http driver used (not WebSocket) — correct choice for Next.js serverless on Vercel; HTTP driver is faster for single-transaction queries
  - integer columns for cost/power/hp — stored as integer not text to support proper numeric sort in Phase 2 catalog
  - composite unique on (set_code, collector_number) in card_printings — one row per physical printing variant
  - swudb_id unique constraint on card_definitions — upsert key for the sync job
metrics:
  duration: ~5 minutes
  completed: 2026-05-04
  tasks_completed: 1
  files_created: 2
  files_modified: 0
---

# Phase 1 Plan 2: Database Setup Summary

Drizzle ORM schema with two-table card model pushed to Neon PostgreSQL — card_definitions (20 columns) and card_printings (11 columns) tables are live.

## What Was Created

### src/db/schema.ts

Full Drizzle schema with all D-01/D-02/D-03 fields captured in Phase 1 (no deferred columns).

**card_definitions table — 20 columns:**

| Column | Type | Constraint |
|--------|------|------------|
| id | serial | PRIMARY KEY |
| swudb_id | text | NOT NULL UNIQUE |
| name | text | NOT NULL |
| subtitle | text | nullable |
| type | text | NOT NULL |
| aspects | text[] | NOT NULL DEFAULT '{}' |
| arenas | text[] | NOT NULL DEFAULT '{}' |
| traits | text[] | NOT NULL DEFAULT '{}' |
| keywords | text[] | NOT NULL DEFAULT '{}' |
| cost | integer | nullable |
| power | integer | nullable |
| hp | integer | nullable |
| front_text | text | nullable |
| back_text | text | nullable |
| epic_action | text | nullable |
| double_sided | boolean | NOT NULL DEFAULT false |
| unique | boolean | NOT NULL DEFAULT false |
| created_at | timestamp | NOT NULL defaultNow() |
| updated_at | timestamp | NOT NULL defaultNow() |

**card_printings table — 11 columns:**

| Column | Type | Constraint |
|--------|------|------------|
| id | serial | PRIMARY KEY |
| card_definition_id | integer | NOT NULL FK → card_definitions.id |
| set_code | text | NOT NULL |
| collector_number | text | NOT NULL |
| rarity | text | NOT NULL |
| variant_type | text | NOT NULL |
| front_art_url | text | nullable |
| back_art_url | text | nullable |
| artist | text | nullable |
| created_at | timestamp | NOT NULL defaultNow() |
| updated_at | timestamp | NOT NULL defaultNow() |

**Table constraints:**
- card_definitions: UNIQUE on swudb_id
- card_printings: COMPOSITE UNIQUE on (set_code, collector_number)

### src/db/index.ts

Drizzle database client using the neon-http driver:
```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });
```

## Neon Database

- Project name: swu-tracker
- Region: us-east-2 (AWS)
- Connection: pooled endpoint (contains -pooler in hostname)
- Driver: @neondatabase/serverless neon-http (not WebSocket)

## Schema Push Result

```
npm run db:push
> drizzle-kit push

[✓] Pulling schema from database...
[✓] Changes applied
```

Exit code: 0. Both tables created in Neon successfully.

## Test Results

```
npm test -- --run

 RUN  v4.1.5

No test files found, exiting with code 0
```

Exit code: 0. No test failures.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

T-02-01 (Information Disclosure — DATABASE_URL): Both .env and .env.local are gitignored and contain no real connection strings in tracked files. The connection string never appears in source code.

T-02-02 (Tampering — swu-db.com API response): Schema defines Drizzle table objects. All DB writes in subsequent plans will use Drizzle parameterized API (no raw SQL string interpolation).

T-02-03 (Tampering — schema drift): drizzle-kit push applied schema to dev Neon database. drizzle-kit generate + migrate will be used for production schema changes in Plan 01-04.

No new threat surface beyond what was accounted for in the plan's threat model.

## Current State

Schema pushed to Neon — card_definitions and card_printings tables are live. The Drizzle client is ready for use by subsequent plans. Plan 01-03 can now build the upsertCards() sync logic that writes to these tables.

## Self-Check: PASSED

- src/db/schema.ts exists: FOUND
- src/db/index.ts exists: FOUND
- schema.ts contains pgTable('card_definitions': CONFIRMED
- schema.ts contains pgTable('card_printings': CONFIRMED
- schema.ts contains swudb_id unique constraint: CONFIRMED
- schema.ts contains integer cost/power/hp: CONFIRMED
- schema.ts contains composite unique (set_code, collector_number): CONFIRMED
- schema.ts contains FK references(() => cardDefinitions.id): CONFIRMED
- index.ts contains drizzle-orm/neon-http: CONFIRMED
- npm run db:push exits 0: CONFIRMED ([✓] Changes applied)
- npm test --run exits 0: CONFIRMED
- Commit e2bfa73 exists: CONFIRMED
