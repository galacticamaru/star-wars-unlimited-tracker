# Phase 12: Catalog Evolution - Research

**Researched:** 2026-12-05
**Domain:** Catalog UI, API Sync, Variant Handling
**Confidence:** HIGH

## Summary

This research confirms the technical requirements for evolving the Star Wars: Unlimited catalog. We have verified the `swu-db.com` API structure for upcoming Prestige and Serialized variants, identified a layout pattern for the sticky sidebar that handles long filter lists, and discovered a critical bug in the current sync logic that would prevent Twin Suns (TS26) from being imported.

**Primary recommendation:** Adopt the `DeckBuilder` layout pattern for the catalog to ensure the filter sidebar remains scrollable independently of the card grid, and immediately update the `upsertCards` guard to allow the `TS26` set.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Syncing Variants | API / Backend | — | `upsertCards` handles the two-pass logic for definitions vs printings. |
| Filtering Variants | Browser / Client | API / Backend | Client-side filtering in `filterCards.ts` for instant updates; API must provide the field. |
| Sticky Sidebar | Browser / Client | — | Purely a layout/CSS concern for better UX. |
| TS26 Support | API / Backend | Database | Requires sync logic fix to allow the 'T' set code. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuqs | ^1.17.0 | URL State Management | Standard in this project for shareable filter state. |
| shadcn/ui | latest | UI Components | Provides the `Sheet` and `ScrollArea` components needed. |

## Architecture Patterns

### Sticky Sidebar Layout
The "sticky" requirement for the sidebar is best handled by the **Fixed-Height Container Pattern** rather than `sticky top-X`. This is already used in `src/components/decks/deck-builder.tsx`.

**Why:** With `sticky top-14`, if the sidebar is longer than the viewport (due to many Trait/Set filters), the bottom filters become unreachable.
**Recommendation:**
```tsx
<div className="flex h-[calc(100svh-56px)] overflow-hidden">
  <aside className="w-64 border-r overflow-y-auto p-4 shrink-0">
    {/* Filters here */}
  </aside>
  <main className="flex-1 overflow-y-auto">
    {/* Card Grid here */}
  </main>
</div>
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile Drawer | Custom modal/overlay | shadcn/ui `Sheet` | Handles focus trapping, aria-labels, and exit animations correctly. |
| URL State Sync | `useEffect` + `router.push` | `nuqs` | Already integrated; handles complex array parsing (e.g., sets, traits). |

## Common Pitfalls

### Pitfall 1: The "T" Set Code Guard
**What goes wrong:** The `TS26` set will be skipped by the sync process. [VERIFIED: Codebase grep]
**Why it happens:** `src/lib/sync/upsert-cards.ts` contains: `if (setId.startsWith('T') && setId.length > 3) return 0;`. This was intended to skip token sets (e.g., `TSOR`, `TSHD`), but `TS26` also matches this pattern.
**How to avoid:** Update the guard to specifically exclude "Token" sets or allow `TS26`.
**Recommended fix:** `if (setId.startsWith('T') && setId.length > 3 && !setId.match(/^TS\d{2}$/)) return 0;` (allowing Twin Suns patterns).

### Pitfall 2: Variant Explosion
**What goes wrong:** Adding every `Foil` and `Hyperspace Foil` to the default catalog view will quadruple the number of cards displayed.
**Why it happens:** Most cards have 4+ variants.
**How to avoid:** Hard-code the default filter to `variantType: ['Normal']`. The `CatalogClient` should explicitly request only Normal cards unless the user selects a variant filter.

## Code Examples

### API Payload Verification (JTL Set)
[VERIFIED: API fetch 2026-12-05]
```json
{
  "Set": "JTL",
  "Number": "001",
  "Name": "Home One",
  "VariantType": "Prestige Serialized",
  "Rarity": "Special"
}
```
**Variants found in API:** `Normal`, `Hyperspace`, `Showcase`, `Foil`, `Hyperspace Foil`, `Prestige`, `Prestige Foil`, `Prestige Serialized`.

### Filter Update (`src/lib/filter-cards.ts`)
```typescript
const matchesVariant = (selectedVariants?.length ?? 0) === 0 ||
  selectedVariants.includes(card.variantType);
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Prestige Serialized` is the string for all serialized cards. | API Investigation | We might miss some serialized cards if the string varies (e.g. `Serialized`). |
| A2 | Users prefer `Normal` as default. | Common Pitfalls | User might want to see all variants by default (leads to clutter). |

## Open Questions

1. **How many variants should we show in the sidebar?** There are ~60 unique `VariantType` values in the API (including many niche Promos like `GC Day Three`). 
   - *Recommendation:* Group them into `Normal`, `Showcase`, `Hyperspace`, `Prestige`, `Serialized`, and `Promo` (catch-all for the others).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| swu-db API | Syncing cards | ✓ | — | — |
| shadcn Sheet | Mobile UI | ✓ | latest | Use a standard `dialog` |

## Sources

### Primary (HIGH confidence)
- `api.swu-db.com/sets` - Verified `TS26` existence.
- `api.swu-db.com/cards/JTL` - Verified `Prestige` and `Prestige Serialized` strings.
- `src/lib/sync/upsert-cards.ts` - Identified the `T` set code bug.
- `src/components/decks/deck-builder.tsx` - Verified the sidebar layout pattern.
