# Milestones — Star Wars Unlimited Tracker

## v1 MVP — Shipped 2026-05-07

**Phases:** 7 (1, 2, 3, 4, 5, 5.1, 5.2)
**Plans:** 22
**Timeline:** 2026-05-03 → 2026-05-07 (5 days)
**LOC:** ~4,757 TypeScript/TSX
**Requirements:** 15/15 satisfied

### Delivered

Complete core loop: card catalog auto-synced from swu-db.com, collection tracking with CSV import, deck builder with legality enforcement and ownership overlay, want list showing exactly which cards each deck is missing — including Leader and Base shortfalls.

### Key Accomplishments

1. Full card catalog seeded from swu-db.com API with daily Vercel Cron sync (4,400+ cards)
2. Browse/search/filter catalog with 8 filter dimensions (set, type, aspect, arena, trait, rarity, keyword, cost) — all URL-synced via nuqs
3. Collection tracking with inline owned-count overlay; bulk import from generic CSV and community Reddit SWU spreadsheet format
4. Deck builder with SWU Premier legality enforcement, owned-count overlay, shortfall highlights, and Melee/JSON export
5. Per-deck and combined want lists with exact shortfall quantities — extended in Phase 5.1 to include Leader and Base card shortfalls
6. Rarity filter fully implemented (Phase 5.2 closed hardcoded bypass discovered by milestone audit)

### Known Tech Debt at Close

- Nyquist compliance: no phase is fully compliant; Phases 2, 3, 5 missing or informal VERIFICATION.md artifacts
- Phase 3 SUMMARY.md files not produced (plans 03-01 through 03-04)
- N+1 resolvePrinting() in getDeckCardsForUser() — acceptable for v1; batch join deferred to v2

### Archive

- `.planning/milestones/v1-ROADMAP.md` — full phase details
- `.planning/milestones/v1-REQUIREMENTS.md` — all requirements with outcomes
- `.planning/milestones/v1-MILESTONE-AUDIT.md` — pre-close gap audit
