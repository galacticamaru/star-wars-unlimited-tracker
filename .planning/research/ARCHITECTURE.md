# Architecture Research — v2 Integration (Star Wars Unlimited Tracker)

**Researched:** 2026-05-07 (inline)
**Confidence:** HIGH

---

## Existing Architecture (Non-Negotiable)

- Next.js 16 App Router + TypeScript
- Neon PostgreSQL with neon-http Drizzle driver (NOT WebSocket)
- Two-table card model: `card_definitions` + `card_printings` (never change)
- `user_collections`: composite PK [userId, cardDefinitionId]; userId currently = 1
- `decks`: userId column always 1, is_draft boolean
- Vercel Hobby: 1 cron/day at 06:00 UTC

---

## New DB Tables / Schema Changes

### Auth (Better Auth standard schema)
```sql
users           — id, name, email, emailVerified, image, createdAt, updatedAt
sessions        — id, userId, token, expiresAt, ipAddress, userAgent
accounts        — id, userId, accountId, providerId, accessToken, ...
verifications   — id, identifier, value, expiresAt
```
Better Auth Drizzle adapter generates these. Do not manually design auth tables.

### Card Prices (cache table)
```sql
card_prices — card_definition_id (FK), price_usd NUMERIC, price_eur NUMERIC,
              updated_at TIMESTAMP
```
Indexed on `card_definition_id`. Refreshed daily by cron. JOIN-able with existing card queries.

### Featured Decks (Deck of the Day)
```sql
featured_decks      — id, title, tournament_name, tier, player_name,
                       leader_card_id (FK card_definitions), base_card_id (FK),
                       source_url, melee_id (unique), featured_date DATE, fetched_at
featured_deck_cards — featured_deck_id (FK), card_definition_id (FK), quantity
```
`featured_date` allows querying "today's deck" and archiving past decks.

### Trade Binder
```sql
trade_binder — user_id (FK users), card_definition_id (FK card_definitions),
               quantity_offering INTEGER NOT NULL CHECK (quantity_offering > 0),
               PRIMARY KEY (user_id, card_definition_id)
```
Constraint: `quantity_offering <= owned_quantity` enforced at write time in server action (not DB-level, to avoid complex FK trigger).

---

## Integration Points

### Auth → Everything
- Replace `const userId = 1` with `const session = await auth.api.getSession({ headers: await headers() })`
- All API routes that write user data → require session, return 401 if missing
- Public routes (catalog browse, trade binder view) → session optional

### Card Prices → Catalog & Deck Builder
- Extend existing card query results to LEFT JOIN `card_prices`
- `getCatalogCards()` and `getDeckCardsForUser()` both gain `priceUsd` / `priceEur` fields
- Deck builder header shows running total price

### Featured Decks → Deck Builder (copy flow)
- "Copy to my library" = insert into `decks` + `deck_cards` from `featured_deck_cards`
- Reuse existing deck creation server action, add `sourceFeatureddDeckId` parameter
- Missing-card overlay reuses existing `getDeckCardsForUser()` logic

### Trade Binder → Collection
- Trade binder reads from `user_collections` to validate offering quantities
- Public trade binder page (`/[username]/binder`) — no auth required
- Owner management at `/binder` (authenticated route)

---

## Suggested Build Order

1. **Phase 6: Auth** — Must be first. Everything downstream depends on real `userId`.
   - Better Auth setup, proxy.ts, protected routes, login/register UI
   - Migrate all hardcoded `userId = 1` to session.userId
   - Data migration: assign existing data to first user account

2. **Phase 7: Market Pricing** — Independent once auth exists.
   - Add `card_prices` table, integrate pokemon-api.com
   - Extend catalog + deck builder UI with price display
   - Add to daily cron job

3. **Phase 8: Deck of the Day** — Depends on auth (for copy-to-library) and pricing (for cost summary).
   - swuapi.com integration, `featured_decks` tables
   - Public featured deck view with missing-card overlay
   - Copy-to-library action

4. **Phase 9: Trade Binder** — Depends on auth.
   - `trade_binder` table, owner management UI
   - Public binder view at `/[username]/binder`
   - Shareable URL

---

## Vercel Hobby Cron Constraint

One cron job per day. Options:
- **Extend existing cron** at 06:00 UTC to also fetch today's featured deck + refresh prices
- All three data refresh tasks (catalog sync, price refresh, deck of day fetch) share the single daily slot
- This is acceptable — daily freshness is sufficient for all three
