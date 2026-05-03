# Pitfalls Research — Star Wars: Unlimited Tracker

**Domain:** TCG collection tracker + deck builder web app
**Researched:** 2026-05-03
**Confidence:** MEDIUM-HIGH (SWU-specific details from API docs; general TCG patterns from community evidence)

---

## Data Model Pitfalls

### Pitfall 1: Conflating "Card" with "Printing" (Card Identity vs. Card Version)

**What goes wrong:** The data model stores one row per card name, then tries to bolt variants on later. The schema breaks when the same base card has Hyperspace, Hyperspace Foil, Standard Foil, Showcase, Prestige, and Prerelease Promo versions — all with different collector numbers, different art, but the same game rules text.

**Root cause:** Developers model what they see first (the card name) rather than what users actually collect (a specific physical printing).

**Consequences:**
- Collection counts become ambiguous: "3 copies of Luke Skywalker" — which printing?
- Foil-only collectors cannot track their inventory accurately
- Import from SWUDB CSV fails because the CSV references collector numbers (set + card number + variant), not just names
- The UI cannot show "you own 2 Standard and 1 Hyperspace Foil" without a rewrite

**Prevention:**
- Schema must distinguish `card_definition` (game rules, name, text) from `card_printing` (set, collector number, variant type, art URL)
- Collection entries link to `card_printing`, not `card_definition`
- Deck entries should link to `card_definition` (any printing of a card is legal — you don't need a specific foil to play a card)
- See SWU variant types section for the full variant taxonomy

**Warning signs:**
- Schema has a `foil` boolean on the card table (not a separate printing row)
- Collection table has a `card_id` foreign key directly to a cards table without a variant column
- Deck legality queries join collection to deck directly on card name

**Phase:** Must be resolved in the initial schema design phase, before any feature work.

---

### Pitfall 2: "Available Copies" Calculation is Harder Than It Looks

**What goes wrong:** The app shows collection counts fine, but fails to correctly answer "how many of this card can I still add to a new deck?" — because copies may already be allocated across other decks.

**Root cause:** Archidekt (a major MTG collection + deck builder) explicitly abandoned this feature after encountering query performance problems. The query requires: for each card in the current deck view, sum copies used across ALL other decks, then subtract from collection total. With large collections and many decks, this is a scatter-gather query across many rows.

**Consequences:**
- Without it: the "owned copies" indicator in the deck builder is misleading — it shows total owned, not available
- With a naive implementation: full table scans on every card render, deck builder becomes unusably slow
- Archidekt's conclusion: "not possible due to database limitations (specifically query times)"

**Prevention:**
- Design the query as a single aggregated subquery or CTE, not N individual queries per card
- Index: `(user_id, card_definition_id)` on both collection and deck_card tables
- Consider a denormalized `allocated_count` counter updated via triggers or application logic
- For MVP: display total owned (not available), clearly labeled. Defer "available across decks" to a later phase with explicit performance testing
- If implementing: run EXPLAIN ANALYZE with realistic data volumes before shipping

**Warning signs:**
- Deck builder card render calls a per-card API endpoint for collection status
- No composite index on deck_cards covering user_id + card_id
- Feature works fine in dev with 10 decks, breaks in prod with 100

**Phase:** MVP should show total owned (simple). "Available" calculation is a Phase 2 feature requiring explicit performance design.

---

### Pitfall 3: Treating Unique Cards the Same as Non-Unique for Deck Limits

**What goes wrong:** Deck validation enforces "max 3 copies" universally. Unique cards (marked with a diamond symbol) actually allow 3 copies in the deck — the uniqueness rule only governs what can be on the field simultaneously. Misunderstanding this leads to incorrectly blocking valid decklists.

**Root cause:** The "unique" concept is confused between deck construction (allowed 3 copies) and gameplay (only 1 in play).

**Consequences:** The deck builder incorrectly blocks decks that are actually legal, creating friction and distrust.

**Prevention:**
- Store the `isUnique` field from the API but do NOT restrict deck copy count based on it
- The max-3 rule applies to ALL non-Leader, non-Base cards regardless of unique status
- Leaders and Bases: exactly 1 each, enforced separately
- Validate legality rules with the official comprehensive rules document, not secondary sources

**Warning signs:** Deck validation rejects a deck with 3 copies of a unique unit

**Phase:** Core deck legality validation, Phase 1.

---

### Pitfall 4: Storing Card Text in the Local Database and Treating It as Authoritative

**What goes wrong:** Card rules text is synced from the API and stored locally. When errata updates card text, the local copy becomes stale. The app shows outdated rules text, which frustrates players.

**Root cause:** Card data is treated as write-once immutable after initial sync.

**Consequences:**
- Players see wrong rules text for errataed cards (7 cards have official errata as of 2026)
- Suspension list changes not reflected — players build illegal decks without warning
- Trust erodes when the app shows obviously wrong information

**Prevention:**
- Treat the local card catalog as a cache, not a source of truth
- Implement periodic re-sync (daily or per-set-release) that replaces card data
- Store a `last_synced_at` timestamp per card record
- For suspension/errata: poll the API or official announcements, and surface a "rules may have changed" indicator when data is older than a threshold
- The SWU design team errata cards for templating/clarity; the suspended list is reviewed each set cycle and around major events

**Warning signs:**
- Card sync runs once at deploy time and never again
- No `updated_at` or `last_synced_at` on card records
- New set releases require a manual admin action to appear in the app

**Phase:** Card catalog sync strategy, Phase 1.

---

## Card Catalog / API Pitfalls

### Pitfall 5: No Rate Limit Documentation Means No Rate Limit Protection

**What goes wrong:** The SWUDB API and SWU API (swuapi.com) do not publicly document their rate limits. Developers assume no limits exist, hit them unexpectedly during bulk operations (initial catalog import, re-sync), and get blocked.

**Root cause:** Absence of documentation is treated as absence of limits.

**Consequences:**
- Initial catalog seed fails midway, leaving a partial/corrupt local card database
- IP gets temporarily blocked, causing full app outage for all users
- New set release sync floods the API and gets throttled

**Prevention:**
- Always assume rate limits exist even when undocumented
- Use the `/export/all` bulk endpoint (SWU API provides this) for initial seeding — one request instead of N per-card requests
- Implement exponential backoff with jitter on all API calls
- Schedule re-syncs during off-peak hours (e.g., 3am cron job), not on user request
- Cache aggressively: store full card catalog in local PostgreSQL, never fetch a card from the upstream API in the hot path of a user request

**Warning signs:**
- Catalog sync iterates set-by-set or card-by-card with sequential HTTP requests
- No retry logic or backoff on API fetch failures
- User-triggered "refresh catalog" button calls the upstream API directly

**Phase:** Phase 1, before any feature using card data.

---

### Pitfall 6: Assuming the API Set List Is a Clean "Playable Cards Only" List

**What goes wrong:** The card catalog is populated directly from the API's set list without filtering. Token cards (numbered T01, T02..., with types like "Token Unit" or "Token Upgrade") appear in the browseable card list and can be added to decks. The collection also fills up with Experience tokens, Shield tokens, etc.

**Root cause:** Token cards have their own set numbers (T-prefixed) in the SWU card numbering system. They appear in API responses unless explicitly filtered.

**Consequences:**
- Users see tokens in card search and are confused
- Tokens can be added to decks, breaking legality (tokens are never part of a constructed deck)
- Collection shows tokens in the card list, cluttering search results

**Prevention:**
- Filter out token cards when populating the card browsing catalog
- Token cards in SWU are identified by: card number prefixed with "T" OR card type values like "Token", "Token Unit", "Token Upgrade"
- Store tokens in a separate table or with a `is_token` flag — they may be useful for game reference but should not appear in collection/deck contexts
- Confirm with the API what types constitute non-deck cards at integration time

**Warning signs:**
- Card search results include "Shield Token" or "Experience Token"
- User can add a token to a deck
- No `type` filter in the card catalog sync

**Phase:** Phase 1, card catalog design.

---

### Pitfall 7: Building Against a Single API Source With No Fallback

**What goes wrong:** The app depends entirely on one third-party API (SWUDB or swuapi.com). When that API has downtime — especially during a new set release when traffic spikes — the app loses all card data access and breaks.

**Root cause:** No local resilience strategy.

**Consequences:**
- App is completely broken when upstream API is unavailable
- New set releases (high-traffic moments) are exactly when the API is most likely to struggle
- Users lose access to collection and deck builder features

**Prevention:**
- Sync full card catalog to local PostgreSQL; never read from upstream API in the user request path
- The app reads from its own database; the upstream API is only a sync source
- Implement a background sync job (cron) with alerting on failure
- Gracefully handle sync failures: log the error, serve stale data, do not crash

**Warning signs:**
- API route calls upstream SWU API directly to serve card browse/search
- No local cards table in the database schema
- Sync failure causes HTTP 500 errors on card pages

**Phase:** Phase 1, architecture decision.

---

## Deck Builder Pitfalls

### Pitfall 8: Building the Deck Builder Without Collection Status in the Initial Design

**What goes wrong:** The deck builder UI is built as a standalone feature first, then collection ownership is grafted on as an overlay. The result is visually cluttered, slow (separate collection fetch per card), and architecturally fragile.

**Root cause:** Features built in isolation, integrated later.

**Consequences:**
- Collection status indicators appear as afterthoughts that don't match the card display rhythm
- API response for deck builder cards doesn't include ownership data, requiring a second fetch
- The core value proposition ("see what you own while building") feels broken

**Prevention:**
- Design the deck builder card data payload to include `owned_count` from the start
- The SQL query for deck builder card search should LEFT JOIN the collection in a single query: `SELECT cards.*, COALESCE(c.quantity, 0) as owned_count FROM cards LEFT JOIN collection c ON c.card_definition_id = cards.id AND c.user_id = $userId`
- Mock the owned_count data in UI prototypes before building the backend

**Warning signs:**
- Deck builder card component has a separate `useEffect` to fetch collection status after mounting
- Owned count shows as a loading spinner while the rest of the card renders

**Phase:** Deck builder feature, must be designed holistically.

---

### Pitfall 9: Deck Legality Validation Only on Submit, Not Inline

**What goes wrong:** The deck is only validated when the user tries to save/export. Users build an illegal deck across multiple sessions, only discovering errors at the end.

**Root cause:** Validation treated as a gate, not a guide.

**Consequences:**
- Frustrating UX: user has to debug why their 55-card deck is being rejected
- Users don't learn the deck rules from the app

**Prevention:**
- Validate continuously: show a live legality summary panel (e.g., "50/50 cards", "1 Leader", "1 Base", "2 cards over the 3-copy limit: [card names]")
- Never allow saving an illegal deck silently — surface specific violations inline
- SWU rules to enforce: exactly 1 Leader, exactly 1 Base, minimum 50 cards in main deck, max 3 copies of any non-unique-by-name card (3-copy rule applies across deck + sideboard in competitive formats)

**Warning signs:**
- Deck save endpoint returns a validation error with no in-app indicator before saving
- No live card count in the deck builder UI

**Phase:** Deck builder feature.

---

### Pitfall 10: Aspect Restriction Not Surfaced in Deck Builder

**What goes wrong:** SWU cards have Aspect costs — some cards require specific aspects to play at full cost or at all. The deck builder allows adding cards freely without surfacing aspect compatibility, leading to players building technically-legal-but-unplayable decks.

**Root cause:** Deck legality (construction rules) conflated with deck playability (aspect compatibility).

**Consequences:**
- User builds a deck and discovers at the table that half their cards are penalised
- App feels uninformed about the game

**Prevention:**
- Surface each card's aspect requirements alongside the Leader/Base aspects
- Flag (not block) cards whose aspects aren't covered by the chosen Leader/Base
- This is a UX warning, not a hard legality rule — aspects affect penalty costs, not construction legality

**Warning signs:**
- Deck builder has no Leader/Base selection step that sets the "aspect context"

**Phase:** Deck builder UX polish phase.

---

## Import/Export Pitfalls

### Pitfall 11: CSV Encoding and BOM Issues Breaking Imports

**What goes wrong:** Users export their SWUDB collection to CSV from a browser or Excel, then import it. The CSV may have:
- A UTF-8 BOM (byte order mark: `\xEF\xBB\xBF`) prepended by Windows tools or Excel
- Windows-1252 encoding instead of UTF-8 (Excel's default CSV export is Windows-1252)
- The first column name becomes `\xEF\xBB\xBFName` instead of `Name`, causing lookup failures

**Root cause:** The BOM and encoding issues are invisible to the user and the parser throws no obvious error — it just silently fails to match the first column.

**Consequences:**
- Import silently imports 0 cards or produces parsing errors with no useful message
- Column `\xEF\xBB\xBFCount` is not found, so all quantities are 0
- Card name matching fails for names containing accented characters (e.g., non-English card names in future sets)

**Prevention:**
- Strip UTF-8 BOM at the start of parsing before any column parsing
- Detect encoding: try UTF-8, fall back to Latin-1/Windows-1252
- Normalize column names: trim whitespace, strip BOM bytes, lowercase before matching
- Log and surface which rows failed to parse and why, with line numbers
- Test with a CSV exported directly from SWUDB and one exported via Excel Save As CSV

**Warning signs:**
- Import shows "0 cards imported" with no error message
- Parser uses `headers[0] === 'Name'` without stripping the BOM

**Phase:** CSV import feature.

---

### Pitfall 12: Fragile Column Matching in SWUDB CSV Parsing

**What goes wrong:** The SWUDB CSV format uses specific column headers. If the parser matches columns by exact position (index 0, 1, 2...) rather than by name, any column reordering or export option change breaks the import silently. Additionally, the SWUDB API documentation confirms the CSV format but does not guarantee column stability across updates.

**Root cause:** Position-based parsing instead of header-name-based parsing.

**Consequences:**
- Import maps quantities to the wrong field
- Card numbers get treated as quantities, corrupting the collection

**Prevention:**
- Always parse CSV by column name, never by index
- Support flexible column name variants: "Count"/"Qty"/"Quantity", "Set"/"Set Code"/"SetCode"
- Validate that required columns are present before importing any rows
- Return a clear error: "Required column 'Count' not found. Found columns: [list]"
- For generic CSV: document what column names are expected; provide a template download

**Warning signs:**
- Parser uses `row[0]`, `row[1]`, `row[2]` instead of `row['Count']`, `row['Name']`

**Phase:** CSV import feature.

---

### Pitfall 13: Partial Import Leaves Collection in Inconsistent State

**What goes wrong:** An import of 500 cards processes 400 successfully, then hits a parsing error on row 401 and aborts. The collection now has a partial state — 400 cards imported, 100 missing — with no indication to the user.

**Root cause:** Import not wrapped in a transaction; errors abort mid-process.

**Consequences:**
- User thinks the import succeeded (no error shown for the successful 400)
- Or user re-imports, creating duplicate entries (if not idempotent)
- Collection integrity is broken

**Prevention:**
- Wrap the entire import in a single database transaction; rollback on any error
- Show a post-import summary: "Imported 487 cards. 13 rows skipped (reasons listed below)"
- Make imports idempotent: "upsert" (insert or update quantity) rather than blind insert
- Provide a download of the failed rows so the user can fix and re-import

**Warning signs:**
- Import endpoint runs individual INSERT statements per row without a transaction
- No post-import report shown to the user

**Phase:** CSV import feature.

---

### Pitfall 14: Card Matching by Name Alone Causes Ambiguity

**What goes wrong:** The CSV contains "Luke Skywalker" but there are multiple Luke Skywalker cards across sets (e.g., SOR and a reprint in a later set). Matching by name alone picks the wrong card — typically the first one found.

**Root cause:** Card identity in a TCG requires set + card number, not just name. Leaders especially have both a "leader side" and "deployed unit side" under the same name.

**Consequences:**
- User's collection records the wrong set/printing
- Deck legality checks may fail if the deck references a specific set version

**Prevention:**
- Prefer matching by set code + card number (collector number) when available in the CSV
- Fall back to name-based matching only when set/number is absent, and warn the user
- For name-only matches: if multiple printings exist, pick the most recent canonical printing and note the ambiguity in the import report
- The SWUDB API confirms that collector_number lookups default to the Standard variant — handle explicit variant lookups with the `?variant=` parameter

**Warning signs:**
- Import SQL is `SELECT id FROM cards WHERE name = $name`
- No set code or card number column used in card resolution

**Phase:** CSV import feature.

---

## Performance Pitfalls

### Pitfall 15: Loading Card Images Without Lazy Loading or Virtualization

**What goes wrong:** The deck builder and card browser render a grid of cards, each with a card image. If 200+ cards are rendered simultaneously without lazy loading, the page makes 200+ image requests on load, causing severe initial load time and memory pressure.

**Root cause:** Straightforward rendering of all cards in the visible result set.

**Consequences:**
- Initial page load takes 5-15 seconds on average connections
- Mobile devices run out of memory and crash the browser tab
- Unnecessary image bandwidth even for cards the user never scrolls to

**Prevention:**
- Use `loading="lazy"` on all card `<img>` elements — supported natively in all modern browsers
- For the deck builder (potentially 50+ cards simultaneously visible), implement windowed rendering (react-virtual or similar) for large lists
- Paginate or virtualize card search results: show 20-40 at a time with infinite scroll
- Use Next.js `<Image>` component which handles lazy loading, responsive sizing, and format optimization automatically

**Warning signs:**
- `<img src={card.imageUrl} />` without `loading="lazy"` in card components
- All 252 cards of a set rendered on one page simultaneously

**Phase:** Card browser and deck builder UI phases.

---

### Pitfall 16: N+1 Queries in Collection and Deck Builder Views

**What goes wrong:** For each card rendered in the deck builder, a separate database query fetches the collection count for that card. With 50 cards in a deck, this is 51 queries (1 for the deck, 50 for collection counts).

**Root cause:** Collection status fetched per-card rather than in bulk.

**Consequences:**
- Deck builder page takes seconds to load even with fast database
- Scales linearly with deck size, making larger collections dramatically worse

**Prevention:**
- Always fetch collection counts in a single query with an IN clause or JOIN: `WHERE card_definition_id = ANY($cardIds)`
- Pass the full set of `card_definition_ids` needed for the current view, fetch all counts in one round trip
- Use DataLoader pattern if building any GraphQL layer
- The single-query JOIN pattern: `SELECT cd.id, COALESCE(c.quantity, 0) as owned FROM card_definitions cd LEFT JOIN collection c ON c.card_definition_id = cd.id AND c.user_id = $uid WHERE cd.id = ANY($ids)`

**Warning signs:**
- Collection count fetch inside a `map()` or `forEach()` over cards
- Database query log shows identical queries repeated N times per page load

**Phase:** Any feature that shows collection counts, Phase 1.

---

### Pitfall 17: PostgreSQL Connection Pool Exhaustion in Serverless Deployment

**What goes wrong:** Next.js deployed on Vercel (serverless) creates a new database connection per function invocation. With 100 simultaneous requests, 100 connections are created, exhausting PostgreSQL's default limit of 100 connections. New requests start failing with "too many connections."

**Root cause:** Serverless functions don't share connection pools across invocations.

**Consequences:**
- Under moderate load, the app returns 500 errors
- Database crashes, affecting all users simultaneously

**Prevention:**
- Use a connection pooler (PgBouncer) or a managed connection pooling service (Supabase pooler, Neon's built-in pooler)
- If using Vercel + direct PostgreSQL: set pool size to 1-2 per function, rely on an external pooler
- Neon, Supabase, and Railway all provide built-in connection pooling — prefer these over bare PostgreSQL for serverless deployments
- Cap maximum connections with `max` in the pg connection config

**Warning signs:**
- Direct `pg` connection without a pooler in a Next.js serverless deployment
- PostgreSQL max_connections not adjusted from default 100

**Phase:** Infrastructure/deployment phase, but must be decided before any load testing.

---

## Auth / Multi-user Pitfalls

### Pitfall 18: Server Actions Skipping Authorization Checks

**What goes wrong:** Next.js Server Actions are used to modify collections and decks. Because they feel like "internal" functions, developers skip the authorization check — assuming that if the UI only shows the user their own data, only their data will be modified. A malicious user sends a crafted POST to the action with a different `userId` parameter.

**Root cause:** The abstraction of Server Actions obscures that they are public API endpoints.

**Consequences:**
- User A can overwrite User B's collection or delete User B's decks
- IDOR (Insecure Direct Object Reference) vulnerability

**Prevention:**
- Every Server Action that reads or writes user data must extract the user ID from the session, never from the request body or URL params
- Pattern: `const session = await getSession(); const userId = session.user.id; // use this, never req.body.userId`
- Never trust client-supplied identifiers for ownership; always derive from authenticated session
- Add server-side authorization tests: "can User A access User B's deck?" should return 403/404

**Warning signs:**
- Server Action accepts `userId` as a parameter
- No session validation at the top of mutation Server Actions

**Phase:** Auth phase, before any user data mutations.

---

### Pitfall 19: JWT Sessions Cannot Be Invalidated

**What goes wrong:** JWT-based sessions (the default in NextAuth) cannot be invalidated server-side before expiry. If a user wants to log out all sessions (e.g., after a password change or suspected compromise), they cannot. The JWT remains valid until expiration.

**Root cause:** JWTs are stateless by design — there is no server-side session record to delete.

**Consequences:**
- Security gap: stolen tokens remain valid for hours
- "Log out everywhere" feature is impossible without a token blocklist
- Password reset doesn't terminate existing sessions

**Prevention:**
- For a public multi-user app: use database sessions (NextAuth with Prisma/pg adapter) rather than JWT, so sessions can be invalidated by deleting the database record
- If using JWTs: keep expiry short (15-60 minutes) and implement refresh token rotation
- Implement "log out all sessions" by deleting all session rows for that user

**Warning signs:**
- NextAuth configured with `session: { strategy: 'jwt' }` without a short expiry
- No "log out all devices" functionality in user settings

**Phase:** Auth phase.

---

### Pitfall 20: Missing Rate Limiting on Auth Endpoints

**What goes wrong:** The sign-in endpoint has no rate limiting. A bot can attempt thousands of password combinations without throttling. NextAuth's `/api/auth/signin` endpoint does not implement rate limiting by default.

**Root cause:** Auth libraries provide authentication mechanics but not rate limiting.

**Consequences:**
- Credential stuffing and brute-force attacks succeed without detection
- Email sign-in endpoints can be spammed, generating thousands of magic link emails (cost + spam classification)

**Prevention:**
- Add rate limiting middleware to all auth routes: limit to 5-10 attempts per IP per minute
- Use Upstash Redis + `@upstash/ratelimit` (popular with Next.js serverless deployments)
- For email magic links: rate limit per email address, not just per IP

**Warning signs:**
- NextAuth setup with no rate limiting wrapper around auth routes
- Sign-in endpoint returns 200 for every attempt regardless of frequency

**Phase:** Auth phase.

---

## SWU-Specific Pitfalls

### Pitfall 21: Mishandling the Full Variant Taxonomy

**What goes wrong:** The app only tracks Standard and Foil variants, missing the full SWU variant taxonomy. Users who collect Hyperspace Foils, Showcase cards, or Prestige variants cannot accurately record what they own.

**Root cause:** Early development uses a simple `is_foil` boolean instead of the proper variant type field.

**SWU variant types (from swuapi.com, HIGH confidence):**
- Standard
- Standard Foil
- Hyperspace (extended art frame, any rarity)
- Hyperspace Foil
- Showcase (Leader cards only, ~1 per 12 boxes)
- Prestige (alternate art, ~1 per 18 packs, introduced in A Lawless Time)
- Prerelease Promo

**Consequences:**
- Users with Showcase or Prestige cards have no way to log them
- The collection is inaccurate for dedicated collectors
- Import from sources that distinguish variants fails silently

**Prevention:**
- Store `variant_type` as an enum or string column on the `card_printing` table, not a boolean
- Populate from the `variantType` field in the API response
- The SWU API's `?variant=` parameter allows fetching a specific variant; use it in import flows

**Warning signs:**
- `card_printings` table has an `is_foil BOOLEAN` column
- Showcase and Prestige cards are not represented in the local card database

**Phase:** Data model design, Phase 1.

---

### Pitfall 22: Tokens Appearing in Collection and Deck Builder

**What goes wrong:** (See also Pitfall 6.) Token cards in SWU use a distinct numbering convention (T-prefix) and are not part of constructed decks. However, they appear in API set responses and must be actively excluded.

**Root cause:** The API returns the full set contents including tokens, promos, and art cards.

**SWU token card identification:**
- Card number begins with "T" (e.g., T01, T02)
- Card type is "Token", "Token Unit", or "Token Upgrade"
- These are never included in a constructed deck; they are generated during play

**Consequences:**
- Token cards clutter card search results
- Users inadvertently add Shield Token or TIE/LN Fighter (token) to their decks

**Prevention:**
- Filter at sync time: exclude cards where `type` contains "Token" or card number matches `/^T\d+/`
- If storing tokens at all (for reference), set `is_playable = false` and exclude from all deck/collection UI

**Phase:** Phase 1, card catalog sync.

---

### Pitfall 23: Leader Cards — Both Sides, One Card

**What goes wrong:** Leader cards in SWU have two faces: the Leader side (horizontal, the command zone card) and the Leader Unit side (the deployed unit that appears in play). Both faces belong to one card — but the API may return separate image URLs for each face (`frontImageUrl`, `backImageUrl` or a `face` parameter).

**Root cause:** Treating a two-faced card as two separate cards.

**Consequences:**
- Leader appears twice in card search (front and back as separate entries)
- Collection counts split between two "cards"
- Deck builder allows adding the "back face" as a separate deck entry

**Prevention:**
- Store Leader cards as a single `card_printing` row with two image URL fields: `front_image_url` and `back_image_url`
- The API's `face=back` parameter fetches the back art image — use this for display, not for a separate card record
- In the deck builder, Leaders are selected once and shown in the Leader slot, not added to the 50-card main deck

**Warning signs:**
- Card search returns both "Luke Skywalker" (Leader) and "Luke Skywalker" (Leader Unit) as separate selectable cards
- Two separate rows for the same leader in the cards table

**Phase:** Phase 1, card data model.

---

### Pitfall 24: Suspended Cards Not Surfaced in Deck Builder

**What goes wrong:** The app builds decks with suspended cards without any warning. SWU maintains an active suspended list (cards banned from Premier format). The list changes each set cycle and around major events.

**Root cause:** Legality validation only covers structural rules (card counts, Leader/Base presence), not format legality.

**Consequences:**
- User submits a tournament deck built in the app only to discover it's illegal
- App loses credibility as a serious deck-building tool

**Prevention:**
- Maintain a `suspended_list` table (or flag on card records): `is_suspended_premier BOOLEAN`, `is_suspended_eternal BOOLEAN`
- Sync suspension status alongside card catalog updates — check the official suspended list endpoint or parse official announcements
- In the deck builder: warn (not block) when a suspended card is added, note which format it is suspended in
- The suspension list is updated at least once per set cycle; sync frequency should match

**Warning signs:**
- Deck legality validation has no concept of suspended/banned cards
- No `suspended` field in the card data model

**Phase:** Deck builder legality feature; suspension sync is part of the catalog sync job.

---

## Phase-Specific Warnings Summary

| Phase Topic | Pitfall | Mitigation |
|-------------|---------|------------|
| Initial schema design | Card identity vs. card printing (#1) | Separate `card_definition` and `card_printing` tables from day one |
| Card catalog sync | API rate limits unknown (#5) | Use bulk endpoint; backoff; never sync in hot path |
| Card catalog sync | Tokens in the set list (#6, #22) | Filter by type at sync time |
| Card catalog sync | Stale errata / suspension data (#4, #24) | Treat catalog as cache; schedule periodic re-sync |
| Card catalog sync | Single API dependency (#7) | Sync to local DB; serve from local DB only |
| Data model | Leader two-faced cards (#23) | One row, two image fields |
| Data model | Full variant taxonomy (#21) | `variant_type` string/enum, not boolean |
| Auth | IDOR via Server Actions (#18) | Session-derived user ID only |
| Auth | JWT session invalidation (#19) | Database sessions, not JWT |
| Auth | No rate limiting on sign-in (#20) | Add rate limiting middleware before launch |
| CSV import | BOM and encoding (#11) | Strip BOM; detect encoding; test with Excel export |
| CSV import | Column position vs. name (#12) | Name-based parsing; validate headers first |
| CSV import | Partial imports (#13) | Wrap in transaction; upsert not insert |
| CSV import | Name-only card matching (#14) | Match by set + card number; warn on ambiguity |
| Deck builder | Collection status as afterthought (#8) | Design payload to include owned_count from start |
| Deck builder | Legality only on submit (#9) | Live legality panel |
| Deck builder | Unique card copy limit misunderstanding (#3) | 3-copy rule for all non-Leader/Base cards |
| Performance | Image loading (#15) | Next.js Image component; lazy loading |
| Performance | N+1 collection queries (#16) | Bulk JOIN queries; never per-card fetches |
| Performance | Connection pool exhaustion (#17) | PgBouncer or managed pooler |
| Performance | "Available" count calculation (#2) | Show total owned in MVP; defer available-across-decks |

---

## Sources

- SWU API documentation: https://www.swuapi.com/docs (HIGH confidence — official)
- SWUDB API documentation: https://www.swu-db.com/api (HIGH confidence — official)
- SWU errata list: https://starwarsunlimited.gg/errata/ (HIGH confidence)
- SWU suspended list: https://www.swu-competitivehub.com/suspended-list/ (HIGH confidence)
- Archidekt collection availability tracker issue: https://archidekt.com/forum/thread/2349823/1 (HIGH confidence — primary source)
- SWU card variants overview: https://cardgamer.com/guides/star-wars-unlimited-card-rarities/ (MEDIUM confidence)
- CSV encoding pitfalls: https://www.elysiate.com/blog/csv-encoding-problems-utf8-bom-character-issues (HIGH confidence)
- CSV parsing errors guide: https://www.importcsv.com/blog/csv-parsing-errors (HIGH confidence)
- NextAuth rate limiting gap: https://github.com/nextauthjs/next-auth/issues/12288 (HIGH confidence — primary issue)
- Next.js session management pitfalls: https://clerk.com/articles/nextjs-session-management-solving-nextauth-persistence-issues (MEDIUM confidence)
- PostgreSQL connection pool serverless: https://clerk.com/articles/building-scalable-authentication-in-nextjs (MEDIUM confidence)
- SWU deck rules: https://boargamer.com/how-to-play-star-wars-unlimited-rules-deckbuilding-and-keywords/ (HIGH confidence — verified against official rules)
- SWU token card numbering: https://cardgamer.com/games/star-wars-unlimited-card-list/ (MEDIUM confidence)
