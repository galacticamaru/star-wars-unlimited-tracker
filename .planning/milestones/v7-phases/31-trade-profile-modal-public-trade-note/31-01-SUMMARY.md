---
phase: 31-trade-profile-modal-public-trade-note
plan: 01
subsystem: database
tags: [better-auth, drizzle, postgres, neon, schema-migration]

# Dependency graph
requires:
  - phase: 21-binder-variant-badges
    provides: user_trade_offerings / trade_manual_wants schema precedent, drizzle-kit push convention
provides:
  - "user.tradeNote nullable text column live in the Neon `user` table"
  - "Better Auth user.additionalFields.tradeNote (required: false) declared and wired to authClient.updateUser"
  - "authClient.updateUser({ tradeNote }) and session.user.tradeNote typed end-to-end via inferAdditionalFields<typeof auth>()"
affects: [31-03-profile-modal-write-path, 31-04-public-trade-note-display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Better Auth additionalFields paired 1:1 with a Drizzle schema column, applied via drizzle-kit push (not generate) per this repo's established convention"

key-files:
  created:
    - drizzle/0006_trade_note.sql
    - .planning/phases/31-trade-profile-modal-public-trade-note/deferred-items.md
  modified:
    - src/db/schema.ts
    - src/lib/auth.ts
    - src/lib/auth-client.ts
    - drizzle/meta/_journal.json

key-decisions:
  - "Hand-authored drizzle/0006_trade_note.sql instead of running drizzle-kit generate, because generate is blocked by pre-existing drizzle/meta drift (missing 0005_snapshot.json) unrelated to this plan's change — logged as a deferred item"
  - "Applied the schema change via npx drizzle-kit push (introspection-based, does not depend on drizzle/meta) and confirmed it idempotent by re-running it"

patterns-established:
  - "When drizzle-kit generate is blocked by meta/journal drift, hand-author the migration SQL matching drizzle-kit's standard ALTER TABLE output shape and apply via push, which diffs directly against the live DB"

requirements-completed: [BINDER-16, BINDER-17]

coverage:
  - id: D1
    description: "user.trade_note nullable column exists in the live Neon database"
    requirement: "BINDER-16"
    verification:
      - kind: other
        ref: "information_schema.columns query confirming trade_note (text, nullable) on the user table"
        status: pass
    human_judgment: false
  - id: D2
    description: "drizzle-kit push is idempotent after the column is applied (no pending changes on re-run)"
    requirement: "BINDER-16"
    verification:
      - kind: other
        ref: "npx drizzle-kit push (second run) — no ALTER/CREATE statements emitted"
        status: pass
    human_judgment: false
  - id: D3
    description: "Better Auth user.additionalFields.tradeNote declared with required: false, and authClient/session are typed for tradeNote with no as any cast"
    requirement: "BINDER-16"
    verification:
      - kind: unit
        ref: "npx tsc --noEmit (no errors in src/db/schema.ts, src/lib/auth.ts, src/lib/auth-client.ts)"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-07-20
status: complete
---

# Phase 31 Plan 01: Trade Note Storage & Typing Foundation Summary

**Nullable `trade_note` column live in Neon, paired with a Better Auth `additionalField` (`required: false`) and typed end-to-end via `inferAdditionalFields`, unblocking the modal write path and public read path.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-20T09:34:12Z (Task 1 commit)
- **Completed:** 2026-07-20T09:37:14Z (Task 3 commit)
- **Tasks:** 3/3
- **Files modified:** 6 (3 source files, 1 migration file created, 1 meta file, 1 deferred-items log)

## Accomplishments
- Added nullable `tradeNote: text('trade_note')` to the Drizzle `user` pgTable, paired in the same commit as the Better Auth `additionalFields.tradeNote` declaration (`required: false`) so the two never drift (RESEARCH Pitfall 1)
- Typed `session.user.tradeNote` and `authClient.updateUser({ tradeNote })` via `inferAdditionalFields<typeof auth>()` on the client, using a type-only `import type { auth }` to keep the Node-only `@/db` module out of the client bundle (RESEARCH Pitfall 4)
- Applied the column to the live Neon database via `npx drizzle-kit push`, confirmed live via a direct `information_schema.columns` query, and confirmed the push is idempotent on re-run

## Task Commits

Each task was committed atomically:

1. **Task 1: Pair the schema column with the Better Auth additionalField** - `f057743` (feat)
2. **Task 2: Type the additional field on the auth client** - `f8fd50c` (feat)
3. **Task 3: [BLOCKING] Generate migration and push the column to Neon** - `196e47e` (feat)

**Plan metadata:** (pending — final docs commit follows this summary)

## Files Created/Modified
- `src/db/schema.ts` - Added nullable `tradeNote` text column to the `user` pgTable
- `src/lib/auth.ts` - Added `user.additionalFields.tradeNote` (`{ type: "string", required: false, input: true }`) to the `betterAuth()` config
- `src/lib/auth-client.ts` - Added `inferAdditionalFields<typeof auth>()` plugin and a type-only `auth` import
- `drizzle/0006_trade_note.sql` - Additive migration: `ALTER TABLE "user" ADD COLUMN "trade_note" text;`
- `drizzle/meta/_journal.json` - Registered the `0006_trade_note` entry, mirroring the repo's existing (already-drifted) journal pattern
- `.planning/phases/31-trade-profile-modal-public-trade-note/deferred-items.md` - Logged the pre-existing `drizzle/meta` snapshot drift found while running Task 3

## Decisions Made
- `required: false` on the `tradeNote` additionalField is mandatory (not discretionary) per D-05/Pitfall 2 — allows an empty-string save to clear the note instead of being rejected as a missing required field
- Used `npx drizzle-kit push` as the apply mechanism (not `generate` + `migrate`), consistent with this repo's established convention documented in RESEARCH Pitfall 3
- Hand-authored the `0006_trade_note.sql` migration file rather than running `drizzle-kit generate`, because `generate` is blocked by a pre-existing `drizzle/meta` drift issue (see Deviations below) — the hand-authored SQL matches drizzle-kit's standard output shape for a single additive column

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `drizzle-kit generate` blocked by pre-existing `drizzle/meta` drift**
- **Found during:** Task 3 (Generate migration and push to Neon)
- **Issue:** `npx drizzle-kit generate` failed with `Interactive prompts require a TTY terminal` because `drizzle/meta/_journal.json` references a `0005_binder_variant_completeness` entry with no matching `0005_snapshot.json` file in `drizzle/meta/` (only `0000`–`0004` snapshots exist). This gap in the snapshot history makes `generate`'s diff-and-rename-detection logic ambiguous, forcing an interactive prompt that cannot be answered in a non-interactive shell. This drift pre-dates this plan and is unrelated to the `trade_note` change itself — it was already flagged as a risk in `31-RESEARCH.md` Pitfall 3.
- **Fix:** Used `npx drizzle-kit push` instead, which diffs directly against the live database via introspection and does not depend on `drizzle/meta/*.json`. Push succeeded cleanly and was confirmed idempotent on re-run. Hand-authored `drizzle/0006_trade_note.sql` (single `ALTER TABLE "user" ADD COLUMN "trade_note" text;` statement, matching drizzle-kit's standard output format) to satisfy the plan's "committed migration file" acceptance criterion, and added a corresponding `_journal.json` entry for continuity (no `0006_snapshot.json` was generated, consistent with the repo's existing drifted state — a full repair of the meta history is out of scope for this plan).
- **Files modified:** `drizzle/0006_trade_note.sql` (new), `drizzle/meta/_journal.json`
- **Verification:** `trade_note` column confirmed live in Neon via a direct `information_schema.columns` query (`{"column_name":"trade_note","is_nullable":"YES","data_type":"text"}`); `npx drizzle-kit push` re-run reported no pending statements
- **Committed in:** `196e47e` (Task 3 commit)
- **Out-of-scope follow-up logged:** Full repair of the `drizzle/meta` snapshot history (reconstructing `0005_snapshot.json` via `drizzle-kit pull` against the live DB) is documented in `deferred-items.md` — it is a meta-tooling repair, not a schema change, and out of this plan's scope.

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The auto-fix was necessary to complete Task 3 at all; it did not change the plan's actual deliverable (the column is live, the migration file is committed, the push path is idempotent). No scope creep — the underlying meta-drift repair was deliberately deferred rather than fixed inline.

## Issues Encountered
None beyond the Task 3 deviation documented above.

## User Setup Required
None - no external service configuration required. The Neon database write used the project's existing `.env.local` `DATABASE_URL`.

## Next Phase Readiness
- `user.tradeNote` is live in Neon and fully typed on both the Better Auth server config and the `authClient`/`session.user` client surface — Plan 03 (profile modal write path) can call `authClient.updateUser({ tradeNote })` directly with no `as any` cast
- Plan 04 (public read path) can extend `getUserIdByUsername` to select `user.tradeNote` directly — the column exists and is nullable as required by D-07 ("render nothing when no note is set")
- Known follow-up (non-blocking): `drizzle/meta` snapshot drift (missing `0005_snapshot.json`) should be repaired via `drizzle-kit pull` before any future phase relies on `drizzle-kit generate` running non-interactively — see `deferred-items.md`

---
*Phase: 31-trade-profile-modal-public-trade-note*
*Completed: 2026-07-20*

## Self-Check: PASSED
All created/modified files verified present on disk; all task commit hashes (f057743, f8fd50c, 196e47e) verified present in git log.
