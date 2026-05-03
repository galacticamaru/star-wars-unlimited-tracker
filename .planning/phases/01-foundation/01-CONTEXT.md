# Phase 1: Foundation - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers: a working Next.js 16 (App Router) project scaffold, a Drizzle ORM schema on Neon PostgreSQL with the full two-table card model, a `npm run db:seed` script that populates the database from the swu-db.com API, and a Vercel Cron job that keeps the catalog current with daily upserts.

This phase does NOT build any UI or user-facing features — it is infrastructure only. The output is a running app (`npm run dev` succeeds), a populated database, and a working sync pipeline.

</domain>

<decisions>
## Implementation Decisions

### Schema Scope
- **D-01:** Capture full game data in Phase 1 — do not defer fields to later phases. Both `card_definitions` and `card_printings` should be populated with all meaningful fields from the swu-db.com API in one pass.
- **D-02:** `card_definitions` holds game identity: name, subtitle, type, aspects, arena, traits, keywords, cost, power, HP, card text, unique flag, and the card's canonical identifier from swu-db.com.
- **D-03:** `card_printings` holds physical variant data: collector number (e.g. `SOR-001`), set code, rarity, image URL, and a foreign key to `card_definitions`.
- **D-04:** Owned count lives on `card_definitions` (as a column in the future `user_collections` table keyed to `card_definition_id`), NOT on `card_printings`. Variant tracking is v2 scope — v1 sums all printings into a single owned count per card identity.
- **D-05:** Token cards are filtered by T-prefixed collector numbers (e.g., `SOR-T001`). Exclude all T-prefixed cards from every catalog/deck-builder query.

### Local Development Database
- **D-06:** Use Neon for both local dev and production. No Docker required. Local dev connects to a separate Neon database (or branch) via `DATABASE_URL` in `.env.local`. The plan must include step-by-step Neon account and project setup — the user is new to Neon.

### Initial Seeding
- **D-07:** First-time database population uses a manual seed script: `npm run db:seed`. The script calls the swu-db.com API, fetches all card sets and cards, and upserts them into the database. Run once locally against the dev database, or via Vercel CLI post-deploy for production.
- **D-08:** The cron job does NOT handle first-time seeding — it runs ongoing upserts only. This keeps the seed script predictable and debuggable on first setup.

### Sync Granularity
- **D-09:** The Vercel Cron sync job does a full upsert every run: fetch all cards from swu-db.com, INSERT ... ON CONFLICT DO UPDATE. No incremental tracking needed — the card catalog is small (~1,000 cards) and upsert overhead is negligible.
- **D-10:** Cron frequency: daily. New SWU sets are announced weeks in advance — daily is more than sufficient. Stays within Vercel free tier cron limits.

### Environment / Setup
- **D-11:** The user is new to both Neon and Vercel. The plan must include explicit step-by-step setup guidance: creating a Neon project, copying the connection string, configuring Vercel environment variables, and deploying. Do not assume familiarity with either platform.

### Claude's Discretion
- Next.js file structure follows App Router conventions (no prescriptive layout imposed by user)
- Drizzle ORM migration strategy (standard `drizzle-kit push` for dev, `drizzle-kit migrate` for prod)
- Vercel Cron schedule syntax and configuration in `vercel.json`
- swu-db.com API endpoint discovery and field mapping (researcher task)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/PROJECT.md` — project goals, core value, constraints, key decisions
- `.planning/ROADMAP.md` — phase goals, success criteria, dependency order
- `.planning/REQUIREMENTS.md` — CATALOG-04 is the Phase 1 requirement

### Architecture Rules (from CLAUDE.md)
- `CLAUDE.md` §Key Architecture Rules — non-negotiable rules: two-table model, no per-request API calls, LEFT JOIN collection overlay, token filter convention

### External APIs
- swu-db.com API — researcher must explore and document: which endpoints return card lists, the response shape, set/card relationship, how collector numbers are formatted, and how to detect token cards. No public API docs URL known at discussion time — researcher should discover via the website or existing community documentation.

No external ADRs or specs beyond the above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — project is a blank repository (only CLAUDE.md, IDEAS.md, README.md exist)

### Established Patterns
- None yet — Phase 1 establishes the patterns all subsequent phases follow

### Integration Points
- This phase is the foundation: every subsequent phase consumes the `card_definitions` and `card_printings` tables established here

</code_context>

<specifics>
## Specific Ideas

- The seed script and cron sync job should share the same core upsert logic (a single function, not duplicated code)
- Vercel Cron is the deployment target for the sync job — not a separate worker or external scheduler

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-05-03*
