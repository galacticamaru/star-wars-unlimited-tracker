# Phase 34: Card Sync Reliability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-16
**Phase:** 34-Card Sync Reliability
**Areas discussed:** Freshness surface (SYNC-04), Failure semantics (SYNC-03), Price sync in scope?, DEBT-05 correction (LAW deck)

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Freshness surface (SYNC-04) | Where the operator looks to see which sets last synced and when | ✓ |
| Failure semantics (SYNC-03) | What counts as a failed run and how the operator finds out | ✓ |
| Price sync in scope? | Whether the shared-invocation price sync gets the same treatment as cards | ✓ |
| DEBT-05 correction (LAW deck) | Source of truth for the corrected list and runtime handling of unresolvable cards | ✓ |

**User's choice:** All four areas.

---

## Freshness surface (SYNC-04)

### Q1 — Where do you actually go to check catalog freshness?

| Option | Description | Selected |
|--------|-------------|----------|
| Secret-guarded JSON route (Recommended) | GET status endpoint behind the same Bearer CRON_SECRET guard as route.ts:12. One curl, no UI, pollable by an uptime monitor | ✓ |
| In-app page behind auth | An /admin/sync page. Nicer on a phone, but the app has no admin-role concept — every authed user is equal | |
| Cron response + logs only | Enrich the run's JSON response, read it in Vercel logs. Cheapest, but only visible right after a run fires | |

**User's choice:** Secret-guarded JSON route.

### Q2 — Where should that route read "last synced" from?

| Option | Description | Selected |
|--------|-------------|----------|
| Derive from card_printings (Recommended) | MAX(updated_at) GROUP BY set_code. No migration. upsert-cards.ts:168 sets updated_at on every conflict-update, so it moves on every successful touch. Blind spot: a failed set is invisible, it just looks old | ✓ |
| New sync-run table | A row per set per run recording attempted/succeeded/failed. Makes repeated failure explicit. Costs a migration and writes during the run being squeezed for budget | |
| Both | Derived timestamps plus run history. Most complete, most work, arguably overlapping for a single-operator app | |

**User's choice:** Derive from card_printings.
**Notes:** The blind spot is covered by Q3's staleness verdict — a set that failed to fetch surfaces as stale.

### Q3 — Should the status route render a verdict, or just report the raw data?

| Option | Description | Selected |
|--------|-------------|----------|
| Verdict + per-set detail (Recommended) | Top-level `fresh` against SYNC-02's 24h window, plus per-set { setCode, lastSyncedAt, ageHours, stale }. Closes the failed-set blind spot | ✓ |
| Raw per-set data only | Just { setCode, lastSyncedAt } oldest-first. No threshold baked in, but you do the arithmetic each time | |
| Verdict only | { fresh, stalestSet, stalestAgeHours }. Terse enough to alert on, but you need detail the moment it's false | |

**User's choice:** Verdict + per-set detail.

### Q4 — Should the status route also compare against the upstream swu-db API?

| Option | Description | Selected |
|--------|-------------|----------|
| DB-only (Recommended) | No upstream fetch. Fast, no rate-limit exposure, can't fail because swu-db is down | ✓ |
| Include upstream count check | Compare printings-in-DB vs numberCards to catch a truncated payload. Catches drift a timestamp can't, but couples the status route to the same flaky upstream | |
| DB-only route, count check inside the sync run | Status stays cheap; the run itself treats a count shortfall as that set failing | |

**User's choice:** DB-only.

---

## Failure semantics (SYNC-03)

### Q1 — One set fails to fetch mid-run. What should the run do?

| Option | Description | Selected |
|--------|-------------|----------|
| Continue, then fail the response (Recommended) | Keep the `continue` at upsert-cards.ts:204 so other sets land, but end non-2xx because setsProcessed < setsTotal | ✓ |
| Abort immediately | First failure throws, whole run 500s. Unambiguous, but one flaky set costs every set behind it — how six weeks of drift happened | |
| Continue and still succeed if most sets landed | Fail only below a threshold. Fewer false alarms, but reintroduces the partial-looks-complete shape SYNC-03 exists to kill | |

**User's choice:** Continue, then fail the response.

### Q2 — How do you find out about a failure, given Vercel won't email on a cron 500 on Hobby?

| Option | Description | Selected |
|--------|-------------|----------|
| Rely on the status route (Recommended) | Run 500s honestly and logs failed sets; operator or a free uptime monitor polls the SYNC-04 route. Detection becomes pull, not push. No new dependency | ✓ |
| Add a push notification | Discord/Slack webhook or email on failure. True push, but adds an outbound integration, a secret, and a new failure mode inside the failure handler | |
| Structured logs only | Fail loudly and log failed set codes; check Vercel logs when something looks off — which is exactly the signal that was missing for six weeks | |

**User's choice:** Rely on the status route.

### Q3 — Should an incomplete price sync also fail the run's verdict?

| Option | Description | Selected |
|--------|-------------|----------|
| One verdict, both count (Recommended) | cards {processed,total} and prices {processed,total}; any shortfall is non-2xx and the body names which half broke. Requires prices.ts:101 to stop swallowing per-set errors | ✓ |
| Cards fail the run, prices advisory | SYNC-01/02/03 are written about card data; a stale price is cosmetic. But price drift could then go unnoticed indefinitely | |
| Both count, but prices only if cards succeeded | Suppress the price verdict as noise when cards already failed. Cleaner signal, more conditional logic in a thing whose value is bluntness | |

**User's choice:** One verdict, both count.

### Q4 — A function killed at maxDuration returns no response at all. Handle that?

| Option | Description | Selected |
|--------|-------------|----------|
| Soft deadline inside the run (Recommended) | At ~80% of maxDuration stop starting new sets and return the non-2xx report listing what didn't process. Reports and stops; does not resume, so it stays clear of deferred SYNC-05 | ✓ |
| Set maxDuration, accept silent kills | Just add the export, rely on the status route going stale next morning. Simplest, but "it stopped and nobody was told" is the failure mode that started this phase | |
| Soft deadline + record the cutoff point | Also persist unprocessed sets so the next run resumes there. That persistence is the front half of SYNC-05 — explicitly deferred | |

**User's choice:** Soft deadline inside the run.

---

## Price sync in scope?

**Finding presented before questions:** `prices.ts:59` hardcodes `activeSets = ['SOR','SHD','TWI','JTL','SEC','LAW','IBH']`, omitting ASH, LOF, and TS26 — sets in the catalog and referenced by shipped spotlight decks (`starter-decks.ts:1016+`). Those cards have never had a price synced. Card sync derives its set list from the API; prices don't.

### Q1 — Fix the hardcoded price set list here?

| Option | Description | Selected |
|--------|-------------|----------|
| Derive from the same set list as cards (Recommended) | Drop the array, iterate the non-token sets syncAllCards() already fetched. A new set can never again be silently absent from pricing. Reads on SYNC-02 | ✓ |
| Just add the three missing codes | Two-line fix, zero risk to the run's shape — but the next set released is silently missing again | |
| Leave it — out of scope | Clean boundary, but conflicts with the verdict decision (prices count toward pass/fail) over a knowingly incomplete set list | |

**User's choice:** Derive from the same set list as cards.

### Q2 — Batch the price writes too, or only the card upserts?

| Option | Description | Selected |
|--------|-------------|----------|
| Batch both (Recommended) | prices.ts:78 is the identical round-trip pattern, now over more sets after Q1. Collapse to one multi-row UPDATE ... FROM (VALUES ...) per set | ✓ |
| Cards only | Smaller blast radius — but prices are inside the same 1-cron budget, so timeout risk grows on the other side | |

**User's choice:** Batch both.

### Q3 — Keep the hardcoded 1s inter-set sleep at prices.ts:97-100?

| Option | Description | Selected |
|--------|-------------|----------|
| Drop it (Recommended) | Its own comment concedes swu-db specifies no strict limits; the card sync hits the same host with no delay and has never been rate-limited. Reclaims ~11s | ✓ |
| Keep it | Cheap insurance against a 429 from an API you don't control, now that being rate-limited costs a failed verdict | |
| Replace with retry-on-429 | Back off only when pushed back; also addresses the no-retries item at CONCERNS.md:144 — but broader than batching + loud failure | |

**User's choice:** Drop it.

---

## DEBT-05 correction (LAW deck)

**Finding presented before questions:** The recorded state of DEBT-05 is stale on every point. The 9 "unknowns" were named cards left as `LAW-???` placeholders in commit `8ca6265` — Jabba's Guard ×3, Skiff Cargo Hold ×3, Underworld Connections ×2, Cunning Deal ×3, Payoff ×2, Bargaining for Life ×3, Boushh's Thermals ×3, Commanding Presence ×2, Infiltration Plan ×3 — not missing collector numbers. Commit `eeb1b6b` (2026-05-23) states it resolved all of them, and both LAW decks now carry 25 entries totalling exactly 52 cards with no TODOs. `CONCERNS.md:112` names a deck (`Spotlight - Kessel Run`) that does not exist and blames a DB gap the roadmap already disproved. What was never done is proving the substituted numbers resolve.

### Q1 — What should DEBT-05 actually deliver?

| Option | Description | Selected |
|--------|-------------|----------|
| Verify against the live catalog, then close (Recommended) | Query card_printings for every collectorNumber in both LAW decks, confirm all 52 resolve, correct only what fails. The pattern RETROSPECTIVE.md:200 credits Phase 33 with | ✓ |
| Re-derive from the official decklist | Rebuild both entries from the published lists. Highest confidence in card identity, but assumes eeb1b6b was wrong when it may just be unverified | |
| Name-match every entry, not just resolve it | Confirm the resolved card's name matches the intended card. Catches a valid-but-wrong number; the git history supplies the intended names for exactly the 9 | |

**User's choice:** Verify against the live catalog, then close.

### Q2 — Verify only the two LAW decks, or all 15 quick-add decks?

| Option | Description | Selected |
|--------|-------------|----------|
| All decks (Recommended) | Nearly free once the check exists; the silent skip at starter-deck/route.ts:61 applies identically to all. eeb1b6b rewrote 6 starter and 8 spotlight decks in one unverified pass — LAW is just the one that got noticed | ✓ |
| LAW only | Stays inside DEBT-05's literal wording — but you'd have built the tool that would find another broken deck and chosen not to look | |

**User's choice:** All decks.

### Q3 — One-off, or something that keeps running?

| Option | Description | Selected |
|--------|-------------|----------|
| Committed test (Recommended) | A Vitest test walking starterDecks[] asserting every collectorNumber resolves. Regression-proof. Needs a DB-backed test path the suite may not have (prices.test.ts is pure unit) — a real cost | ✓ |
| One-off script | A scripts/ entry run manually, matching how Phase 33's ASH verification was done. No test-infra risk, but nothing stops the next hand-edited deck drifting | |
| Static assertion, no DB | Shape only — 52 cards, 1 leader + 1 base, no duplicates. Runs anywhere, can't catch a well-formed number that doesn't exist | |

**User's choice:** Committed test.

### Q4 — Change the runtime silent skip at starter-deck/route.ts:59-61?

| Option | Description | Selected |
|--------|-------------|----------|
| Report skipped cards in the response (Recommended) | Still add what resolves, but return skipped collector numbers so the UI can say "added 47 of 50, 3 unavailable". The silent skip is how DEBT-05 hid for three months | ✓ |
| Leave it silent | With a committed test the branch should be dead code; touching the UI is unnecessary scope. Costs the safety net if the test is ever skipped | |
| Log server-side only | console.warn the skipped numbers. Cheap, but CONCERNS.md:137 already flags nobody watches these logs | |

**User's choice:** Report skipped cards in the response.

---

## Claude's Discretion

- **`revalidateTag('cards')` on a partial run** — not put to the user; recorded as an assumption in CONTEXT.md. It should still fire on a failed-verdict run, because the sets that did succeed genuinely changed. The failure signal belongs in the response and the freshness route, not in withheld cache invalidation.
- **Correcting `CONCERNS.md:112`** — the stale DEBT-05 entry gets updated to match the findings above, rather than left as a misleading map entry.
- **Batch sizing for the multi-row upserts** — Neon/Postgres parameter limits and chunking strategy left to the planner.

## Deferred Ideas

- Push notification on sync failure (webhook/email) — declined under Failure Q2; the status route is designed as the substrate for it later
- A sync-run history table — declined under Freshness Q2; overlaps SYNC-05's checkpointing
- Upstream count verification (printings-in-DB vs `numberCards`) — declined under Freshness Q4 to keep the status route cheap and independent
- Fetch timeouts and retry/backoff against swu-db (`CONCERNS.md:142-147`) — resilience work, out of scope
- Retry-on-429 replacing the removed sleep — same resilience bucket, raised under Prices Q3
- The `Normal`-variant-only price filter (`prices.ts:73`) and the fixed 0.92 USD→EUR proxy (`prices.ts:50`) — offered as follow-ups, not pursued; pricing-accuracy questions, not reliability
- Structured logging / error tracking (`CONCERNS.md:135-140`) — the reason logs alone were rejected as a detection channel

## Reviewed Todos (not folded)

- `2026-07-20-stale-trade-availability-after-collection-add-on-binder-mana.md` — matched at 0.9 by keyword overlap, but `.planning/REQUIREMENTS.md:123` explicitly assigns it to Phase 35 where CATALOG-07 subsumes it. Not folded.
