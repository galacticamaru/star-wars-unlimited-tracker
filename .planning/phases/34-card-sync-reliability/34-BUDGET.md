# Phase 34: Confirmed Execution Budget

This record closes Open Question 1 / Assumption A2 in `34-RESEARCH.md`: whether this specific
Vercel project (`star-wars-unlimited-tracker`) has Fluid Compute enabled, and what its actual
Function Max Duration is, rather than assuming the platform default applies.

The developer confirmed the following values directly from Vercel Settings -> Functions and
Settings -> Cron Jobs:

CONFIRMED_MAX_DURATION_SECONDS: 300
SOFT_DEADLINE_SECONDS: 240
FLUID_COMPUTE: enabled
CRON_ENTRY_COUNT: 1
CONFIRMED_ON: 2026-08-16

## Why this number matters

D-08's soft deadline is 80% of `maxDuration` (300 * 0.8 = 240 seconds). A wrong ceiling
means the function is killed mid-run with no response and therefore no failure signal at
all — the exact defect SYNC-03 exists to close. If the soft deadline were derived from an
unconfirmed or incorrect ceiling, the deadline could fire too late (or never), the Vercel
platform would terminate the invocation with no status code and no logs written after the
kill, and the run would silently reintroduce the "partial run that looks complete" failure
mode this phase removes. Deriving both `maxDuration` and the soft deadline from this
confirmed record, rather than from the platform default, is what makes the derivation
correct and auditable.

The reported ceiling matches the researched default (300 seconds), so no correction to
`34-07`'s planned `maxDuration` value is needed. The cron entry count matches the
single-entrypoint design this phase assumes (1), so no contradiction with the Vercel Hobby
one-cron-per-day constraint was found.

`34-07` reads `CONFIRMED_MAX_DURATION_SECONDS` and `SOFT_DEADLINE_SECONDS` from this file as
the single source for the `export const maxDuration` value and the D-08 soft-deadline
threshold.
