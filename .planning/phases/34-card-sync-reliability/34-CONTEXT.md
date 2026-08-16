# Phase 34: Card Sync Reliability - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The nightly `/api/cron/sync-cards` job and the data it feeds. This phase delivers four things:

1. The card sync completes every non-token set inside the Vercel Hobby execution budget, via batched multi-row upserts replacing the current per-definition and per-printing round trips (SYNC-01, SYNC-02)
2. A run that does not process every set reports failure instead of `success: true` (SYNC-03)
3. An operator can check catalog freshness on demand, without querying Neon by hand (SYNC-04)
4. The quick-add deck data is verified against the live catalog and stops silently dropping unresolvable cards (DEBT-05)

**Explicitly out of scope this milestone** (locked upstream, do not reopen):
- Incremental / resumable sync — per-set checkpointing, re-syncing only changed sets, splitting cards and prices into separate invocations. Deferred as **SYNC-05**
- A second cron job. Vercel Hobby allows 1/day; multiplex inside the existing entrypoint
- Fetch timeouts and retry/backoff against swu-db (`CONCERNS.md:142-147`) — resilience work, not batching or loud failure
- Any UI work from Phases 35–38. This phase shares no files with them

</domain>

<decisions>
## Implementation Decisions

### Freshness surface (SYNC-04)

- **D-01:** Freshness is exposed as a **secret-guarded JSON route** — a `GET` status endpoint behind the same `Bearer ${CRON_SECRET}` guard already used at `src/app/api/cron/sync-cards/route.ts:12`. No in-app admin page: the app has no admin-role concept today, and every authenticated user is currently equal. One `curl` answers the question, and a free external uptime monitor could poll it later without an auth session.
- **D-02:** "Last synced" is **derived from existing data** — `MAX(updated_at) GROUP BY set_code` over `card_printings`. No new table, no migration. This works because `upsert-cards.ts:168` sets `updated_at = now()` on every conflict-update, so the timestamp advances on every successful touch of a set even when upstream data was unchanged. — **Reversibility:** reversible — pure read path; adding a sync-run table later (SYNC-05 territory) does not invalidate the derived view.
- **D-03:** The route returns a **verdict plus per-set detail**: a top-level `fresh` boolean computed against SYNC-02's 24-hour window, and per-set `{ setCode, lastSyncedAt, ageHours, stale }`. The known blind spot of D-02 — a set whose fetch failed leaves no record, it merely looks old — is covered here: stale *is* the failure signal.
- **D-04:** The route is **DB-only**. It must not fetch swu-db. It stays fast, has no rate-limit exposure, and cannot fail because the upstream is down — which matters because it is also the failure-detection channel (D-06).

### Failure semantics (SYNC-03)

- **D-05:** A set that fails to fetch **does not abort the run**. Keep the `continue` at `upsert-cards.ts:202-205` so the remaining sets still land, but the run ends **non-2xx** whenever `setsProcessed < setsTotal`. Maximum data recovered per night, honest verdict either way. Threshold-based "mostly succeeded still counts as success" was explicitly rejected — it reintroduces the exact partial-run-looks-complete shape SYNC-03 exists to kill.
- **D-06:** Failure detection is **pull, not push** — the run fails loudly and logs which sets failed; the operator (or an external uptime monitor) reads the SYNC-04 status route. No Discord/Slack webhook or email integration in this phase: it would add an outbound dependency and a new failure mode inside the failure handler. Vercel does not notify on a cron non-2xx on Hobby, so the status route *is* the notification substrate.
- **D-07:** **One verdict covers cards and prices.** The response carries `cards { processed, total }` and `prices { processed, total }`; a shortfall in either makes the run non-2xx, and the body names which half broke. This requires `prices.ts:101-103` to stop swallowing per-set errors and to report a total.
- **D-08:** A **soft deadline** guards against a silent kill. A function terminated at `maxDuration` returns no response at all, so a timeout would otherwise produce no failure signal whatsoever. Track elapsed time; at roughly 80% of `maxDuration`, stop starting new sets and return the non-2xx partial-failure report listing what went unprocessed. It **reports and stops — it does not resume**; persisting a cutoff point for the next run to continue from is SYNC-05 and stays deferred.
- **D-09:** `maxDuration` must be set explicitly on the cron route (there is no export today). The value is a research question — confirm the current Vercel Hobby ceiling and whether Fluid Compute changes it before picking a number.

### Price sync (in scope)

- **D-10:** The hardcoded `activeSets` array at `prices.ts:59` is **replaced by the same non-token set list the card sync already fetches**. That array currently omits ASH, LOF, and TS26 — sets that are in the catalog and referenced by shipped spotlight decks (`starter-decks.ts:1016+`), whose cards have therefore never had a price synced. This is the same silent-drift class the phase exists to fix, on the price side, and it reads directly on SYNC-02. — **Reversibility:** reversible — one list source swapped for another.
- **D-11:** **Price writes are batched too.** `prices.ts:78-85` issues one `UPDATE` per card by `swudbId` — the identical round-trip pattern as the card upserts, and now over more sets after D-10. Collapse to a single multi-row `UPDATE ... FROM (VALUES ...)` per set.
- **D-12:** The hardcoded 1-second inter-set sleep at `prices.ts:96-100` is **removed**. Its own comment concedes "swu-db.com doesn't specify strict limits" — it is a guess, not a documented requirement, and `upsert-cards.ts:201` hits the same host with no delay and has never been rate-limited. Roughly 11s of budget reclaimed once the set list grows.

### DEBT-05 — quick-add deck data

- **D-13:** DEBT-05 is **verify-and-close, not rework.** Investigation during discussion found the recorded state is stale on every point. The 9 "unknowns" were never missing collector numbers — they were named cards left as `LAW-???` placeholders in commit `8ca6265`: Jabba's Guard ×3, Skiff Cargo Hold ×3, Underworld Connections ×2, Cunning Deal ×3, Payoff ×2, Bargaining for Life ×3 (Jabba deck); Boushh's Thermals ×3, Commanding Presence ×2, Infiltration Plan ×3 (Leia deck). Commit `eeb1b6b` (2026-05-23, *"Resolves all TODO placeholders in the LAW spotlight decks"*) filled them in, and both LAW decks now carry 25 entries totalling exactly 52 cards with no TODOs remaining. **What was never done is proving the substituted numbers resolve.** Query the catalog, confirm, correct only what fails.
- **D-14:** Verification covers **all 15 quick-add decks in `starterDecks[]`**, not just the two LAW ones. `eeb1b6b` rewrote six starter decks and eight spotlight decks in a single unverified pass; LAW is only the one that got noticed. The silent skip at `starter-deck/route.ts:59-61` applies identically to every deck, and once the check exists, running it over all of them is nearly free.
- **D-15:** The check is a **committed test** in the existing Vitest suite that walks `starterDecks[]` and asserts every `collectorNumber` resolves against `card_printings` — not a one-off script. A future hand-edited deck cannot silently reintroduce the bug. **Known cost:** this needs a DB-backed test path, and the suite may not have one today (`src/lib/sync/prices.test.ts` is a pure unit test). Establishing that path is part of the work; flag it if it proves disproportionate.
- **D-16:** The runtime silent skip is **replaced by a reported skip.** Keep adding what resolves — a partial add still beats a failed one — but return the skipped collector numbers so the UI can say "added 47 of 50, 3 unavailable". Same principle as the sync verdict: partial work never reports itself as complete. The response contract is the requirement here; the UI copy is a thin follow-through on the existing collection-page progress text (Phase 25-03).

### Claude's Discretion

- **`revalidateTag('cards')` on a partial run** — not put to the user; recorded as an assumption. It should **still fire** even when the run's verdict is failure. The sets that did succeed genuinely changed their data, and suppressing the invalidation would serve stale cache for real updates. The failure signal belongs in the response and the freshness route, not in withheld cache invalidation.
- **Correcting `CONCERNS.md:112`** — the DEBT-05 entry there is wrong on three counts (names a `Spotlight - Kessel Run` deck that does not exist in `starter-decks.ts`; blames cards "not in database", which the roadmap already disproved; prescribes contacting swu-db maintainers). Update it to match D-13 as part of this phase rather than leaving a misleading map entry.
- Batch sizing for the multi-row upserts (Neon/Postgres parameter limits, chunking strategy) is an implementation choice for the planner.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` § "Phase 34: Card Sync Reliability" — goal, 5 success criteria, and the three binding Notes (DEBT-05's cause disproven; 1 cron/day Hobby constraint; SYNC-05 explicitly out of scope)
- `.planning/REQUIREMENTS.md:52-55` — SYNC-01 through SYNC-04 wording
- `.planning/REQUIREMENTS.md:60` — DEBT-05 wording
- `.planning/REQUIREMENTS.md:82` — SYNC-05, the deferred incremental/resumable sync this phase must not drift into
- `.planning/REQUIREMENTS.md:84-98` § "Out of Scope" — the full-sync-rearchitecture and >1-cron/day exclusions
- `.planning/REQUIREMENTS.md:125` — the note establishing DEBT-05 as a matching problem, not a sync gap
- `.planning/PROJECT.md` § "Current Milestone: v8" — where this phase sits in the milestone

### Codebase map
- `.planning/codebase/CONCERNS.md:142-147` — "External API Sync Without Timeouts or Retries". Read for context; the fix it proposes is **out of scope** here (see D-09 boundary)
- `.planning/codebase/CONCERNS.md:177-182` — "Vercel Hobby Tier: 1 Cron Job Per Day", the constraint behind the shared entrypoint
- `.planning/codebase/CONCERNS.md:112-117` — the DEBT-05 entry. **Known to be inaccurate**; see D-13 and the Claude's Discretion note about correcting it
- `.planning/codebase/CONCERNS.md:184-189` — Neon HTTP pooled connections require `process.exit(0)` in scripts; relevant if any verification tooling runs outside Next.js

### Prior art for the DEBT-05 verification pattern
- `.planning/RETROSPECTIVE.md:200` — Phase 33 verified its ASH decks against the live catalog rather than trusting the deck lists, catching exactly this failure class. D-13/D-14/D-15 generalise that approach

### Git history establishing DEBT-05's real state
- Commit `8ca6265` — original LAW deck entries with the 9 `LAW-???` placeholders and their card names
- Commit `eeb1b6b` — "Resolves all TODO placeholders in the LAW spotlight decks"; rewrote all 6 starter and 8 spotlight decks in one unverified pass

</canonical_refs>

<code_context>
## Existing Code Insights

### Files this phase owns
- `src/lib/sync/upsert-cards.ts` (213 lines) — `upsertCards()` and `syncAllCards()`
- `src/lib/sync/prices.ts` (112 lines) — `fetchSetPrices()`, `mapPriceData()`, `syncPrices()`
- `src/app/api/cron/sync-cards/route.ts` (40 lines) — the cron entrypoint
- `src/data/starter-decks.ts` (1076 lines) — quick-add deck data
- `src/app/api/collection/starter-deck/route.ts` — quick-add resolution and the silent skip
- New: the SYNC-04 status route
- New: the `starterDecks[]` resolution test

### The actual defects, located
- **`upsert-cards.ts:96` and `:146`** — one `await db.insert()` per card definition and per printing, inside nested loops. This is the ~8,400 sequential round trips. Both are already `onConflictDoUpdate` upserts, so batching is a shape change, not a semantics change
- **`upsert-cards.ts:202-205`** — a failed set fetch logs and `continue`s; `setsSucceeded` simply never increments. The data to detect a partial run already exists and is already returned
- **`upsert-cards.ts:212`** — `syncAllCards()` already returns `{ setsTotal, setsProcessed, cardsUpserted }`. SYNC-03 needs the *caller* to compare them, not new plumbing
- **`route.ts:30-35`** — returns `success: true` on any non-throw. Never inspects `setsProcessed` vs `setsTotal`. This single line is the "silently succeeding" bug
- **`route.ts`** — no `maxDuration` export at all
- **`prices.ts:59`** — hardcoded `activeSets`, missing ASH/LOF/TS26 (see D-10)
- **`prices.ts:78-85`** — per-card `UPDATE` by `swudbId` (see D-11)
- **`prices.ts:96-100`** — hardcoded 1s inter-set sleep (see D-12)
- **`prices.ts:101-103`** — per-set `catch` that logs and continues with no failure signal reaching the caller (see D-07)
- **`starter-deck/route.ts:59-61`** — unmatched collector numbers skipped with the comment "Card not found in DB — skip silently (could be a data gap)" (see D-16)

### Established patterns to reuse
- **Batch upserts already exist in this codebase.** Phase 25 (PERF-04) built batch helpers in `src/lib/collection.ts` and refactored the starter-deck and CSV import routes to single-round-trip batch upserts. Read that implementation before designing a new batching approach — the pattern, and its Neon-specific constraints, are already solved here
- **`starter-deck/route.ts:33-51`** already does the right thing structurally: collect all collector numbers, one `inArray` query, build a `Map` lookup. That is the batch-read shape the sync writes should mirror
- **`revalidateTag('cards', 'max')`** at `route.ts:26` is the established post-sync invalidation. The two-layer invalidation convention (`revalidateTag` for the Data Cache, `router.refresh()` for the Router Cache) is documented at `.planning/MILESTONES.md:202`
- **`CRON_SECRET` Bearer guard** at `route.ts:10-14`, including the deliberate `!cronSecret` empty-string-bypass check — reuse this verbatim for the status route
- **Token-set filtering** appears twice (`upsert-cards.ts:62` as canonical, `:195` as an efficiency pre-filter). D-10 makes the price sync a third consumer of that same set list — derive, do not re-implement

### Integration points
- The status route (D-01) reads `card_printings` only; no coupling to the sync path beyond the shared `CRON_SECRET`
- `syncPrices()` needs the non-token set list that `syncAllCards()` fetches. Either hoist the set fetch into the cron route and pass it to both, or export a shared helper — planner's call, but the list must have one source
- The `starterDecks[]` test (D-15) needs DB access from Vitest; verify whether the suite has a DB-backed path today before assuming one

</code_context>

<specifics>
## Specific Ideas

- The recurring principle across every decision in this phase, in the user's framing: **partial work must never report itself as complete.** It drove D-05 (no success threshold), D-07 (prices count toward the verdict), D-08 (a timeout must still produce a report), D-10 (a set silently absent from pricing is the same bug), and D-16 (a skipped card is reported, not dropped). Apply it to any ambiguity not covered above
- The DEBT-05 verification should follow the Phase 33 ASH precedent specifically — check the data against the live catalog rather than trusting the list
- Failure detection is deliberately pull-based this phase. If the operator wants push notification later, the status route is the thing to hang it off

</specifics>

<deferred>
## Deferred Ideas

- **Push notification on sync failure** (Discord/Slack webhook or email) — considered under D-06 and declined for this phase. The status route is designed to be the substrate for it later
- **A sync-run history table** — recording per-set attempt/outcome per run, so a repeatedly-failing set is visible as failure rather than merely staleness. Considered under D-02; overlaps with SYNC-05's checkpointing, so it belongs there
- **Upstream count verification** — comparing printings-in-DB against the API's `numberCards` to catch a truncated payload that a timestamp cannot detect. Considered under D-04 and declined to keep the status route cheap and independent of swu-db
- **Fetch timeouts and retry/backoff against swu-db** (`CONCERNS.md:142-147`) — resilience work, out of scope for a batching-plus-loud-failure phase
- **Retry-on-429 replacing the removed sleep** — considered under D-12; same resilience bucket as above
- **The `Normal`-variant-only price filter (`prices.ts:73`) and the fixed 0.92 USD→EUR proxy (`prices.ts:50`)** — surfaced during discussion, not pursued. Pricing-accuracy questions, not reliability ones
- **Structured logging / error tracking** (`CONCERNS.md:135-140`) — the reason logs alone were rejected as a detection channel in D-06. Its own concern, not this phase's

### Reviewed Todos (not folded)

- **`2026-07-20-stale-trade-availability-after-collection-add-on-binder-mana.md`** — "Fix stale trade availability after collection add on /binder/manage" (the `onOwnedCountChange` threading bug). Matched this phase at 0.9 by keyword overlap, but `.planning/REQUIREMENTS.md:123` explicitly assigns it to **Phase 35**, where CATALOG-07 subsumes it. Not folded; no action here

</deferred>

---

*Phase: 34-Card Sync Reliability*
*Context gathered: 2026-08-16*
