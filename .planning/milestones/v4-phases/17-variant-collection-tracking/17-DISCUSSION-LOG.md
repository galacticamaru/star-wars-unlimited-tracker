# Phase 17: Variant Collection Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 17-variant-collection-tracking
**Areas discussed:** Per-variant count storage, Total count rollup, Variant scope on the detail page, Existing total count control

---

## Per-variant count storage

### Where should per-variant counts live?

| Option | Description | Selected |
|--------|-------------|----------|
| New table: user_printing_collections | Separate table keyed on (userId, cardPrintingId) | ✓ |
| Extend userCollections with printingId | Nullable cardPrintingId column in existing table | |
| You decide | Claude picks | |

**User's choice:** New table `user_printing_collections`

---

### Primary key structure

| Option | Description | Selected |
|--------|-------------|----------|
| (userId, cardPrintingId) composite PK | Mirrors existing userCollections pattern | ✓ |
| Serial id PK + unique constraint | Extra id column, no benefit here | |
| You decide | Claude picks | |

**User's choice:** `(userId, cardPrintingId)` composite PK

---

### API endpoint for per-variant updates

| Option | Description | Selected |
|--------|-------------|----------|
| New endpoint: /api/collection/variants | Dedicated endpoint, clean separation | |
| Extend /api/collection to accept printingId | Reuse existing endpoint with printingId param | |
| Other (free-text) | — | ✓ |

**User's choice (free-text):** "Extend /api/collection to return total count (totalling all variants) and returns a break down of which variants are owned for each card"

**Notes:** User clarified that GET /api/collection should return both total count (sum of all variant counts) AND per-variant breakdown per card. Subsequent question clarified POST behavior.

---

### POST behavior for variant updates

| Option | Description | Selected |
|--------|-------------|----------|
| POST to /api/collection/variants with { cardPrintingId, count } | Dedicated endpoint for variant mutations | ✓ |
| POST to /api/collection with { cardPrintingId, count } | Reuse existing endpoint, branch on id type | |
| You decide | Claude picks | |

**User's choice:** New `POST /api/collection/variants` with `{ cardPrintingId, count }` body

---

## Total count rollup

### How does per-variant update affect userCollections.count?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-recompute: sum all variants, write to userCollections | Server SUM query → write total after each variant upsert | ✓ |
| Deprecate userCollections.count — compute on-the-fly | Derive total from variant SUM in every query | |
| You decide | Claude picks | |

**User's choice:** Auto-recompute total after each variant update

---

### What happens to the existing POST /api/collection?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep it with a migration note | Stays for CSV import; add comment noting it bypasses variant tracking | |
| Remove it — all updates go through variants | Force all mutations through /api/collection/variants | ✓ |
| You decide | Claude picks | |

**User's choice:** Remove `POST /api/collection` — all count mutations through variants endpoint

---

### CSV import handling

| Option | Description | Selected |
|--------|-------------|----------|
| Out of scope — leave import as-is | Note as follow-up; import keeps writing to userCollections | |
| Update import — CSV maps to Normal variant counts | collectorNumber → Normal printing → user_printing_collections | |
| Other (free-text) | — | ✓ |

**User's choice (free-text):** "Update the import too - CSV maps columns to their respective variant counts. Normal to normal. Foil to foil etc."

**Notes:** Each collectorNumber in the CSV uniquely identifies a specific printing (Normal, Foil, Hyperspace, etc.) since the SWU card numbering system encodes variant. Import looks up cardPrintingId alongside cardDefinitionId and writes to user_printing_collections, then auto-sums to userCollections.

---

## Variant scope on the detail page

### Which printings to show?

| Option | Description | Selected |
|--------|-------------|----------|
| Same-set variants only | Only printings where setCode matches the URL's set | ✓ |
| All printings across all sets | Every printing of this card definition regardless of set | |

**User's choice:** Same-set variants only

---

### Variant row label format

| Option | Description | Selected |
|--------|-------------|----------|
| Variant type name only (e.g. 'Normal', 'Hyperspace') | Concise; set implied by URL | ✓ |
| Full printing identifier (e.g. 'SOR-059 Normal') | More explicit but redundant in context | |
| You decide | Claude picks | |

**User's choice:** Variant type name only

---

### Show 0-count variants?

| Option | Description | Selected |
|--------|-------------|----------|
| Always show all variants | All same-set printings shown even at 0 count | ✓ |
| Only show owned variants | Separate "add" flow for unowned printings | |

**User's choice:** Always show all same-set variants

---

## Existing total count control

### What replaces the existing CollectionControls on card detail page?

| Option | Description | Selected |
|--------|-------------|----------|
| Replace it entirely with per-variant rows | Remove single total control; per-variant list is the UI | ✓ |
| Keep both: per-variant rows + read-only total summary | Editable variants + displayed total | |
| You decide | Claude picks | |

**User's choice:** Replace entirely with per-variant rows

---

### Per-variant row control style

| Option | Description | Selected |
|--------|-------------|----------|
| Same +/− pattern as existing CollectionControls | Minus button, number display, plus button per row | ✓ |
| Compact inline stepper (no text input) | Smaller +/− with number between, no input field | |
| You decide | Claude picks | |

**User's choice:** Same +/− pattern as existing CollectionControls

---

### Show a total count summary?

| Option | Description | Selected |
|--------|-------------|----------|
| Purely per-variant — no total shown | Variant rows only | |
| Add a read-only 'Total: X' line | Sum displayed above or below variant list | ✓ |

**User's choice:** Read-only "Total: X copies" line in the section

---

## Claude's Discretion

- Positioning of "Total: X" within the collection section (above vs. below variant rows)
- Whether to extract a new `VariantCollectionControls` component or inline the per-variant list

## Deferred Ideas

None — discussion stayed within phase scope.
