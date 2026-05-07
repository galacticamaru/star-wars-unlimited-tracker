# Features Research — v2 (Star Wars Unlimited Tracker)

**Researched:** 2026-05-07 (inline)
**Confidence:** HIGH

---

## Auth + Multi-User

### Table Stakes
- Email + password registration and login
- Session persistence (stay logged in across browser restarts)
- Per-user data isolation — collections and decks are private by default
- Logout

### Differentiators
- Social login (Google/Discord) — common in TCG communities
- "Remember me" / session duration control

### Anti-features
- Magic link email-only auth — adds email dependency, friction vs password
- Passwordless-only — unfamiliar to casual users

### Notes
- v1 has userId=1 hardcoded everywhere. Auth is a data migration, not just a feature. Every DB query that touches user_collections, decks, or want lists must become session-aware.
- Existing single user's data can be migrated to the first registered account.

---

## Card Market Pricing

### Table Stakes
- Price per card shown in catalog and deck builder
- Total deck price shown in deck builder / deck view
- Prices cached (not live per-request — tolerable staleness is fine for a personal tool)
- Source attribution ("via Cardmarket" / "via TCGPlayer")

### Differentiators
- Both EUR and USD prices shown (especially relevant for AU users)
- Price badge color indicating value tier (budget / mid / premium)
- "Missing card cost" — how much it would cost to complete a deck based on want list

### Anti-features
- Real-time live prices — overkill, adds external dependency on hot path
- Price history charts — significant complexity, low value for a deck builder
- Buy links / affiliate integration — different product (marketplace)

### Notes
- pokemon-api.com is the recommended source: covers Cardmarket EU + TCGPlayer US in one call, SWU supported natively
- Cache in `card_prices` DB table, refresh daily via existing cron job or on-demand if stale

---

## Deck of the Day

### Table Stakes
- One featured deck per day from a real tournament result (PQ or higher)
- Deck shows full card list with owned-count overlay (cards you own highlighted vs missing)
- "Copy to my decks" button — imports the deck into the user's personal deck library
- Tournament context: event name, tier, player name

### Differentiators
- Missing-card count summary ("You're missing 12 cards — total cost ~$45")
- Filter by archetype or leader to find Deck of the Day for your preferred style
- Historical archive (browse past featured decks)

### Anti-features
- User-submitted "deck of the day" nominations — moderation complexity
- Real-time tournament live coverage — very different product
- Sideboard display — SWU Premier doesn't use sideboards

### Notes
- swubase.com has no public API — cannot use as data source
- swuapi.com has decklists API (API key required) — this is the source
- Deck card IDs in swuapi.com responses use swudb notation (e.g. `SOR_010`) which matches existing `card_printings.swudb_id`
- Daily cron fetch fits within Vercel Hobby 1-cron-per-day limit if combined with existing catalog sync

---

## Trade Binder

### Table Stakes
- User can add cards from their collection to a trade binder with a "quantity offering" (e.g. "I own 3, offering 2 for trade")
- Trade binder is publicly viewable without login via a shareable URL
- Catalog-style filters (by set, type, aspect, etc.) on the trade binder view
- Owner can remove or update quantities

### Differentiators
- "Want list meets trade binder" — show what you're looking for alongside what you're offering
- Auto-warn when offered quantity exceeds current owned quantity

### Anti-features
- In-app trading / matching — marketplace feature, entirely different product
- Price suggestions on binder items — adds pricing dependency
- Private binders — defeats the purpose; public is the primary use case

### Notes
- Trade binder quantity must be <= owned quantity; enforce at write time
- Public view requires NO authentication — unauthenticated visitors can browse
- Owner management (add/remove/update) requires authentication
- Similar UI to catalog: card grid, filters, owned count replaced by "offering" count
