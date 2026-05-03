# Features Research — Star Wars: Unlimited Tracker

**Domain:** TCG collection tracker + deck builder (integrated)
**Researched:** 2026-05-03
**Overall confidence:** HIGH — SWU-specific rules from official sources; competitive landscape from direct tool investigation; MTG patterns from well-established community references.

---

## Competitive Landscape

### Existing SWU-Specific Tools

**SWUDB.com** — The incumbent. Premier SWU database and deck builder.
- Full card database with search and filtering
- Deck builder with SWU legality enforcement
- Community deck sharing (hot/top decks browsing)
- Collection CSV import/export (community-built Python scripts exist to bridge format gaps)
- ForceTable integration for online playtesting
- Tournament registration form export
- **Critical gap:** Deck builder is NOT aware of what you own. Collection tracking exists as a separate feature with no live integration into deck building. No "you own X copies of this" signal while building.

**SW-Unlimited-DB.com** — Alternative database and deck builder.
- Card database with All/Haves/Needs toggle views for collection tracking
- Deck builder with separate collection manager
- **Gap:** Same siloed problem — collection and deck building are not deeply integrated.

**SWU Hyperbuild** (mobile app, Google Play) — Free app with collection + deck building.
- Collection tracking with All/Haves/Needs views
- Regular + foil quantities per card
- Deck import from SWUDB via clipboard or Hot Decks pull
- Deck export via JSON, shareable link, or printable tournament form
- Deck states: Published / Draft / Archived
- Clone Deck for iteration
- Section-aware legality filters (Leader button only shows leaders, etc.)
- Google Drive backup
- **Gap:** Mobile-first; no web version; no cross-deck want list aggregation mentioned.

**StarWarsUnlimited.gg** — Meta-focused tool backed by DotGG Network.
- Card database + deck builder
- Meta tier lists, tournament reports, weekly meta updates
- Collection tracker with collection value tracking
- Pricing integration
- **Gap:** Meta analysis focus; collection-deck integration depth unclear from available data.

**Individual SWU Card Collection Tracker (bergqvist.it)** — Solo developer project.
- Collection tracking with owned/missing status
- Real-time market prices + total completion cost
- Trade-ready list (needs + duplicates)
- Import from SWUDB, export to JSON
- **Gap:** No deck builder integration; standalone collection tool only.

**Official starwarsunlimited.com deck builder** — Exists but limited; no collection integration.

### The Common Ecosystem Gap

Every existing SWU tool treats collection tracking and deck building as separate features with no live data bridge. The defining gap across the entire ecosystem is: **no tool shows you "I own 2 of 3 needed" while you are actively building a deck.** This is the core value this project delivers.

### MTG Ecosystem Reference (Established Patterns)

**Moxfield** — Industry-standard deck builder. Clean UI, reusable card packages, large community of shared decks. Collection tracking is a bolt-on feature, not deeply integrated.

**Archidekt** — Green/blue stripe indicators on owned cards in deck builder. Collection filter to restrict to owned cards. Does NOT show quantity available or cross-deck allocation. Collection tracker more developed than Moxfield's.

**Deckbox** — Strong collection/tradelist/wishlist triad. Deck builder shows missing cards and auto-adds to wishlist. Robust community trading system. Mana curve graphs. Shows collection-aware missing card highlighting. Best collection-deck integration in MTG space.

**GrimDeck** — Built collection + deck builder as unified data layer from day one; considered best-in-class for integration.

---

## Table Stakes Features

Features that users expect any TCG tracker/deck builder to have. Missing = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User account (sign up / log in) | All collection data is per-user; no auth = no persistent data | Low-Med | Next.js Auth, OAuth or email/password |
| Full card catalog browse | Can't build decks or track collection without browsable card list | Low | Driven by external SWU API (swu-db.com); needs local cache |
| Card search with filters | Name, type, aspect, cost, rarity, set — all standard in every TCG tool | Med | Text search + faceted filters |
| Add cards to collection with quantity | The core collection action; must be per-card count not just "owned/not owned" | Low-Med | Integer quantity; need to handle foil vs non-foil eventually |
| Collection view (browse what you own) | Users need to see and audit their collection | Low | Filterable list of owned cards |
| Deck builder — create and save decks | Core product function | Med | Multi-section: Leader, Base, Main Deck |
| Deck legality enforcement | SWU has strict construction rules; violations must be flagged | Med | See SWU-Specific Considerations section |
| Deck list view | See all your decks, name them, open/edit/delete | Low | Standard CRUD |
| Owned count on deck builder cards | The central value prop — this is table stakes for THIS product even if competitors lack it | Med | Requires collection-deck data join in real time |
| Missing cards highlighted in deck | Which cards do you still need to acquire | Low-Med | Derived from owned count vs deck count per card |
| CSV collection import | Users come from spreadsheets; friction-free migration | Med | Generic CSV + SWUDB CSV format |
| CSV/text collection export | Data portability; users expect to own their data | Low | Export owned cards as CSV |
| Card detail view | Card image, text, type, cost, aspects, set, rarity | Low | Rendered from API data |
| New sets appear automatically | Game releases a new set every ~4 months; manual entry is a dealbreaker | Low | API poll / cache refresh strategy |
| Responsive design (mobile-usable) | Players check collections and want lists at game store events | Med | Not a native app, but must be usable on phone |

---

## Differentiating Features

Features that would make this tool meaningfully better than the existing SWU ecosystem. These are the competitive advantages.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cross-deck unified want list | Aggregate all missing cards across all your decks into one shopping list; unique in the SWU ecosystem | Med | Query: for each card across all decks, sum (deck_count - min(owned, deck_count)); deduplicate |
| Want list export / share | Bring list to game store or share with trade partner | Low | CSV export + shareable URL |
| "Filter to owned only" mode in deck builder | Build only with cards you have; immediately useful for budget players and tournament prep | Low | Filter toggle using collection join |
| SWUDB CSV import | Existing users have collection data in SWUDB; direct import path lowers switching cost | Med | Parse SWUDB CSV column format; map to internal schema |
| Deck builder shows available copies | "You own 2, deck uses 3" visible inline; Archidekt requested this but couldn't build it due to DB limits | Med-High | Real-time collection-deck join; needs efficient query |
| Aspect penalty indicator | Show which cards in a deck will incur aspect penalty given chosen Leader + Base | Med | Requires per-card aspect comparison to leader/base aspects |
| Sideboard support | Premier format uses 10-card sideboard; must not exceed 3-copy limit across deck + sideboard | Med | Additional deck section; legality check must span both |
| Deck sharing (public URL) | Share decks with friends, post to Discord | Low | Public read-only deck view; toggle public/private |
| Set completion tracker | What % of each set do you own? Collector-oriented view | Low | Count owned cards grouped by set |
| Foil / variant tracking | Track regular vs foil vs Hyperspace vs Showcase copies separately | Med | Requires card_variant dimension in collection schema; adds UI complexity |
| Collection value estimate | "Your collection is worth approximately $X" using TCGPlayer prices | High | Requires price API integration; price data freshness is a maintenance burden |

---

## Anti-features (Defer)

Features to deliberately NOT build in v1. These would increase scope, complexity, or maintenance burden without validating the core value prop.

| Anti-Feature | Why Avoid in v1 | What to Do Instead |
|--------------|-----------------|-------------------|
| Card scanning via camera | ML/CV complexity is significant; requires mobile camera access + trained model; deferred explicitly in PROJECT.md | CSV import covers the migration use case |
| Card trading / marketplace | Entirely different product; trust, shipping, payment, dispute resolution — separate problem space | Link to TCGPlayer or external marketplace for buying singles |
| Price tracking and portfolio valuation | Requires ongoing price API integration and freshness management; high maintenance cost; not core to deck building workflow | Mention card prices in detail view using TCGPlayer link (no storage required) |
| Mobile native app (iOS/Android) | Separate release pipeline, app store review, platform-specific code; responsive web covers 80% of the mobile use case | Ensure the web app is mobile-responsive |
| Social/following/activity feed | Adds relational complexity without validating core value | Deck sharing URLs cover the community sharing need |
| Deck import from image/screenshot | Requires OCR; fragile; not worth it when text list import is simpler and more reliable | Support text-list / SWUDB clipboard deck import |
| Sealed/Draft format support | Different deck construction rules (30-card minimum, draft-picked cards); secondary format; complicates legality logic | Build Premier format legality first; add format selector later |
| Tournament bracket / event management | Different product entirely | |
| Price alerts / wishlist price notifications | Requires price data storage + notification system; high complexity | |
| Collection condition tracking (NM/LP/HP) | Useful for traders; not relevant for "do I own this card for my deck" use case | Store simple quantity; add condition in v2 if validated |

---

## Feature Dependencies

```
Authentication
  └── Collection (per-user collection requires auth)
        └── Collection Import (CSV parsing populates collection)
        └── Deck Builder with owned-count (requires collection data)
              └── Missing cards highlighting (derives from owned count vs deck count)
              └── "Filter to owned only" mode (requires collection data)
              └── Cross-deck want list (aggregates missing across all user's decks)
                    └── Want list export/share (requires want list to exist)

Card Catalog (API-driven, cached locally)
  └── Card search + filters (requires catalog)
  └── Card detail view (requires catalog)
  └── Collection add/edit (requires catalog as source of truth for card IDs)
  └── Deck Builder (requires catalog for card lookup)
        └── Deck legality enforcement (requires catalog card types + aspects)
        └── Aspect penalty indicator (requires catalog aspect data + leader/base aspects)

Deck Builder
  └── Deck list (CRUD for saved decks)
  └── Deck sharing (public URL)
  └── Sideboard support (additional deck section)
```

Key dependency chains:
- **Collection is a prerequisite for the core value prop.** Without collection data, missing-card highlighting and owned-count display don't exist.
- **Card catalog must be bootstrapped before any other feature.** Everything depends on having card data.
- **Deck legality enforcement depends on knowing card types from the catalog** (to know what is a Leader, Base, Unit, etc.).
- **Want list is downstream of deck builder + collection** — it's a derived view, not a standalone feature.

---

## SWU-Specific Considerations

### Deck Construction Rules (Premier Format — Standard Play)

| Rule | Detail | Enforcement Implication |
|------|--------|------------------------|
| Exactly 1 Leader | One double-sided leader card per deck; not counted in 50 | Validate Leader section has exactly 1 card |
| Exactly 1 Base | One base card per deck; not counted in 50 | Validate Base section has exactly 1 card |
| Minimum 50-card Main Deck | No maximum enforced by rules | Show count; warn if below 50 |
| Max 3 copies of any non-unique card | Unique cards also capped at 3 | Per-card copy count validation |
| Max 3 copies across deck + sideboard | Sideboard copies count against the 3-copy limit | Cross-section copy count validation |
| 10-card sideboard (Premier competitive) | Optional for casual; required for tournament play | Sideboard section, count validation |
| Aspect penalty (not a legality rule) | Cards without matching aspects from leader/base cost +2 resources per missing aspect | Show informational warning, do not block deck save |
| Heroism and Villainy cannot coexist | Mutually exclusive moral aspects | Warn if deck contains both (leader determines this) |

### Card Types (Affects Legality and UI Organization)

| Type | Description | Deck Section |
|------|-------------|--------------|
| Leader | Double-sided character card (Epic Action to deploy) | Leader section (exactly 1) |
| Base | Starting location with HP (~25-30 HP) | Base section (exactly 1) |
| Unit | Ground and space units with power/HP | Main deck |
| Event | Single-use effect cards | Main deck |
| Upgrade | Attaches to units | Main deck |
| Token Unit | Generated during play; NOT in deck | Not user-owned; display only |
| Token Upgrade | Generated during play; NOT in deck | Not user-owned; display only |

**Design implication:** Tokens should not appear in the collection tracker or deck builder as playable cards. The catalog API should flag them as tokens so the UI filters them out of construction tools.

### Card Variants and Rarities

SWU has a multi-tier variant system that matters for collection tracking:

**Rarities:** Common (C), Uncommon (U), Rare (R), Legendary (L), Starter Exclusive (S)

**Variant types:**
- **Standard** — Regular non-foil card
- **Foil** — Foil version of standard card (1 per pack)
- **Hyperspace** — Extended alternate art variant (~2 in 3 packs); can be any rarity
- **Hyperspace Foil** — Rare; ~1 in 50 packs
- **Showcase** — Leader-only alternate art with unique foil frame; ~1 in 12 boxes

**V1 recommendation:** Track regular quantity only. Add foil/variant tracking in v2 once core collection-deck workflow is validated. The UI complexity of variant tracking (which version of a card do you own?) is non-trivial and risks overcomplicating the MVP. A single "I own 3 copies of Commander Cody" is sufficient to answer "can I play this in my deck?" — variant specifics matter for collectors but not for deck legality.

### Sets Released (as of 2026-05-03)

Seven sets currently released, with the game on a roughly 4-month cadence:

1. Spark of Rebellion (March 2024) — 252 cards
2. Shadows of the Galaxy (July 2024) — 262 cards
3. Twilight of the Republic (November 2024) — 257 cards
4. Jump to Lightspeed (March 2025) — 257 cards
5. Legends of the Force (July 2025) — 264 cards
6. Secrets of Power (November 2025) — 264 cards
7. A Lawless Time (March 2026) — 264 cards
8. Ashes of the Empire (July 2026) — announced
9. Homeworlds (2026) — announced

Total card pool is already large (~1,820+ cards before variants). The external API approach is validated — manual catalog management would be infeasible at this volume with a new set every 4 months.

### Aspects (Deckbuilding Color System)

| Aspect | Color | Notes |
|--------|-------|-------|
| Aggression | Red | Neutral aspect |
| Command | Green | Neutral aspect |
| Cunning | Orange/Yellow | Neutral aspect |
| Vigilance | Blue | Neutral aspect |
| Heroism | White | Moral aspect; only from leaders; mutually exclusive with Villainy |
| Villainy | Black | Moral aspect; only from leaders; mutually exclusive with Heroism |

**Leader provides 2 aspects, Base provides 1 aspect.** A deck has 3 total aspect icons. Cards played that lack a matching aspect cost +2 resources per missing icon — this is a gameplay cost, not a legality violation. The app should surface this as an informational warning, not a hard block.

### Twin Suns Format

An alternate 3-player format with different rules. Out of scope for v1 — Premier format is the primary competitive and casual format. Add format selector in v2.

### Draft and Sealed Formats

Different deck size minimum (30 cards instead of 50). Not relevant for a collection tracker targeting constructed play. Out of scope for v1.

---

## MVP Feature Priority

Based on the core value prop ("know what you own while building decks") and the competitive gap analysis, the MVP should deliver exactly these features:

**Must ship:**
1. Auth (account creation + login)
2. Card catalog browsing and search (API-driven, cached)
3. Collection add/edit by card (quantity per card)
4. CSV import — generic + SWUDB format
5. Deck builder with Leader / Base / Main Deck sections
6. Owned-count display on every card in deck builder
7. Missing cards highlighted in deck builder
8. "Filter to owned only" toggle in deck builder
9. SWU deck legality validation (1 Leader, 1 Base, min 50 cards, max 3 copies)
10. Cross-deck want list view
11. Want list export (CSV) and shareable URL

**Strongly defer:**
- Foil/variant tracking
- Sideboard (add after core deck building is validated)
- Aspect penalty indicator (nice-to-have; add after core shipped)
- Deck sharing (public URL) — low complexity, can include if time allows
- Price integration
- Camera scanning

---

## Sources

- SWU deck rules: [boargamer.com](https://boargamer.com/how-to-play-star-wars-unlimited-rules-deckbuilding-and-keywords/), [thefifthtrooper.com](https://thefifthtrooper.com/star-wars-unlimited-deckbuilding-and-aspects/), [starwarsunlimited.com Premier format](https://starwarsunlimited.com/how-to-play?chapter=premier)
- SWU set list and card types: [Star Wars: Unlimited Wikipedia](https://en.wikipedia.org/wiki/Star_Wars:_Unlimited)
- Card rarities and variants: [skillshotzgaming.com](https://skillshotzgaming.com/star-wars-unlimited-card-rarities/), [cardgamer.com](https://cardgamer.com/guides/star-wars-unlimited-card-rarities/)
- SWUDB features: [swudb.com](https://swudb.com/), [BGG thread](https://boardgamegeek.com/thread/3137573/swudb-deck-builder), [BGG collection thread](https://boardgamegeek.com/thread/3268496/collection-management-on-swudb)
- SWU Hyperbuild: [swuhyperbuild.com](https://swuhyperbuild.com/guides/getting-started/), [Google Play](https://play.google.com/store/apps/details?id=com.casanova.swuhyperspace&hl=en_US)
- StarWarsUnlimited.gg: [welcome post](https://starwarsunlimited.gg/welcome-to-starwarsunlimited-gg/)
- Individual tracker reference: [bergqvist.it](https://www.bergqvist.it/portfolio/2024/swucct/)
- SWU-DB API: [swu-db.com/api](https://www.swu-db.com/api)
- MTG ecosystem patterns: [GrimDeck comparison](https://grimdeck.com/blog/best-mtg-collection-tracker-deck-builder), [Archidekt collection tracker](https://archidekt.com/collection), [Deckbox](https://deckbox.org/), [Draftsim deck builder comparison](https://draftsim.com/best-mtg-deck-builder/)
- Archidekt collection-deck integration gaps: [BGG forum thread](https://archidekt.com/forum/thread/1557244/1)
