# Retrospective — Star Wars Unlimited Tracker

## Milestone: v1 — MVP

**Shipped:** 2026-05-07
**Phases:** 7 | **Plans:** 22

---

### What Was Built

- Full card catalog auto-synced from swu-db.com API (4,400+ cards, daily Vercel Cron)
- Catalog browsing with 8 filter dimensions (set, type, aspect, arena, trait, rarity, keyword, cost) — all URL-synced via nuqs
- Collection tracking with inline owned-count overlay; bulk import from generic CSV and community Reddit SWU spreadsheet format
- Deck builder with SWU Premier legality enforcement, owned-count overlay, shortfall highlights, and Melee/JSON export
- Per-deck and combined want lists with exact shortfall quantities including Leader and Base
- ~4,757 LOC TypeScript/TSX across 22 plans in 5 days

---

### What Worked

- **Tight phase scoping** — each phase had clear success criteria that made "done" unambiguous; no scope creep mid-phase
- **TDD on business logic** — filter-cards.ts, validateDeck(), sync logic all written test-first; made Phase 5.2 fix safe and fast (tests caught the hardcoded bypass immediately)
- **Two-table card model** — card_definitions + card_printings never caused ambiguity once established; variant strategy (two-pass with Normal anchor) worked cleanly
- **nuqs for URL state** — snappy filters and shareable URLs with minimal boilerplate; no useState/useEffect sprawl
- **Milestone audit before ship** — running `/gsd-audit-milestone` surfaced two silent functional bugs (Leader/Base want list gap + rarity hardcode) that would have shipped broken; the insertion phases (5.1, 5.2) closed them cleanly
- **Decimal phase insertion** — neat mechanism for urgent fixes that maintains sequencing without renumbering

---

### What Was Inefficient

- **Phase 3 planning artifacts missing** — no SUMMARY.md files for plans 03-01 through 03-04 were produced; this is a documentation gap that wouldn't recur if SUMMARY.md creation was a plan exit requirement
- **Informal verification artifacts** — Phases 2, 3, 4, 5 all had UAT/verification done but VERIFICATION.md files were either absent or informal prose without structured frontmatter; audit had to work harder to assess requirements coverage
- **Rarity filter bypass discovered post-ship** — `matchesRarity = true` was committed in Phase 3 and sat undetected until the milestone audit; a rarity-filter integration test in Phase 3 would have caught it immediately
- **Leader/Base want list gap** — same pattern: Phase 4 introduced leaderCardDefinitionId / baseCardDefinitionId as FK columns on decks (not in deck_cards), and Phase 5 getDeckCardsForUser() joined only deck_cards; a cross-phase integration check would have caught it
- **N+1 resolvePrinting() calls** — acceptable for v1 but deferred to v2; noting it was never written down until the SUMMARY captured it

---

### Patterns Established

- **Synthetic row emission** — append typed rows matching Drizzle inferred select shape to DB query results (used for leader/base in getDeckCardsForUser())
- **Spread-conditional for optional deck slots** — `...(state.slotId ? [{ cardDefinitionId: state.slotId, quantity: 1 }] : [])`
- **UI prefix stripping for filter normalization** — split on first space to extract canonical value matching DB format (e.g. `(C) Common` → `Common`)
- **tsx --env-file=.env.local** — ESM-safe approach for seed scripts; avoids dotenv hoisting after Drizzle init
- **process.exit(0) in seed scripts** — required; tsx hangs on open Neon pooled HTTP connection otherwise

---

### Key Lessons

1. **Write a rarity/filter smoke test alongside the UI wiring.** The rarity dropdown was fully wired (URL-synced, options rendered) but the predicate was hardcoded. A single integration test at Phase 3 completion would have caught a 3-month-later surprise.
2. **Cross-table want list dependencies need an integration test.** When a feature reads from multiple tables (deck_cards + decks FK columns), write a test that asserts the combined output — not just that the JOIN query runs.
3. **SUMMARY.md is a plan exit requirement, not optional.** Three plans in Phase 3 shipped with no summary; the archive had to reconstruct intent from PLAN.md and UAT.md.
4. **Decimal phase insertion works cleanly** — inserting 5.1 and 5.2 between Phase 5 and v1 close maintained a coherent narrative and git history without renumbering. Keep the pattern for v2.
5. **Milestone audit before ship pays off every time.** Both functional gaps were silent — they wouldn't have triggered user bug reports until the user tried to use the specific features. Catching them pre-ship took 2 hours of insertion work instead of post-launch fire-fighting.

---

---

## Milestone: v3 — Catalog, Home & Binder Polish

**Shipped:** 2026-05-13
**Phases:** 4 (11–14) | **Plans:** 12

---

### What Was Built

- New home page at `/` with Hero section and "Highest Value Cards" 10-card grid; catalog migrated to `/cards`
- Sticky catalog sidebar with independent scroll; all filters moved from top-bar to sidebar (sticky, swu.fan-style)
- Variant support in sync and UI: Showcase, Prestige, Serialized, Hyperspace all tracked; TS26 (Twin Suns) set unblocked
- Owned-only toggle in catalog and deck builder — URL-persisted via nuqs, disabled-with-tooltip for logged-out users; TDD approach
- Switch and Tooltip primitives built on Base UI 1.4.1 (no Radix); MobileFilterSheet for narrow viewports
- Full-width public trade binder (container wrapper removed); `getUserTradeData()` now returns `autoWants[]` with deck-driven shortfalls
- "Automatic Wants" sidebar section in manage binder — active rows (quantity + Exclude), excluded rows (opacity-50 + Remove), optimistic state updates

---

### What Worked

- **Parallel wave execution** — Phase 14 Wave 1 ran 14-01 and 14-02 truly in parallel (different files, no overlap); saved meaningful wall-clock time
- **TDD on filterCards() ownedOnly** — writing 4 failing tests before implementation made the logic trivial to verify and the RED/GREEN/REFACTOR cycle clean; no rework
- **Plan precision** — all three phases had exact line-number edits specified in PLAN.md (CURRENT/REPLACE WITH blocks); executors needed zero guesswork and produced zero deviations
- **Reuse over abstraction** — `toggleExclusion` reused for auto-want exclusions with no new API surface; `calculateLookingFor` reused from binder.ts; both decisions saved a phase of work
- **nuqs established as the standard** — URL state worked smoothly across catalog, deck builder, and filter sheets with no regressions

---

### What Was Inefficient

- **Worktree merge ordering confusion** — in Phase 14, the 14-02 agent ran directly on the main branch while 14-01 used a worktree; the orchestrator had to manually detect the topology before merging. The plans were correctly isolated by file, but the worktree dispatch timing wasn't perfectly sequential (git config.lock race avoided but the merge step needed extra investigation)
- **Dev server wasn't running the worktree code** — the checkpoint for 14-03 was blocked because the user ran `npm run dev` from the main tree before the worktree was merged; the user saw "no Automatic Wants" which was actually correct for the unmerged state. Merging earlier (before the checkpoint) would have avoided confusion
- **Code review found pre-existing tech debt** — 4 Critical findings in the manage page, all pre-existing (not introduced by v3); having a baseline code review earlier would have isolated new vs. old findings

---

### Patterns Established

- **Fixed-height container pattern** (`100svh - 56px`) for pages with sticky sidebars and independent scroll columns
- **Full-width page pattern** — server page components return client component directly with no wrapper div; matches `/cards` and `/binder/[username]`
- **Base UI primitives** — Switch.Root + Switch.Thumb, Tooltip with Portal wrapper; always wrap in a `'use client'` file that re-exports a clean component interface
- **nuqs as the single source of truth for filter state** — no `useState` for filters; `parseAsBoolean`, `parseAsString`, `parseAsArrayOf` cover all filter types
- **Optimistic exclusion toggling** — `setTradeData(prev => ({ ...prev, autoWants: prev.autoWants?.map(...) }))` pattern for in-place array item updates

---

### Key Lessons

1. **Merge worktrees before human checkpoints.** If a human checkpoint needs to test the running dev server, the worktree must be merged to the main tree first. Otherwise the user is testing stale code.
2. **TDD for isolated logic functions is always worth it.** `filterCards()` with `ownedOnly` was the most straightforward plan in v3 to execute and verify — because the tests defined the contract before a line of implementation was written.
3. **Exact edit specifications in plans eliminate agent guesswork.** CURRENT/REPLACE blocks with line numbers produced zero deviations across all 12 plans. This level of precision takes more time to plan but saves even more in execution.
4. **Reuse > abstraction at plan boundaries.** When a plan can reuse an existing function or API call rather than extracting a shared helper, do it. Three v3 decisions (toggleExclusion, calculateLookingFor, no new API endpoint) each saved at least one additional plan.

---

## Milestone: v4 — Deck Builder & Collection Depth

**Shipped:** 2026-05-23
**Phases:** 11 (15, 15.1, 16, 16.1, 17, 17.1, 18, 19, 20, 21, 22) | **Plans:** 34

---

### What Was Built

- Deck list grouped by card type (Ground/Space Units, Upgrades, Events) with leader/base art and hover-row art (Phase 15)
- Cost-sorted card rows within each deck section, default tab switched to Deck List (Phases 15.1, 16.1)
- Empty deck guided onboarding: auto-filter to Leader+Base first, then to aspects of chosen leader/base pair (Phase 16)
- Per-variant collection tracking on card detail page: Normal/Foil/Hyperspace/Showcase/Prestige with +/- controls and total line (Phase 17)
- In-memory variant grouping in `upsertCards` — eliminated orphaned Foil/variant rows across all sets (Phase 17.1)
- Catalog shows highest-owned variant art with Showcase > Hyperspace Foil > Hyperspace > Foil > Normal precedence (Phase 18)
- Quick-add 20+ pre-constructed decks (TS26, IBH, JTL, LOF, SEC, LAW spotlight decks) from collection page (Phases 18 + 22)
- Unified variant filter across catalog, public binder, and deck builder (Phase 19)
- CSV import updated to support all four variant types via array-based variant lookup (Phase 20)
- `user_trade_offerings` schema migration (keyed by `cardPrintingId`); Foil/Showcase/etc. variant badge on public binder tiles (Phase 21)

---

### What Worked

- **Milestone audit surfacing a structural gap** — REQ-BINDER-06 required a full schema migration that wasn't obvious from the original plan; the audit caught it before ship and the insertion of Phase 21 resolved it cleanly
- **Decimal phase insertion for urgent fixes** — inserting Phase 21 and 22 after the audit, and 15.1, 16.1, 17.1 during execution, maintained narrative coherence without renumbering
- **TDD on the auto-filter logic** — `computeAutoFilter()` and `computeAutoFilterLabel()` were tested in isolation first (Phase 16 Wave 1); the downstream waves were mechanical wiring with no logic bugs
- **In-memory grouping over two-pass DB strategy** — Phase 17.1 replaced a fragile two-pass seeding approach with in-memory variant grouping; the result was self-healing on re-seed and eliminated orphaned rows
- **Static data file pattern** — `starter-decks.ts` as a flat TypeScript array required no new DB table, no admin UI, and was trivially extensible in Phase 22

---

### What Was Inefficient

- **Phase 19 attempting REQ-BINDER-06 without schema migration** — Phase 19 was planned to handle variant badges but the executor discovered mid-plan that the `tradeQuantity` column was stored against `cardDefinitionId`, not per-variant; the plan was abandoned and REQ-BINDER-06 rolled into Phase 21. A deeper schema review during Phase 19 planning would have surfaced this constraint earlier
- **Missing VERIFICATION.md for Phases 19 and 20** — both phases were shipped without verification artifacts; the audit flagged this and the gaps were acknowledged at close. Adding VERIFICATION.md as a phase exit gate (not just a SUMMARY.md) would prevent recurrence
- **Phase 17 gap-closure plans (17-09, 17-10)** — orphaned Foil rows weren't discovered until after Phase 17 human UAT; a DB orphan-check query as part of the Phase 17 verification plan would have caught it before the UAT checkpoint
- **TS26 zero-padding bug in Phase 22** — collector numbers were zero-padded in the first implementation; a quick cross-reference against the actual DB format before writing the data would have avoided a fix commit

---

### Patterns Established

- **`buildCollectionMap()` with `.total` + per-variant suffix keys** — `_Foil`, `_Showcase`, etc. as the canonical collection shape; all consumers read `.total` for owned-count overlays and per-suffix for detailed display
- **`getPrintingArtMap()` server query** — returns best variant art per `cardDefinitionId` by joining owned counts with variant precedence; the map is injected into CatalogClient as a prop
- **DDL-first schema migration** — `drizzle-kit push` for DDL only; data migration runs as an explicit SQL step after DDL settles; no-op detection prevents double-migration
- **`user_trade_offerings` per-printing** — composite PK `(userId, cardPrintingId)` instead of `(userId, cardDefinitionId)`; enables variant-specific trade tracking at the DB level
- **Additive starter deck quick-add** — `incrementVariantCount` with SQL `+ quantity` on conflict; never overwrites existing counts; safe for repeated quick-add calls

---

### Key Lessons

1. **Schema migrations require a full column-level schema review before planning variant features.** Phase 19 discovered mid-execution that `tradeQuantity` was stored against the wrong FK. A schema diagram review as part of the discuss-phase would surface this type of constraint before any code is written.
2. **VERIFICATION.md is a plan exit gate, not a nice-to-have.** Phases 19 and 20 both had working implementations but no verification artifact; the audit had to work harder to assess coverage. Adding VERIFICATION.md as a checklist item in the plan template enforces the habit.
3. **Validate data format against DB before writing static data files.** Phase 22 zero-padding bug was caught by a test failure on quick-add; it would have been invisible in the data file without the cross-reference check.
4. **In-memory grouping beats two-pass DB strategies.** When a seeding algorithm requires cross-row coordination, do it in memory before touching the DB — simpler code, no timing issues, self-healing on re-run.
5. **Milestone audit insertion phases are the right mechanism.** Both Phase 21 (schema migration gap) and Phase 22 (quick-add coverage) were discovered at audit and inserted cleanly. The pattern continues to pay off — audit early, insert late.

## Milestone: v5 — Trade Binder & Performance

**Shipped:** 2026-05-28
**Phases:** 4 (23, 24, 25, 25.1) | **Plans:** 15

---

### What Was Built

- Printing-level manual wants schema migration + Looking For variant badges on public binder tiles (Phase 23)
- Card Detail "Available for Trade" section — auth-gated RSC component with optimistic PATCH wiring (Phase 23)
- Manage Binder redesigned: collection-driven browse grid (`userCollections` count > 0), VariantTradeSheet panel, ManualWantsAddFlow chip selector (Phase 23)
- 150ms search debounce on catalog filter input — eliminates mid-keystroke `filterCards` re-runs (Phase 24)
- RSC `use cache` + `cacheTag` on `getAllCards` — drops `userId` and `force-dynamic`; warm-cache LCP reduced (Phase 24)
- @tanstack/react-virtual CardGrid — windowed rows, fixed-dimension containers, no CLS, first-row eager priority loading (Phase 24)
- `batchIncrementVariantCounts` (additive, Quick Add) + `batchUpsertVariantCounts` (overwrite, CSV Import) — eliminates N+M Neon round-trips; no 504 for 1,000 cards (Phase 25)
- Live card-count progress text + `loading.tsx` animate-pulse skeleton for `/decks/[id]` navigation (Phase 25)
- @vercel/speed-insights@2.0.0 in root layout — all pages instrumented, 100% sample rate, no exclusions (Phase 25.1, INSERTED)

---

### What Worked

- **Wave-based parallelization held up across all phases** — Phase 24 had 6 plans across 4 waves with clear ownership boundaries; no merge conflicts despite parallel execution
- **TDD Wave 0 for non-trivial batch logic** — writing RED stubs for `batchIncrementVariantCounts` before implementing it caught two semantic edge cases (additive vs overwrite) before any route code was written
- **Decimal insertion for the Speed Insights urgency** — Phase 25.1 inserted after Phase 25 was complete; added one plan without renumbering or disrupting the milestone narrative; the mechanism continues to work cleanly
- **RSC caching trade-off was surfaced explicitly during discuss-phase** — the decision to drop `userId` from `getAllCards` was documented before planning; the team knew exactly what personalised-data pattern would replace it
- **Post-deploy UAT checklist in PR description** — making the `human_needed` items explicit in PR #18 means they survive milestone close and won't be forgotten post-merge

---

### What Was Inefficient

- **Phase 24 had a gap-closure plan (24-06) discovered after Phase 24-05 build verification** — the `??` → `||` guard for `clientWidth=0` was a CR-01 code review finding that required a 6th plan after verification; a stricter pre-merge code review (or running the review agent before marking verification complete) would have caught it
- **PERF-01–05 remain post-deploy unverified at milestone close** — all five requirements require a live Vercel + Neon environment to confirm; none could be verified from the codebase. No clear mechanism exists to re-trigger verification post-deploy; creating a GitHub issue or a post-deploy checklist card would formalize this
- **`one_liner` frontmatter missing from most SUMMARY.md files** — the milestone.complete SDK query returned empty accomplishments because SUMMARY.md files don't have a structured `one_liner` field; accomplishments had to be extracted manually. Adding `one_liner` as a required field in the plan execution template would fix this

---

### Patterns Established

- **`batchIncrementVariantCounts` vs `batchUpsertVariantCounts`** — same Drizzle `onConflictDoUpdate` shape but with `count + EXCLUDED.count` (additive) vs `EXCLUDED.count` (overwrite); the caller sets semantics at call site
- **RSC personalisation split** — `getAllCards` returns unpersonalised data for RSC cache; a separate client request adds per-user collection counts; the split enables caching without sacrificing personalisation
- **`loading.tsx` as the deck creation latency fix** — no streaming, no Suspense boundary in the page component; `loading.tsx` fires automatically on navigation and buys the skeleton for free
- **Speed Insights `debug` prop pattern** — `debug={process.env.NODE_ENV === 'development'}` ensures the debug panel appears in dev but not production without a separate env variable

---

### Key Lessons

1. **Code review before verification, not after.** Phase 24 discovered a correctness bug (CR-01) during the code review step that ran after `status: passed` verification. Running `/gsd-code-review` before marking verification complete would catch these earlier.
2. **Post-deploy UAT needs a tracking mechanism at milestone close.** PERF-01–05 and PERF-06 (partial) all require live-environment confirmation. Treating `human_needed` status as a GitHub issue or deployment checklist item (not just a file status) would prevent them from being forgotten.
3. **`one_liner` in SUMMARY.md frontmatter is load-bearing for tooling.** The `milestone.complete` SDK query extracted zero accomplishments; everything had to be written manually. Make `one_liner` a non-optional field in the plan exit step.
4. **Wave 0 RED stubs pay for themselves.** Both Phases 24 and 25 used Wave 0 test stubs as the first plan; both phases had clean implementations with no test-coverage gaps discovered at verification. The overhead is two plans per phase; the payoff is structured TDD.
5. **Decimal insertion is clean but the urgency signal needs to be earlier.** Phase 25.1 was inserted as "URGENT" after Phase 25 was already complete. Speed Insights had been in the backlog; surfacing it during the milestone discussion (not after all phases were done) would have slotted it into the original plan.

---

## Cross-Milestone Trends

| Metric | v1 | v2 | v3 | v4 | v5 |
|--------|-----|-----|-----|-----|-----|
| Phases | 7 (5 planned + 2 inserted) | 5 | 4 | 11 (6 planned + 5 inserted) | 4 (3 planned + 1 inserted) |
| Plans | 22 | 16 | 12 | 34 | 15 |
| Duration | 5 days | 1 day | 1 day | 10 days | 4 days |
| LOC delta (approx) | ~4,757 added | ~3,200 added | ~14,000 total | ~10,000 in src/ | +15,955 / −422 |
| Functional bugs at audit | 2 (both fixed pre-ship) | 1 (10.1 binder shortfall) | 0 | 1 (Phase 19 schema gap → Phase 21) | 1 (CR-01 clientWidth guard, Phase 24-06) |
| Insertion phases | 2 (5.1, 5.2) | 1 (10.1) | 0 | 5 (15.1, 16.1, 17.1, 21, 22) | 1 (25.1) |
| Requirements coverage | 15/15 | 12/12 | 10/12 (2 deferred by design) | 12/12 (2 docs gaps acknowledged) | 9/9 code-complete; 5/9 post-deploy UAT pending |
