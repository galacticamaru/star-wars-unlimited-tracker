# Star Wars Unlimited Tracker — Claude Guide

## Project

A single-user web app for tracking a Star Wars: Unlimited TCG collection and building decks. The core value: see exactly which cards you own while building decks, and know what you're missing.

**Planning docs:** `.planning/` — read `PROJECT.md`, `ROADMAP.md`, and `STATE.md` for current context.

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** PostgreSQL via Neon, using Drizzle ORM
- **Auth:** Deferred to v2 — v1 is single-user, no login
- **Card data:** swu-db.com API, cached locally (never proxy per user request)
- **Deployment:** Vercel (Vercel Cron for card sync job)
- **Testing:** Vitest

## Key Architecture Rules

1. **Two-table card model is non-negotiable.** `card_definitions` (game identity) + `card_printings` (physical variant). Never model variants as a boolean on the cards table — that causes a rewrite.
2. **Never call swu-db.com in the user request path.** Sync to local DB on a schedule; all user queries hit the local cache.
3. **Collection overlay = LEFT JOIN.** Card catalog queries for the user LEFT JOIN `user_collections` to return `owned_count` inline — no second query.
4. **Deck legality is pure TypeScript business logic.** Not UI logic, not DB constraints. Testable with Vitest independently.
5. **Database sessions for auth (when added).** Not JWT — sessions must be invalidatable.
6. **Filter tokens from catalog.** Token cards use T-prefixed collector numbers; exclude them from all deck-buildable card queries.

## GSD Workflow

This project uses the GSD planning workflow.

**Current state:** See `.planning/STATE.md`
**Roadmap:** `.planning/ROADMAP.md`
**Requirements:** `.planning/REQUIREMENTS.md`

### Phase execution order

```
Phase 1: Foundation      → Phase 2: Card Catalog → Phase 3: Collection
Phase 4: Deck Builder    → Phase 5: Want List
```

### Commands

- `/gsd-discuss-phase <N>` — gather context before planning a phase
- `/gsd-plan-phase <N>` — create a detailed execution plan for a phase
- `/gsd-execute-phase <N>` — execute plans in a phase
- `/gsd-progress` — check current status and advance workflow
- `/gsd-verify-work` — validate a completed phase against success criteria

### Commit convention

Planning doc commits: `docs: <description>`
Code commits: follow conventional commits (`feat:`, `fix:`, `chore:`, etc.)

## v1 Scope Boundaries

**In scope:** Card catalog browser, collection tracking, CSV imports (generic + Reddit community spreadsheet format), deck builder with legality validation + ownership overlay, want list.

**Out of scope (v2):** Auth / multi-user, SWUDB CSV import, export/share, camera scanning, sideboard, variant/foil tracking, social features.
