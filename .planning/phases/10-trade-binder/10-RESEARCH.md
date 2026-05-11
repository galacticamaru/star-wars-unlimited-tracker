# Phase 10: Trade Binder - Research

**Researched:** 2026-05-11
**Domain:** Public Sharing, Multi-User Data Modeling, UI Component Reuse
**Confidence:** HIGH

## Summary

Phase 10 introduces the "Trade Binder," a public-facing page where users can share their card offerings and "Looking For" lists. The implementation focuses on extending the existing `user_collections` model to track trade quantities and integrating the Better Auth `username` plugin to provide human-readable slugs for sharing (e.g., `/binder/vader123`). 

The "Looking For" logic will be a composite of the existing auto-calculated want list (shortfalls from all decks) and manual user entries, minus explicit exclusions. For the UI, the project will leverage the mature `CatalogClient` and `CardItem` components to provide a consistent filtering and browsing experience for public visitors without requiring authentication.

**Primary recommendation:** Use the Better Auth `username` plugin to handle unique slug normalization and constraints, and extend `CardItem` with a dedicated `binder` mode to handle the specific display requirements of trade quantities.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Public Binder View | Browser / Client | Frontend Server | Read-only catalog with filters using `nuqs` |
| Username Resolution | Frontend Server | API / Backend | Map `/binder/[username]` to `userId` via DB query |
| Trade Quantity Management | API / Backend | Browser / Client | Protected POST/PATCH endpoints for trade counts |
| "Looking For" Calculation | API / Backend | — | Composite query of decks, manual wants, and exclusions |
| Slug Uniqueness | API / Backend | — | Enforced by DB constraint via Better Auth plugin |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `better-auth` | 1.6.10 | Authentication & Plugins | Handles `username` normalization and uniqueness |
| `drizzle-orm` | 0.45.2 | Database ORM | Schema migrations for trade tables and user columns |
| `nuqs` | 2.8.9 | URL State Management | Enables catalog filters on the public binder page |
| `next` | 16.2.6 | App Router Framework | Dynamic routing for `[username]` slugs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `lucide-react` | 1.14.0 | Iconography | Visual cues for trade/want lists |

**Installation:**
```bash
npm install better-auth drizzle-orm nuqs
```

## Architecture Patterns

### System Architecture Diagram
```mermaid
graph TD
    User[Owner] -->|Manage| ManagePage[/binder/manage]
    Visitor[Public Visitor] -->|Browse| PublicPage[/binder/:username]
    
    ManagePage -->|Update Trade Qty| API_Trade[API: /api/trade]
    API_Trade -->|Write| DB_UserCollections[(DB: user_collections)]
    
    PublicPage -->|Resolve Slug| DB_User[(DB: user)]
    PublicPage -->|Fetch Trade Data| DB_UserCollections
    PublicPage -->|Fetch Want List| Logic_Want[Want List Logic]
    
    Logic_Want -->|Decks| DB_Decks[(DB: decks)]
    Logic_Want -->|Manual Wants| DB_Manual[(DB: trade_manual_wants)]
    Logic_Want -->|Exclusions| DB_Exclusions[(DB: trade_exclusions)]
```

### Recommended Project Structure
```
src/
├── app/
│   ├── binder/
│   │   ├── manage/           # Protected page for managing trade/wants
│   │   └── [username]/       # Public binder page
│   └── api/
│       ├── trade/            # Endpoints for trade quantity updates
│       └── binder/           # Endpoints for manual wants/exclusions
├── components/
│   └── binder/               # Binder-specific UI (Management cards)
├── db/
│   └── queries/
│       └── binder.ts         # Queries for offerings and "Looking For" composite
└── lib/
    └── binder-logic.ts       # Utility for merging auto-wants and manual wants
```

### Pattern 1: Unified Component Mode (UI Reuse)
Leverage existing `CardItem` by adding a `mode='binder'` prop. This avoids duplicating complex image loading and aspect ratio logic.

**Example:**
```typescript
// src/components/catalog/card-item.tsx
export function CardItem({ ..., mode = 'catalog' }) {
  const isBinder = mode === 'binder';
  // ...
  return (
    <div className="relative">
      {/* ... image ... */}
      {isBinder && (
         <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
           {tradeQuantity} Available
         </div>
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Total Count Leak:** Do not pass the user's total inventory count (`count` in `user_collections`) to the public binder page. Only pass `tradeQuantity`.
- **Custom Slug Logic:** Do not hand-roll username normalization (e.g., lowercase, removing special characters). Use the Better Auth plugin's internal normalization to ensure consistency with login if it's ever enabled.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Username normalization | Custom regex / slugify | Better Auth `username` plugin | Handles edge cases, uniqueness, and display vs. normalized versions |
| URL State Sync | `useState` + `useEffect` | `nuqs` | Existing catalog filters already use `nuqs`; keep it consistent for the public view |
| Shortfall Calculation | Custom SQL joins | `src/lib/want-list.ts` | Reuse established logic for "Missing cards from all decks" |

## Common Pitfalls

### Pitfall 1: Slug Collisions
**What goes wrong:** Two users choose the same username (case-insensitive).
**How to avoid:** Better Auth `username` plugin handles this with a unique constraint on the normalized `username` field. Drizzle schema must reflect this with `.unique()`.

### Pitfall 2: Stale Want List
**What goes wrong:** Public binder shows cards the user just acquired.
**How to avoid:** The "Looking For" logic must dynamically subtract the current `user_collections.count` from the deck requirements at the time of the request.

### Pitfall 3: Broken Relative Links
**What goes wrong:** Catalog filters (Sets, Aspects) breaking because the public page is nested at `/binder/[username]`.
**How to avoid:** Ensure `TopBar` and `CatalogClient` use absolute-ish paths or correct base URLs for filter updates. `nuqs` handles this well by default.

## Code Examples

### Drizzle Schema Additions
```typescript
// src/db/schema.ts

// 1. Update User for Better Auth Username Plugin
export const user = pgTable('user', {
  // ... existing fields
  username: text('username').unique(),
  displayUsername: text('display_username'),
});

// 2. Add Trade Quantity to Collections
export const userCollections = pgTable('user_collections', {
  // ...
  tradeQuantity: integer('trade_quantity').notNull().default(0),
});

// 3. Trade Specific Tables
export const tradeExclusions = pgTable('trade_exclusions', {
  userId: integer('user_id').notNull().references(() => user.id),
  cardDefinitionId: integer('card_definition_id').notNull().references(() => cardDefinitions.id),
}, (t) => [
  primaryKey({ columns: [t.userId, t.cardDefinitionId] })
]);

export const tradeManualWants = pgTable('trade_manual_wants', {
  userId: integer('user_id').notNull().references(() => user.id),
  cardDefinitionId: integer('card_definition_id').notNull().references(() => cardDefinitions.id),
  quantity: integer('quantity').notNull().default(1),
}, (t) => [
  primaryKey({ columns: [t.userId, t.cardDefinitionId] })
]);
```

### Better Auth Plugin Config
```typescript
// src/lib/auth.ts
import { username } from "better-auth/plugins";

export const auth = betterAuth({
    // ...
    plugins: [
        username()
    ]
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UUID in URL | Human-readable slugs | This Phase | Better shareability and user branding |
| Static Want List | Live Sync Want List | This Phase | Automatically updates as decks change |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Better Auth `username` plugin is compatible with existing serial IDs | Code Examples | Minimal; plugin expects a standard user table |
| A2 | Users want to set a quantity for manual wants | Code Examples | Defaulting to 1 is safe; UI can allow adjustment |

## Open Questions (RESOLVED)

1. **Username Change Policy:** Should users be allowed to change their username? If so, does it break old shared links? (RESOLVED)
   - *Resolution:* Allow change via a settings field but warn that old links will break. Better Auth handles the change; we just need a UI for it.
2. **"Looking For" Priority:** If a card is manually added AND auto-synced, which quantity takes precedence? (RESOLVED)
   - *Resolution:* Use the maximum of the auto-calculated shortfall and the manual quantity (`Math.max(autoShortfall, manualQuantity)`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Data layer | ✓ | 16.x (Neon) | — |
| Next.js | Routing | ✓ | 16.2.6 | — |
| Better Auth | Auth | ✓ | 1.6.10 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.mts` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRADE-01 | Add trade quantity | Integration | `npm test tests/trade-api.test.ts` | ❌ Wave 0 |
| TRADE-03 | Resolve username slug | Integration | `npm test tests/binder-slug.test.ts` | ❌ Wave 0 |
| TRADE-05 | "Looking For" logic | Unit | `npm test src/lib/binder-logic.test.ts` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Yes | Middleware protection for `/binder/manage` and `/api/trade` |
| V5 Input Validation | Yes | Zod validation for username format and trade quantities |

### Known Threat Patterns for Next.js

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Data Leakage | Information Disclosure | Server Components must filter `user_collections` to only `tradeQuantity` |
| ID Orphaning | Tampering | Ensure `trade_exclusions` and `trade_manual_wants` use `onDelete: 'cascade'` |

## Sources

### Primary (HIGH confidence)
- `src/db/schema.ts` - Verified current table structures.
- `src/lib/auth.ts` - Verified Better Auth integration.
- `src/components/catalog/catalog-client.tsx` - Verified UI reuse potential.
- `src/lib/want-list.ts` - Verified existing shortfall logic.
- `better-auth` docs - Verified `username` plugin behavior.

### Secondary (MEDIUM confidence)
- Next.js 16.2.6 Release Notes - Verified versioning.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified registry and project config.
- Architecture: HIGH - Built on existing catalog patterns.
- Pitfalls: MEDIUM - Username collisions are common but handled by library.

**Research date:** 2026-05-11
**Valid until:** 2026-06-10
