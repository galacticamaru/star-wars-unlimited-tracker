# Deferred Items — Phase 31

Out-of-scope discoveries logged during execution, per executor scope-boundary rules.
Not fixed as part of this phase's tasks.

## drizzle/meta drift blocks `drizzle-kit generate` (pre-existing, found in 31-01 Task 3)

**Found during:** 31-01 Task 3 (generate migration + push to Neon).

**Issue:** `drizzle/meta/_journal.json` lists a `0005_binder_variant_completeness` entry, but
`drizzle/meta/0005_snapshot.json` does not exist (only `0000`–`0004` snapshots are present).
This pre-existing drift (documented as expected in `31-RESEARCH.md` Pitfall 3) causes
`npx drizzle-kit generate` to fall into an interactive "columns conflict" resolution prompt
(`Interactive prompts require a TTY terminal`) for ANY new schema change, even a simple
additive nullable column — because drizzle-kit can't unambiguously diff against a snapshot
history with a gap.

**Impact:** `drizzle-kit generate` cannot run non-interactively until the missing
`0005_snapshot.json` (and by extension a correct `0006_snapshot.json`) is reconstructed —
likely via `drizzle-kit pull` against the live Neon DB to produce an accurate baseline
snapshot, then reconciling it into the meta history. This is a meta-tooling repair, not a
schema change, and is out of scope for Phase 31.

**Workaround used this plan:** `npx drizzle-kit push` diffs directly against the live DB via
introspection and does NOT depend on `drizzle/meta/*.json` — it worked cleanly and was
confirmed idempotent on re-run. The `0006_trade_note.sql` migration file was hand-authored
(single `ALTER TABLE "user" ADD COLUMN "trade_note" text;` statement, matching drizzle-kit's
standard output shape) and a matching `_journal.json` entry was added for continuity, mirroring
the existing (already-drifted) repo pattern. `push` remains the reliable apply path for this
repo per RESEARCH Pitfall 3.

**Recommendation:** If migration `generate` is needed cleanly in a future phase, run
`drizzle-kit pull` first to reconcile `drizzle/meta/` against the live Neon schema.
