---
phase: 01-foundation
plan: 01
subsystem: scaffold
tags: [nextjs, drizzle, vitest, tooling, env]
dependency_graph:
  requires: []
  provides: [next-scaffold, drizzle-config, vitest-config, env-templates, dir-stubs]
  affects: [01-02, 01-03, 01-04]
tech_stack:
  added: [drizzle-orm@0.45.2, "@neondatabase/serverless@1.1.0", dotenv@17.4.2, drizzle-kit@0.31.10, tsx@4.21.0, vitest@4.1.5, "@vitejs/plugin-react@6.0.1", jsdom@29.1.1, "@testing-library/react@16.3.2", "@testing-library/dom@10.4.1", vite-tsconfig-paths@6.1.1]
  patterns: [app-router, drizzle-neon-http, vitest-jsdom]
key_files:
  created:
    - package.json (scripts: db:seed, db:push, db:generate, db:migrate, db:studio, test)
    - drizzle.config.ts
    - vitest.config.mts
    - .env.example
    - .gitignore
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/globals.css
    - src/db/.gitkeep
    - src/lib/sync/.gitkeep
    - scripts/.gitkeep
    - __tests__/.gitkeep
    - drizzle/.gitkeep
  modified:
    - tsconfig.json (paths: "@/*" -> "./src/*")
decisions:
  - vitest passWithNoTests: true added to config — vitest@4.x exits with code 1 when no test files found; passWithNoTests ensures zero-file runs exit 0 as plan requires
  - .gitignore updated with "!.env.example" negation — .env* wildcard was blocking .env.example from being committed
metrics:
  duration: ~15 minutes
  completed: 2026-05-04
  tasks_completed: 1
  files_created: 13
  files_modified: 2
---

# Phase 1 Plan 1: Bootstrap Next.js Project Summary

Next.js 16 App Router scaffold with Drizzle ORM config, Vitest test framework, environment file templates, and directory structure stubs — all tooling installed and `npm test --run` exits 0.

## What Was Created

### Configuration Files
- `drizzle.config.ts` — Drizzle ORM config pointing to `./src/db/schema.ts`, postgresql dialect, reads `DATABASE_URL` from `.env`
- `vitest.config.mts` — Vitest with jsdom environment, tsconfigPaths plugin, globals enabled, passWithNoTests: true
- `.env.example` — Documents `DATABASE_URL` (Neon pooled connection string) and `CRON_SECRET`
- `.gitignore` — Explicit `.env`, `.env.local`, `.env.production.local`, `.env*.local` entries + `!.env.example` negation

### Application Files
- `src/app/layout.tsx` — Root Next.js App Router layout (moved from `app/`)
- `src/app/page.tsx` — Placeholder home page (moved from `app/`)
- `src/app/globals.css` — Global CSS with Tailwind directives (moved from `app/`)

### Directory Stubs (for later plans)
- `src/db/.gitkeep` — Plan 01-02 will add `schema.ts` and `index.ts` here
- `src/lib/sync/.gitkeep` — Plan 01-03 will add `upsert-cards.ts` here
- `scripts/.gitkeep` — Plan 01-04 will add `seed.ts` here
- `__tests__/.gitkeep` — Plan 01-03 will add test files here
- `drizzle/.gitkeep` — drizzle-kit will generate migration files here

### package.json Scripts Added
```json
"db:seed": "tsx scripts/seed.ts",
"db:push": "drizzle-kit push",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"test": "vitest"
```

## Packages Installed

### Runtime Dependencies
| Package | Version |
|---------|---------|
| drizzle-orm | 0.45.2 |
| @neondatabase/serverless | 1.1.0 |
| dotenv | 17.4.2 |

### Dev Dependencies
| Package | Version |
|---------|---------|
| drizzle-kit | 0.31.10 |
| tsx | 4.21.0 |
| vitest | 4.1.5 |
| @vitejs/plugin-react | 6.0.1 |
| jsdom | 29.1.1 |
| @testing-library/react | 16.3.2 |
| @testing-library/dom | 10.4.1 |
| vite-tsconfig-paths | 6.1.1 |

## Deviations from Plan

### Pre-execution State
**Deviation:** `create-next-app` was run without `--src-dir` flag, placing `app/` at the project root instead of `src/app/`. All subsequent plans reference `src/app/`, `src/db/`, `src/lib/` paths.

**Fix applied (Step 0 — added before Task 2):**
- Moved `app/` → `src/app/` (layout.tsx, page.tsx, globals.css, favicon.ico)
- Updated `tsconfig.json` `paths`: `"@/*": ["./*"]` → `"@/*": ["./src/*"]`
- `next.config.ts` required no changes (Next.js auto-detects `src/app/` layout)
- Commit: `chore(01-01): move app dir into src/ to match plan layout` (ac5efc0)

### Auto-fixed Issues

**1. [Rule 1 - Bug] vitest@4.x exits code 1 with no test files**
- **Found during:** Step verification (`npm test -- --run`)
- **Issue:** vitest 4.x changed behavior — it exits with code 1 when no test files are found. The plan expects exit code 0 for the empty-test-file state.
- **Fix:** Added `passWithNoTests: true` to `vitest.config.mts` test configuration
- **Files modified:** `vitest.config.mts`
- **Commit:** included in `feat(01-01)` commit (61ea118)

**2. [Rule 2 - Missing config] .gitignore blocked .env.example from being committed**
- **Found during:** git add stage
- **Issue:** The existing `.env*` wildcard in `.gitignore` caught `.env.example`, preventing it from being tracked in git. The `.env.example` file must be committed as documentation.
- **Fix:** Added `!.env.example` negation line after the `.env*` pattern in `.gitignore`
- **Files modified:** `.gitignore`
- **Commit:** included in `feat(01-01)` commit (61ea118)

## Test Results

```
npm test -- --run

 RUN  v4.1.5

No test files found, exiting with code 0
```

Exit code: 0. Framework loads correctly; no test failures.

## Current State

Next.js 16 scaffold ready, all tooling installed. The project structure matches the recommended layout from RESEARCH.md. Plan 01-02 can now proceed to set up the Neon database connection and Drizzle schema.

## Threat Surface Scan

No new network endpoints or auth paths introduced in this plan. `.env` and `.env.local` are properly gitignored per T-01-01. `.env.example` is tracked with placeholder values only (no real secrets).

## Known Stubs

- `src/db/.gitkeep`, `src/lib/sync/.gitkeep`, `scripts/.gitkeep`, `__tests__/.gitkeep`, `drizzle/.gitkeep` — intentional empty directory markers; will be replaced by real files in Plans 01-02 through 01-04.

## Self-Check: PASSED

- `src/app/layout.tsx` exists: FOUND
- `tsconfig.json` has `"./src/*"`: FOUND
- `package.json` has `drizzle-orm`: FOUND
- `drizzle.config.ts` exists: FOUND
- `vitest.config.mts` exists: FOUND
- `.env.example` exists: FOUND
- Commits exist: ac5efc0 (src-dir fix), 61ea118 (tooling)
- `npm test -- --run` exits 0: CONFIRMED
