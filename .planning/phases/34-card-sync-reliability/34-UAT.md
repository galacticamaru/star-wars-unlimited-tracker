---
status: testing
phase: 34-card-sync-reliability
source: [34-VERIFICATION.md]
started: 2026-08-20T06:45:00Z
updated: 2026-08-20T06:45:00Z
---

## Current Test

number: 1
name: A real deployed GET /api/cron/sync-cards processes every non-token set within the confirmed 300s Vercel budget
expected: |
  A JSON body with success/cards/prices/duration arrives inside the budget window —
  the run returns a response (200 or 500) rather than being killed mid-run with no response.
awaiting: user response

## Tests

### 1. Deployed cron run completes inside the 300s Vercel budget
expected: A JSON body with success/cards/prices/duration arrives inside the budget window; the run returns a response (200 or 500) rather than being killed mid-run with no response
result: [pending]

### 2. Catalog freshness holds under the real daily cron schedule (SYNC-02)
expected: sync-status's ageHours for each set stays under 24 on a normal day; ageHours only exceeds 24 following a genuine missed/failed run
result: [pending]

### 3. Freshness is answerable by a single authenticated curl (SYNC-04)
expected: `curl -H "Authorization: Bearer $CRON_SECRET" <deploy>/api/cron/sync-status` returns the fresh/sets body described in the code, with no Neon console needed
result: [pending]

### 4. Quick-add shortfall is visible in the rendered UI
expected: Banner reads "Added N of M ... — K unavailable" when skipped.length > 0, rather than a plain success banner
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
