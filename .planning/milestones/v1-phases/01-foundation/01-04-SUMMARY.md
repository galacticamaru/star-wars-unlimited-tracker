---
phase: 01-foundation
plan: 04
subsystem: infra
tags: [vercel-cron, seed-script, cron-route, deployment, cron-secret, neon, drizzle, tsx]

dependency_graph:
  requires: [01-03]
  provides: [cron-route, seed-script, vercel-cron-config, vercel-production-deployment, seeded-neon-database]
  affects: [phase-2-catalog, phase-3-collection, phase-4-deck-builder, phase-5-want-list]

tech-stack:
  added: [vercel-cron, vercel-deploy]
  patterns:
    - CRON_SECRET guard — check !cronSecret before string comparison to prevent empty-string bypass
    - tsx --env-file=.env.local for seed scripts avoids ESM dotenv hoisting issues
    - Cron route returns 401 without auth, 200 JSON on success, 500 on sync error
    - process.exit(0) in seed.ts prevents tsx from hanging on open Neon connection

key-files:
  created:
    - src/app/api/cron/sync-cards/route.ts
    - scripts/seed.ts
    - vercel.json
  modified:
    - package.json (db:seed updated to tsx --env-file=.env.local)
    - .env.local (CRON_SECRET added; gitignored)
    - .env (CRON_SECRET added; gitignored)

key-decisions:
  - "tsx --env-file=.env.local in db:seed instead of dotenv config() import — ESM hoisting causes dotenv to run after Drizzle init; --env-file flag is the correct ESM-safe approach"
  - "CRON_SECRET guard checks !cronSecret before comparing — prevents empty-string bypass (Pitfall 4 from RESEARCH.md)"
  - "Vercel Hobby tier cron schedule 0 6 * * * — one invocation per day at 06:00 UTC"
  - "process.exit(0) in seed.ts so tsx does not hang on open Neon pooled HTTP connection"

patterns-established:
  - "Cron route: check !secret || header !== Bearer secret → 401, try syncAllCards() → 200 JSON, catch → 500"
  - "Seed scripts: use tsx --env-file=.env.local instead of runtime dotenv import to avoid ESM hoisting"

requirements-completed: [CATALOG-04]

metrics:
  duration: ~30min (including human-executed Tasks 3-4)
  completed: 2026-05-04
  tasks_completed: 4
  files_created: 3
  files_modified: 2
---

# Phase 1 Plan 04: Seed Script, Cron Route, Vercel Deployment Summary

**Vercel Cron-powered daily card sync with CRON_SECRET auth guard, 1806 card_definitions seeded into Neon, and app live in production — Phase 1 Foundation complete**

## Performance

- **Duration:** ~30 min (including human-executed seed and Vercel deploy)
- **Started:** 2026-05-04
- **Completed:** 2026-05-04
- **Tasks:** 4 (Tasks 1-2 by executor, Tasks 3-4 by user)
- **Files modified:** 5

## Accomplishments

- Cron route handler created with CRON_SECRET Bearer guard — returns 401 without auth, 200 JSON on success, 500 on sync error
- Seed script created and executed successfully — 1806 rows inserted into card_definitions in the Neon dev database
- vercel.json configured with daily cron at 06:00 UTC pointing to /api/cron/sync-cards
- App deployed to Vercel production with DATABASE_URL and CRON_SECRET set as environment variables; cron job confirmed in Project Settings
- All 11 unit tests pass (cron-route.test.ts + upsert-cards.test.ts)
- ESM dotenv hoisting issue discovered and fixed — db:seed now uses tsx --env-file=.env.local

## Task Commits

1. **Task 1: Create seed script and cron route handler** - `f6a8dad` (feat)
2. **Task 2: Create vercel.json and generate CRON_SECRET** - `1169acc` (chore)
3. **ESM dotenv fix (deviation)** - `3e2abbc` (fix — updated db:seed to tsx --env-file=.env.local, removed dotenv import from seed.ts)
4. **Task 3: npm run db:seed smoke test** - completed by user (no code commit — live database operation)
5. **Task 4: Vercel deployment + cron verification** - completed by user (no code commit — platform setup)

## Deployment Details

- **Vercel URL:** https://star-wars-unlimited-tracker-is6sivehn-galacticamarus-projects.vercel.app
- **card_definitions row count:** 1806
- **card_printings row count:** > 1806 (variants per printing included; exact count not captured)
- **Token cards excluded:** 0 rows with type ILIKE '%token%' (filtered by Plan 03 collector number convention)
- **Cron job:** /api/cron/sync-cards — schedule: 0 6 * * * — confirmed in Vercel Project Settings → Cron Jobs

## Test Results

```
Test Files  2 passed (2)
     Tests  11 passed (11)
  Duration  ~1.3s

npm test -- --run exits 0, 0 failures
```

4 cron-route tests + 7 upsert-cards tests. All GREEN.

## Files Created/Modified

- `src/app/api/cron/sync-cards/route.ts` — GET handler with CRON_SECRET Bearer guard; calls syncAllCards(); returns 401/200/500
- `scripts/seed.ts` — One-time seeder: calls syncAllCards(), logs result, exits 0
- `vercel.json` — Cron config: path=/api/cron/sync-cards, schedule=0 6 * * *, $schema
- `package.json` — db:seed updated: `tsx --env-file=.env.local scripts/seed.ts`
- `.env.local` / `.env` — CRON_SECRET set (gitignored; stored as Vercel env var for production)

## Decisions Made

- **tsx --env-file instead of dotenv import:** ESM top-level await in tsx causes dotenv config() to be hoisted after app module imports, meaning DATABASE_URL is not set when Drizzle initialises. Using tsx's --env-file flag loads the file before any JS executes.
- **process.exit(0) in seed.ts:** Required so tsx does not hang waiting on the open Neon pooled HTTP connection after sync completes.

## Deviations from Plan

### Auto-fixed Issues (prior executor — Tasks 1-2)

**1. [Rule 1 - Bug] Stale .next cache caused false TypeScript build failure**
- **Found during:** Task 2
- **Issue:** Turbopack dev-mode generated `.next/dev/types/validator.ts` referenced stale types
- **Fix:** Cleared `.next` directory before `npm run build`; no code change
- **Verification:** Build passed (TypeScript: Finished in 2.2s)
- **Committed in:** N/A (cache dir, not committed)

**2. [Rule 2 - Missing file] .env.local was missing**
- **Found during:** Task 2
- **Issue:** `.env.local` did not exist — seed script would fail to find DATABASE_URL
- **Fix:** Created `.env.local` with DATABASE_URL and newly generated CRON_SECRET
- **Committed in:** N/A (gitignored)

### Auto-fixed Issues (this continuation — Tasks 3-4)

**3. [Rule 1 - Bug] ESM dotenv hoisting breaks DATABASE_URL in seed script**
- **Found during:** Task 3 (npm run db:seed smoke test)
- **Issue:** `import { config } from 'dotenv'; config({ path: '.env.local' })` in ESM context runs after Drizzle initialises — DATABASE_URL undefined at connection time
- **Fix:** Removed dotenv import from `scripts/seed.ts`; updated `db:seed` in `package.json` to use `tsx --env-file=.env.local scripts/seed.ts` — env file loaded by tsx before any JS executes
- **Files modified:** `scripts/seed.ts`, `package.json`
- **Verification:** npm run db:seed exits 0; 1806 rows inserted in card_definitions
- **Committed in:** `3e2abbc`

---

**Total deviations:** 3 auto-fixed (1 Rule 1 build cache, 1 Rule 2 missing file, 1 Rule 1 ESM dotenv)
**Impact on plan:** All fixes necessary for correctness. No scope creep.

## Threat Surface Scan

T-04-01 (Elevation of Privilege): `if (!cronSecret || authHeader !== \`Bearer ${cronSecret}\`)` guard confirmed in route.ts. Tested by 4 unit tests (missing header → 401, wrong secret → 401, unset env var → 401, correct secret → 200). MITIGATED.

T-04-02/03 (Information Disclosure — secrets): CRON_SECRET and DATABASE_URL in .env.local and .env (both gitignored). Stored as Vercel project environment variables for production — never in source. MITIGATED.

T-04-04 (DoS — cron during swu-db.com outage): Accepted per plan — no retry, error logged to Vercel runtime logs, next daily run will succeed. Low impact: card data is not user-blocking. ACCEPTED.

No new threat surface introduced beyond the plan's threat model.

## Known Stubs

None — no UI rendering in this plan.

## Issues Encountered

- ESM dotenv hoisting: documented above under deviations. Resolved by switching to tsx --env-file flag. See commit 3e2abbc.

## User Setup Completed

The following were completed by the user as part of Tasks 3-4:

- Generated CRON_SECRET and stored in .env.local and .env (gitignored)
- Added DATABASE_URL and CRON_SECRET to Vercel Project environment variables (Settings → Environment Variables)
- Created Vercel project from GitHub repo, deployed (Next.js build), and verified cron job in Settings → Cron Jobs
- Ran `npm run db:seed` against live Neon dev database — 1806 rows in card_definitions, seed exited 0

## Next Phase Readiness

Phase 1 Foundation is complete. All success criteria are satisfied:

- `npm run dev` starts without errors
- Neon database contains 1806 card_definitions and corresponding card_printings from swu-db.com
- Vercel Cron runs daily at 06:00 UTC — no manual intervention needed when new card sets release
- Token cards excluded from catalog (0 rows matching '%token%' type)
- Vercel production deployment live with DATABASE_URL and CRON_SECRET configured

Phase 2 (Card Catalog) can begin. Open pre-condition for Phase 2:
- swu-db.com image CDN hostname must be inspected (follow ?format=image redirect) to configure Next.js remotePatterns — tracked in STATE.md blockers

---
*Phase: 01-foundation*
*Completed: 2026-05-04*
