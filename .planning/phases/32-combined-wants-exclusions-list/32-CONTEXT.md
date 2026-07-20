# Phase 32: Combined Wants & Exclusions List - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

`ManageWantsList` (`src/components/binder/manage-wants-list.tsx`, rendered in the right 1/3 column of `src/app/binder/manage/page.tsx`) is redesigned into **one clearly-sectioned "Looking For" list** where deck-driven auto-wants and manually-added wants live together and are visually distinguished. Exclude/restore for auto-wants and quantity/remove for manual wants are **preserved from today** — this is a presentation redesign, not new behavior. (BINDER-18/19/20)

**In scope:**
- Collapse today's three disconnected sections (Manual Wants / standalone Exclusions / Automatic Wants) into two labeled groups inside one list.
- Fold the standalone Exclusions section away — excluded auto-wants now live inside the auto group.
- Preserve exclude/restore (per-definition) and manual-want quantity/remove (per-printing) controls.

**Out of scope (belongs to other work):**
- The unified search-driven add flow — shipped in **Phase 30**; leave untouched.
- The trade profile modal / public trade note — shipped in **Phase 31**; leave untouched.
- The Trade Offerings grid and search results grid in the left column — not part of this rework.
- Any server/API/schema change to wants, exclusions, or auto-want derivation — the existing `/api/binder/wants`, `/api/binder/exclusions`, and auto-want data are reused as-is.

</domain>

<decisions>
## Implementation Decisions

### List structure (BINDER-18)
- **D-01:** The list is **one "Looking For" list with two labeled sections**: **Deck Wants** (deck-driven auto-wants) on **top**, **Manual Wants** below. The current standalone **Exclusions section is removed entirely** — it duplicated the dimmed inline excluded auto-wants and is redundant.
- **D-02:** The **section headers themselves carry the auto-vs-manual distinction** (BINDER-18's "clearly distinguish" requirement). No per-row Auto/Manual badge is needed — grouping under two headers is the distinction. Each section keeps its count pill as today.

### Excluded auto-wants (BINDER-19)
- **D-03:** Excluding a deck-driven auto-want keeps the row **inline and dimmed** (opacity ~50%) within the **Deck Wants** section, with an "Excluded" tag and a **restore** control — matching current behavior. Excluded rows **sort to the bottom** of the Deck Wants section so the active wants read first. Exclude uses the existing `Ban` action; restore uses the existing `onToggleExclusion(id, false)` path.
- Restore/exclude continues to hit `POST /api/binder/exclusions` (`{ cardDefinitionId, excluded }`), keyed by **card definition** as today.

### Manual want rows (BINDER-20)
- **D-04:** Manual want rows keep the **quantity stepper (− n +)** and **remove [x]**, driven by the existing `onUpdateWantQuantity` / `onRemoveWant` handlers (`/api/binder/wants`). Rows show the **variant badge for non-Normal printings only** (FOIL, HYPERSPACE, etc.) exactly as today. **No owned/not-owned indicator** — the wants list is about what the user is seeking, not what they hold, even though Phase 30 allows wants for cards the user doesn't own.

### Claude's Discretion
- Exact **section header wording** ("Deck Wants" / "Manual Wants" vs "Automatic" / "Looking For" framing) — pick what reads cleanly and stays consistent with the surrounding manage-page copy.
- **Count semantics** — whether the Deck Wants count pill includes or excludes the dimmed excluded rows (recommend showing active + a separate excluded indicator, but planner's call).
- **Combined/empty-state copy** for each section and the overall empty case.
- Whether to refactor `ManageWantsList` in place or split into small sub-row components — internal structure is planning's call, provided the props contract from `manage/page.tsx` (`wants`, `exclusions`, `autoWants`, and the four handlers) still resolves correctly. Note the `exclusions` prop may become derivable from `autoWants[].isExcluded` once the standalone section is gone.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` §"Wants & Exclusions" — BINDER-18, BINDER-19, BINDER-20 (the requirements this phase satisfies)
- `.planning/ROADMAP.md` §"Phase 32: Combined Wants & Exclusions List" — goal + 3 success criteria

### Files this phase changes / builds on
- `src/components/binder/manage-wants-list.tsx` — the component being redesigned (today: three sections Manual Wants / Exclusions / Automatic Wants; excluded auto-wants already render dimmed inline)
- `src/app/binder/manage/page.tsx` — parent that supplies `wants` (manual, per-printing), `exclusions` (per-definition), `autoWants` (per-definition, with `isExcluded`), and the `onUpdateWantQuantity` / `onRemoveWant` / `onRemoveExclusion` / `onToggleExclusion` handlers (see the optimistic-update logic around the exclusions handler, ~lines 299–330)

### Data / API (reused as-is — no changes expected)
- `src/app/api/binder/wants/route.ts` — POST `{ cardPrintingId, quantity }` to add/update/remove a manual want (quantity 0 removes)
- `src/app/api/binder/exclusions/route.ts` — POST `{ cardDefinitionId, excluded }` to exclude/restore an auto-want
- `src/db/queries/trade.ts` — `addExclusion` / `removeExclusion` (server side of exclusions)

### Conventions
- `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/STRUCTURE.md` — project component/pattern conventions
- Prior phase context: `.planning/phases/30-unified-search-driven-add-flow/30-CONTEXT.md` (manual wants are per-printing, can be for unowned cards) and `.planning/phases/31-trade-profile-modal-public-trade-note/31-CONTEXT.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ManageWantsList` already implements every required behavior — manual-want qty stepper + remove, exclude (`Ban`) / restore, and dimmed inline rendering of excluded auto-wants. This phase **re-arranges** those pieces (three sections → two grouped sections, drop standalone Exclusions), it does not build new controls or new API calls.
- The optimistic-update handlers in `manage/page.tsx` (exclusion toggle sourcing name/subtitle from `autoWants` so it works before any search has loaded owned cards) are already correct — keep them.

### Established Patterns
- Rows use `lucide-react` icons (`X`, `Plus`, `Minus`, `Ban`), muted pill counts, and Tailwind utility styling consistent with the rest of the binder components.
- Manual wants keyed by `cardPrintingId`; auto-wants and exclusions keyed by `cardDefinitionId` — a real distinction the redesign must preserve (per-printing vs per-definition).

### Integration Points
- Single integration surface: the `ManageWantsList` invocation at `src/app/binder/manage/page.tsx:483` and its props/handlers. No route, schema, or query changes anticipated.

</code_context>

<specifics>
## Specific Ideas

The user selected concrete layout mockups during discussion:
- **Structure:** two sections, Deck Wants (with count) above Manual Wants (with count), Exclusions section removed.
- **Excluded rows:** `· Death Star  excluded [restore]` — dimmed, sunk below active deck wants.
- **Manual rows:** `Luke  FOIL  − 1 +  [x]` — variant badge only, stepper, remove.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 32-combined-wants-exclusions-list*
*Context gathered: 2026-07-20*
