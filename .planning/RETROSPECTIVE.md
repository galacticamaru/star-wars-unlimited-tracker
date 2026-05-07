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

## Cross-Milestone Trends

| Metric | v1 |
|--------|-----|
| Phases | 7 (5 planned + 2 inserted) |
| Plans | 22 |
| Duration | 5 days |
| LOC | ~4,757 TypeScript/TSX |
| Functional bugs at audit | 2 (both fixed pre-ship) |
| Insertion phases | 2 (5.1, 5.2) |
| Requirements coverage | 15/15 |
