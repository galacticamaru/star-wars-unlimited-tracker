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

## Cross-Milestone Trends

| Metric | v1 | v2 | v3 |
|--------|-----|-----|-----|
| Phases | 7 (5 planned + 2 inserted) | 5 | 4 |
| Plans | 22 | 16 | 12 |
| Duration | 5 days | 1 day | 1 day |
| LOC (approx) | ~4,757 TypeScript/TSX | ~8,000 | ~22,000 total |
| Functional bugs at audit | 2 (both fixed pre-ship) | 1 (10.1 binder shortfall) | 0 |
| Insertion phases | 2 (5.1, 5.2) | 1 (10.1) | 0 |
| Requirements coverage | 15/15 | 12/12 | 10/12 (2 deferred by design) |
