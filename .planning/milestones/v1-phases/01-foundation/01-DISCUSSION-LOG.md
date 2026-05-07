# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 1-Foundation
**Areas discussed:** Schema scope, Local dev database, Initial seeding, Sync granularity

---

## Schema scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full game data now | Capture all fields from the API in Phase 1: identity (name, subtitle, type, aspects, arena, traits, keywords, cost, power, HP, text) in card_definitions + physical (collector number, set, image URL, rarity) in card_printings. No migrations needed later. | ✓ |
| Minimal — Phase 2 needs only | Only capture: name, type, set, aspect, image URL. Simpler now, additive migration required in Phase 4. | |

**User's choice:** Full game data now

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sum variants — total owned per card identity | Store owned count on card_definitions (via user_collections). Reddit CSV import sums all variant columns automatically. | ✓ |
| Track per printing | Store owned count on card_printings. Captures which art/foil the user owns. Requires summing in every query. | |

**User's choice:** Sum variants — total owned per card identity

---

## Local dev database

| Option | Description | Selected |
|--------|-------------|----------|
| Neon for local dev too | Use a separate Neon database for dev (DATABASE_URL in .env.local). No Docker needed. Free tier is enough. | ✓ |
| Docker Postgres locally | Run Postgres in Docker for local dev, Neon for prod. Fully offline, but requires Docker Desktop. | |

**User's choice:** Neon for local dev too
**Notes:** User is new to Neon and Vercel — plan must include step-by-step setup guidance for both platforms.

---

## Initial seeding

| Option | Description | Selected |
|--------|-------------|----------|
| Manual seed script | `npm run db:seed` calls swu-db.com API and loads all cards. Run once after setup. Simple and debuggable. | ✓ |
| Cron job handles first run | Vercel Cron populates DB on first deploy. Simpler operationally, harder to debug. | |
| Admin trigger endpoint | Protected API route (e.g. /api/admin/sync) hit manually. Flexible but adds a route to secure or remove. | |

**User's choice:** Manual seed script

---

## Sync granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Full upsert every run | Fetch all cards, INSERT ... ON CONFLICT DO UPDATE every cron run. Simple logic, negligible overhead for ~1,000 cards. | ✓ |
| Incremental — new sets only | Track synced sets in DB, only fetch new ones. More efficient at scale, more complex logic. | |

**User's choice:** Full upsert every run

---

| Option | Description | Selected |
|--------|-------------|----------|
| Daily | Run once per day. More than frequent enough for a TCG with announced set releases. | ✓ |
| Weekly | Run once per week. Fine if a few days' delay on new cards is acceptable. | |

**User's choice:** Daily

---

## Claude's Discretion

- Next.js file structure (follows App Router conventions)
- Drizzle ORM migration strategy (`drizzle-kit push` for dev, `drizzle-kit migrate` for prod)
- Vercel Cron schedule syntax and `vercel.json` configuration
- swu-db.com API endpoint discovery and field mapping (researcher task)
- Seed script and cron job share core upsert logic (DRY — not a user decision, a quality call)

## Deferred Ideas

None.
