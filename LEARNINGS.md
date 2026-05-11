# Project Learnings: Star Wars Unlimited Tracker

This document captures key decisions, architectural patterns, lessons learned, and surprises encountered during the development of the Star Wars Unlimited Tracker.

## 🏗️ Architecture & Data Modeling

-   **Two-Table Card Model:** Splitting cards into `card_definitions` (static data like name, text, cost) and `card_printings` (set-specific data like set code, number, rarity, image) is non-negotiable. This prevents duplication and simplifies variant management.
-   **Integer for Stats:** Store Cost, Power, and HP as `integer` columns (not text). This ensures proper numeric sorting and filtering in the database.
-   **Integer for Prices:** Store currency values as integers (cents) to avoid floating-point rounding errors. Divide by 100 only at the UI presentation layer.
-   **Composite Primary Keys:** Use composite PKs for user-scoped data (e.g., `[userId, cardDefinitionId]` in `user_collections`) to enforce uniqueness and simplify lookups.
-   **Naming Consistency:** Standardize on `cardDefinitionId` or `definitionId` across components, API routes, and database schemas to avoid confusion with `printingId`.
-   **Synthetic Rows:** When a feature reads from multiple related tables (e.g., `deck_cards` for main deck and `decks` FKs for Leader/Base), "synthetic" rows can be appended to query results to maintain a uniform data shape for the UI.

## 🔐 Authentication & Security

-   **Better Auth & Next.js 16:** In Next.js 16, the auth export must come from `proxy.ts` (not `middleware.ts`). Using the wrong filename silently leaves routes unprotected.
-   **Legacy Migration Hook:** Use the `user.create.after` hook in Better Auth to automatically migrate data from a legacy default ID (`userId = 1`) to the first registered user.
-   **Mandatory User Audit:** Transitioning from single-user to multi-user requires a strict audit of every database query and API route to ensure `userId` enforcement. No exceptions.
-   **Cron Security:** Guard cron endpoints with a `CRON_SECRET`, but ensure the check fails if the secret is empty (to prevent bypass via missing env vars).
-   **Data Isolation Tests:** Implement specific automated tests to verify that User A cannot see or modify User B's data.

## 🎨 Frontend & State Management

-   **URL-Synced State with `nuqs`:** Use `nuqs` for filters and search queries. It provides a snappy, shareable UI state with minimal boilerplate compared to `useState`/`useEffect` combinations.
-   **Global Currency Persistence:** Use a `CurrencyContext` with `localStorage` to persist user currency preferences (EUR/USD) across sessions.
-   **Next.js 16 Async Params:** Dynamic route parameters (e.g., `params`) must be awaited before destructuring in Next.js 16.
-   **UI Constraints:** `DropdownMenuTrigger` (Base UI) does not support `asChild`. Use `buttonVariants` on the trigger directly for styling.
-   **Optimistic Updates:** Use optimistic UI updates for high-frequency actions like adjusting collection counts (+/- buttons) to keep the experience responsive.

## ⚙️ Backend, API & Sync

-   **ESM-Safe Env Vars:** Use `tsx --env-file=.env.local` for seed and sync scripts. This avoids `dotenv` hoisting issues where environment variables might not be available during module initialization (e.g., Drizzle DB init).
-   **Forced Process Exit:** `process.exit(0)` is required in scripts using Neon HTTP pooled connections; otherwise, the script will hang indefinitely after completion.
-   **Sequential Sync Strategy:** When syncing from external APIs with rate limits, process items sequentially with a delay (e.g., 2 seconds) rather than in parallel.
-   **Hobby Tier Cron Limits:** Vercel Hobby tier allows only 1 cron job per day. Sequential execution of multiple tasks (sync catalog → sync prices → refresh deck of the day) in a single handler is required.
-   **Neon Driver Choice:** The `neon-http` driver is the correct choice for Next.js serverless environments on Vercel, rather than the WebSocket driver.

## 🧪 Testing & Quality

-   **Vitest Zero-Test Exit:** Use `passWithNoTests: true` in `vitest.config.ts` to prevent CI/build failures when a specific directory or filter returns no test files.
-   **Milestone Audits:** Run a comprehensive manual or automated audit before shipping a milestone. This surfaced silent bugs (like missing Leader/Base cards in want lists) that unit tests missed.
-   **Integration Tests for Cross-Table Deps:** When a feature depends on data from multiple tables (e.g., `decks` + `deck_cards`), write integration tests that assert the *combined* output, not just individual table queries.
-   **Decimal Phase Insertion:** Use decimal numbering (e.g., Phase 5.1, 5.2) to insert urgent fixes or forgotten requirements discovered during audits into the roadmap without renumbering existing phases.

## 🛠️ Tooling & Process

-   **Plan Exit Requirement:** Every implementation plan must have a corresponding `SUMMARY.md` generated upon completion. Missing summaries make later project audits and knowledge transfers significantly harder.
-   **Structured Verification:** Move from informal verification to structured `VERIFICATION.md` reports with frontmatter to track success criteria coverage consistently.
-   **TDD for Business Logic:** Writing tests first for complex logic (deck validation, price mapping, card filtering) pays off immediately when refactoring or fixing edge cases discovered later.
-   **Manual Wants vs. Shortfall Logic:** In a trade binder, "Manual Wants" should be treated as absolute quantities to be displayed, not as a target total for the collection. Subtracting current inventory from manual wants confuses users who expect their specific requests to be honored. The correct formula is `max(autoShortfall, manualWant)`.

## ⚠️ Surprises & Pitfalls

-   **Decimal Bug:** Card prices stored as cents were initially displayed 100x larger in the UI. Always verify the decimal placement in financial summaries.
-   **Rarity Filter Hardcode:** A rarity filter was wired to the UI but hardcoded to `true` in the predicate, sitting undetected for several phases until an audit. Integration tests for filter predicates are essential.
-   **Turbopack Cache:** Stale validation logic in `.next` cache can cause build errors after changing shared library code. Clear the cache if `npm run build` fails unexpectedly after a successful dev session.
