# Architecture Research — Star Wars: Unlimited Tracker

**Researched:** 2026-05-03
**Overall confidence:** HIGH (data model and sync patterns verified against live API docs and mature TCG app references)

---

## System Components

The app has four major component groups. Each has a clear boundary and a single primary responsibility.

### 1. Card Catalog Service
Owns the canonical copy of all SWU card data. Syncs from the external API (swuapi.com or swu-db.com) and serves card data to all other components. No user data lives here — it is read-only from a user perspective.

### 2. Auth + User Service
Handles account creation, login, session management. Provides `userId` as the identity anchor for all user-specific data. Standard Next.js auth pattern (NextAuth / Auth.js or BetterAuth with Prisma adapter).

### 3. Collection Service
Per-user inventory: which cards the user owns and in what quantity. Read by the Deck Builder to compute availability. Read by the Want List Service to determine what is missing.

### 4. Deck + Want List Service
Stores deck definitions (which cards, how many copies per deck). Computes the want list by aggregating what decks need vs. what the collection owns. Enforces SWU legality rules at write time.

### Component Diagram

```
External SWU API
       |
       v
[Card Catalog Sync]  <-- background job / manual trigger
       |
       v
[cards] table (PostgreSQL)
       |
  _____|_____
 |           |
[Collection] [Deck Builder]
 Service       Service
     \           /
      \         /
    [Want List View]
    (computed query)
```

---

## Data Model

### Core Tables

#### `users`
Standard auth table. Provided by Auth.js / Prisma adapter.

```
id          UUID  PK
email       TEXT  UNIQUE NOT NULL
name        TEXT
created_at  TIMESTAMPTZ
```

#### `cards`
The canonical card catalog. Populated and updated by the sync job — never written to by users.

```
id               UUID  PK  (use swuapi uuid — stable across syncs)
external_id      TEXT  UNIQUE NOT NULL  (swuapi external_id)
collector_number TEXT  NOT NULL  (e.g. "SOR_005")
name             TEXT  NOT NULL
subtitle         TEXT
type             TEXT  NOT NULL  (Leader, Base, Unit, Event, Upgrade)
cost             INT
power            INT
hp               INT
rarity           TEXT  (Common, Uncommon, Rare, Legendary, Special)
set_code         TEXT  NOT NULL  (e.g. "SOR", "TWI")
set_name         TEXT  NOT NULL
variant_type     TEXT  NOT NULL  (Standard, Hyperspace, Showcase, Foil, etc.)
aspects          TEXT[]
traits           TEXT[]
keywords         TEXT[]
arena            TEXT
image_url        TEXT
ability_text     TEXT
updated_at       TIMESTAMPTZ NOT NULL
search_vector    TSVECTOR GENERATED ALWAYS AS (
                   to_tsvector('english',
                     name || ' ' || coalesce(subtitle,'') || ' ' ||
                     coalesce(type,'') || ' ' ||
                     coalesce(array_to_string(traits,'  '),'')
                   )
                 ) STORED
```

**Index:** `CREATE INDEX cards_search_idx ON cards USING GIN (search_vector);`
**Index:** `CREATE INDEX cards_set_type_idx ON cards (set_code, type);`

Design notes:
- One row per variant (Standard SOR_005 and Foil SOR_005 are separate rows). This lets users track exactly which printings they own.
- `collector_number` groups variants of the same card across printings — useful for displaying "you own 2x SOR_005 (Standard)".
- `aspects` and `traits` as `TEXT[]` avoids join tables for simple filtering; use GIN index if array-contains queries are needed.

#### `user_collections`
Junction between user and card. Tracks exactly how many copies of a specific card variant the user owns.

```
id         UUID  PK
user_id    UUID  NOT NULL  FK → users.id
card_id    UUID  NOT NULL  FK → cards.id
quantity   INT   NOT NULL  CHECK (quantity >= 0)
updated_at TIMESTAMPTZ NOT NULL

UNIQUE (user_id, card_id)
```

Design notes:
- One row per (user, card) pair. Upsert on add/update, delete on quantity = 0.
- `UNIQUE (user_id, card_id)` enforces integrity and enables fast upserts.
- Keep quantity = 0 rows deleteable to avoid counting noise in want list queries.

#### `decks`
A named deck belonging to a user.

```
id           UUID  PK
user_id      UUID  NOT NULL  FK → users.id
name         TEXT  NOT NULL
description  TEXT
leader_card_id UUID  FK → cards.id  (must be type = 'Leader')
base_card_id   UUID  FK → cards.id  (must be type = 'Base')
is_public    BOOLEAN DEFAULT FALSE
created_at   TIMESTAMPTZ
updated_at   TIMESTAMPTZ
```

Design notes:
- Leader and Base are first-class fields because SWU deck rules treat them differently from main deck cards. Makes legality validation simple.
- `is_public` reserved for share-by-link feature (v2).

#### `deck_cards`
The main deck contents. Does not include leader/base (those live on the `decks` table).

```
id       UUID  PK
deck_id  UUID  NOT NULL  FK → decks.id  ON DELETE CASCADE
card_id  UUID  NOT NULL  FK → cards.id
quantity INT   NOT NULL  CHECK (quantity BETWEEN 1 AND 3)

UNIQUE (deck_id, card_id)
```

Design notes:
- `CHECK (quantity BETWEEN 1 AND 3)` enforces the SWU max-3-copies rule at the database level.
- Deck legality (exactly 50 cards in main deck) is enforced at the service layer (COUNT(quantity) per deck), not DB constraint, because it involves aggregation.
- `ON DELETE CASCADE` from deck means no orphaned deck_cards rows if a deck is deleted.

#### `catalog_sync_log`
Tracks the last successful sync for incremental updates.

```
id              UUID  PK
synced_at       TIMESTAMPTZ NOT NULL
high_water_mark TIMESTAMPTZ NOT NULL  (last updated_at seen from API)
cards_upserted  INT
status          TEXT  (success, partial, failed)
error_detail    TEXT
```

### Want List — Computed, Not Stored

The want list is a derived view, not a separate table. It is calculated on-demand by query:

```sql
-- For a specific deck:
WITH deck_needs AS (
  SELECT
    dc.card_id,
    dc.quantity AS needed
  FROM deck_cards dc
  WHERE dc.deck_id = :deck_id
),
user_owns AS (
  SELECT card_id, quantity AS owned
  FROM user_collections
  WHERE user_id = :user_id
)
SELECT
  dn.card_id,
  dn.needed,
  COALESCE(uo.owned, 0) AS owned,
  GREATEST(dn.needed - COALESCE(uo.owned, 0), 0) AS missing
FROM deck_needs dn
LEFT JOIN user_owns uo USING (card_id);

-- Cross-deck want list (aggregate across all decks):
WITH all_deck_needs AS (
  SELECT dc.card_id, SUM(dc.quantity) AS total_needed
  FROM deck_cards dc
  JOIN decks d ON d.id = dc.deck_id
  WHERE d.user_id = :user_id
  GROUP BY dc.card_id
),
user_owns AS (
  SELECT card_id, quantity AS owned
  FROM user_collections
  WHERE user_id = :user_id
)
SELECT
  adn.card_id,
  adn.total_needed,
  COALESCE(uo.owned, 0) AS owned,
  GREATEST(adn.total_needed - COALESCE(uo.owned, 0), 0) AS missing
FROM all_deck_needs adn
LEFT JOIN user_owns uo USING (card_id)
WHERE adn.total_needed > COALESCE(uo.owned, 0);
```

Design notes:
- These queries are O(user's decks) in scope — not global aggregations. They are fast for realistic user data (10–100 decks).
- Add index on `deck_cards(deck_id)`, `user_collections(user_id, card_id)`.
- If cross-deck want list becomes slow at scale, materialize it into a view with `REFRESH MATERIALIZED VIEW` on deck save.

---

## External Data Flow

How card catalog data moves from the API into the database:

```
swuapi.com /cards?since=<high_water_mark>
       |
       | JSON (paginated, max 1000/page)
       v
Sync Job (Next.js API route /api/admin/sync-cards
          OR scheduled via pg-boss / Vercel Cron)
       |
       | Upsert on external_id
       v
[cards] table
       |
       | updated_at written by sync job
       v
[catalog_sync_log] row inserted
```

### Sync Strategy

The swuapi.com API supports incremental sync via `?since=<ISO8601 timestamp>`. The sync job:

1. Reads `MAX(high_water_mark)` from `catalog_sync_log`.
2. Calls `GET /cards?since=<high_water_mark>&limit=1000`, follows pagination cursor.
3. Upserts each card: `INSERT ... ON CONFLICT (external_id) DO UPDATE SET ...`.
4. Writes new `catalog_sync_log` row with new high-water mark.

**Trigger for sync:**
- Vercel Cron (if hosted on Vercel): `vercel.json` cron weekly or on release day.
- pg-boss job queue (if self-hosted / Render): schedule via database-backed cron.
- Manual admin trigger: protected Next.js API route for on-demand refresh when a new set drops.

**Fallback strategy:**
- Cards table is the authoritative local cache. The app never calls the external API per user request — all card data is served from PostgreSQL.
- If the external API is down, the app continues functioning with the last-synced catalog.
- If no cards are in the database (first deploy), seed from API on startup or provide a seed script.

**Two available APIs:**
- `https://www.swuapi.com` — UUID-keyed, incremental sync support, 40+ fields per card, variant support. Preferred for sync architecture.
- `https://www.swu-db.com/api` — Simpler query API (search, set retrieval), supports CSV/JSON output. Good as a fallback or for one-time seeds.

---

## User Data Flow

### Reading: Card Catalog Browse + Collection Overlay

```
Browser → GET /api/cards?search=vader&set=SOR&type=Leader
       → Next.js Route Handler
       → PostgreSQL: SELECT cards.*, uc.quantity as owned
                     FROM cards
                     LEFT JOIN user_collections uc
                       ON uc.card_id = cards.id
                       AND uc.user_id = :userId
                     WHERE cards.search_vector @@ plainto_tsquery('english', :query)
                       AND (:set IS NULL OR cards.set_code = :set)
                     ORDER BY cards.set_code, cards.collector_number
                     LIMIT 50 OFFSET :offset
       → JSON response with `owned` field on each card
```

The LEFT JOIN approach means one query returns both card data and the user's ownership count. No second round-trip.

### Writing: Collection Update

```
Browser → POST /api/collection (body: { cardId, quantity })
       → Auth check (session.userId must exist)
       → PostgreSQL: INSERT INTO user_collections (user_id, card_id, quantity)
                     VALUES (:userId, :cardId, :quantity)
                     ON CONFLICT (user_id, card_id)
                     DO UPDATE SET quantity = :quantity, updated_at = NOW()
       → If quantity = 0: DELETE FROM user_collections WHERE user_id=... AND card_id=...
```

### Reading: Deck Builder with Collection Awareness

```
Browser → GET /api/decks/:deckId/builder
       → Fetch deck_cards with card details + user's owned quantity
       → PostgreSQL: SELECT c.*, dc.quantity as in_deck, uc.quantity as owned
                     FROM deck_cards dc
                     JOIN cards c ON c.id = dc.card_id
                     LEFT JOIN user_collections uc
                       ON uc.card_id = c.id AND uc.user_id = :userId
                     WHERE dc.deck_id = :deckId
```

Missing = in_deck > owned. Rendered in the UI as a highlight on affected cards.

### CSV Import Flow

```
Browser file input (accept=".csv")
       |
       | File object — do NOT upload to server
       v
PapaParse (client-side parsing, ssr:false component)
       |
       | Array of row objects
       v
Column mapping step (detect SWUDB format vs generic)
       |
       | Normalized { cardIdentifier, quantity } array
       v
POST /api/collection/import (body: JSON array)
       |
       v
Server: match cardIdentifier to cards table
       → Try: collector_number match (e.g. "SOR_005")
       → Fallback: name match (case-insensitive)
       |
       v
Bulk upsert into user_collections
       |
       v
Return { matched, unmatched } summary to browser
```

**SWUDB CSV columns** (inferred from API docs — the API exports cards with set/number identifiers): likely includes card name, set code, collector number, quantity. The matching logic should try `set_code + collector_number` first, then name-only as a fallback.

**Generic CSV mapping:** Show the user a column picker ("which column is card name?", "which is quantity?") before importing. PapaParse returns headers automatically.

---

## Build Order

Component dependencies drive this sequence. Each phase can be built and tested independently.

### Phase 1 — Foundation: Card Catalog + Auth
**Why first:** Everything else depends on the `cards` table existing and Auth providing `userId`.
- Database schema: `users`, `cards`, `catalog_sync_log`
- Card sync job (seed + incremental)
- Card browse API with full-text search and set/type filtering
- Auth (NextAuth or BetterAuth with Prisma)
- Public card catalog UI (no login required)

**Deliverable:** Any visitor can search and browse all SWU cards.

### Phase 2 — Collection Tracking
**Why second:** Needs cards table. Provides the ownership data that deck builder depends on.
- `user_collections` table
- Collection API (upsert, delete, read)
- Collection view in UI (browsable with owned counts)
- Manual search-and-click add/remove

**Deliverable:** Logged-in users can build their collection.

### Phase 3 — Deck Builder
**Why third:** Needs both cards (Phase 1) and collection (Phase 2) to show ownership overlay.
- `decks`, `deck_cards` tables
- Deck CRUD API
- Deck builder UI with collection overlay (owned / missing indicators)
- "Show only owned cards" filter
- SWU legality validation (50-card rule, max 3 copies, Leader + Base structure)

**Deliverable:** Users can build decks that know what they own.

### Phase 4 — Want List
**Why fourth:** Needs decks (Phase 3) to aggregate across.
- Want list computed query (per-deck and cross-deck)
- Want list UI page
- Export/share (CSV download, shareable link)

**Deliverable:** Users know exactly what to buy.

### Phase 5 — CSV Import
**Why fifth:** Nice to have early, but not blocking. Can be added once collection schema is stable.
- PapaParse client-side parsing
- SWUDB CSV format detection and mapping
- Generic CSV column mapping UI
- Bulk import API route
- Import result summary (matched / unmatched report)

**Deliverable:** Users can migrate their existing SWUDB collection in one step.

---

## Key Architecture Decisions

### Decision 1: Cards are a local cache, not a proxy
The app stores all card data in PostgreSQL rather than calling the external API on each request. This means:
- Card browse and search are fast (local DB query, not external HTTP).
- The app keeps working if the external API goes down.
- New sets require a sync job to run — there is no "live" card data.

Tradeoff: sync job must be triggered when new sets release. Mitigate with a weekly cron plus a manual admin trigger.

### Decision 2: One row per card variant in `cards`
Standard and Foil SOR_005 are separate rows. This allows users to track exactly which printing they own. The `collector_number` field ties variants together for display grouping.

Tradeoff: the cards table is larger. At SWU's scale (hundreds to low thousands of cards across all printings), this is not a concern.

### Decision 3: Collection availability is a LEFT JOIN, not a separate query
The card catalog browse query always LEFT JOINs `user_collections` and returns `owned` as a field on each card row. There is no second API call from the browser to "check what I own."

Tradeoff: every card query requires an authenticated `userId` to be meaningful. For unauthenticated browsing, `owned` will be NULL for all cards (acceptable — just don't show the owned badge).

### Decision 4: Want list is computed, not materialized (initially)
The want list SQL runs on demand rather than being pre-stored. For a user with 10–50 decks, this query is fast (milliseconds). Only if cross-deck aggregation becomes slow at scale (hundreds of decks) does materializing make sense.

Tradeoff: want list UI has a small latency per page load. Acceptable at MVP scale; can add a materialized view with trigger-based refresh later.

### Decision 5: Legality rules enforced at service layer
SWU deck rules (50 main deck cards, max 3 copies of non-unique cards, exactly 1 Leader, 1 Base) are enforced in the Next.js Route Handler / Server Action before writing to the database, not in database constraints. This is because legality requires counting `SUM(quantity)` across all deck_cards rows — an aggregation constraint that PostgreSQL CHECK constraints cannot express.

The `quantity BETWEEN 1 AND 3` CHECK on `deck_cards` provides a DB-level backstop for the per-card copy limit.

### Decision 6: CSV parsing is client-side
PapaParse runs in the browser (dynamic import with `ssr: false`). Only the normalized, parsed data is sent to the server as JSON. This avoids multipart file upload complexity and keeps the server API surface clean.

### Decision 7: Full-text search via PostgreSQL tsvector GIN index
Card search uses a `GENERATED ALWAYS AS ... STORED` tsvector column indexed with GIN. This provides fast, typo-tolerant search across card name, subtitle, traits, and type with no additional infrastructure (no Elasticsearch, no Algolia).

For the card count in Star Wars Unlimited (hundreds to low thousands of cards), PostgreSQL FTS is more than sufficient and eliminates an external dependency.

---

## Sources

- swuapi.com API documentation: https://www.swuapi.com/docs (incremental sync, card fields, variant types)
- swu-db.com API documentation: https://www.swu-db.com/api (search, set retrieval, CSV/JSON format)
- PostgreSQL full-text search (tsvector/GIN): https://www.postgresql.org/docs/current/textsearch-tables.html
- Persistent tsvector performance: https://danielabaron.me/blog/speed-up-pg-fts-with-persistent-ts-vectors/
- Prisma + Next.js App Router guide: https://www.prisma.io/docs/guides/nextjs
- Row Level Security with Prisma: https://atlasgo.io/guides/orms/prisma/row-level-security
- pg-boss (PostgreSQL job queue): https://github.com/timgit/pg-boss
- Next.js background jobs overview: https://render.com/articles/nextjs-background-jobs-postgresql-production
- Archidekt collection overlay behavior: https://archidekt.com/forum/thread/2349823/1
- PapaParse CSV parsing library: https://github.com/mholt/PapaParse
- pocket-dex (Pokémon TCG Pocket Next.js reference): https://github.com/joschka-w/pocket-dex
