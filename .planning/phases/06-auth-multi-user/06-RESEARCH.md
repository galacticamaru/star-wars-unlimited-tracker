# Phase 6: Auth & Multi-User - Research

**Researched:** 2025-02-24
**Domain:** Authentication & User Data Isolation
**Confidence:** HIGH

## Summary

This phase transitions the application from a single-user prototype to a multi-user platform. The core challenge is integrating **Better Auth** into a **Next.js 16** environment while reconciling the current `integer` userId schema with Better Auth's default `string` (UUID) preference. 

Research confirms that Next.js 16 introduces a significant rename of `middleware.ts` to `proxy.ts`, acting as the primary gateway for route protection. Additionally, Better Auth provides a native mechanism (`generateId: "serial"`) to align its user IDs with our existing numeric schema, simplifying the migration of legacy data (userId=1).

**Primary recommendation:** Use Better Auth with the Drizzle adapter configured for `serial` IDs, and implement a post-registration database hook to migrate legacy "userId=1" data to the first successfully registered account.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Authentication Logic | API / Backend | — | Better Auth server instance handles hashing, token validation, and DB persistence. |
| Session Management | Frontend Server | Browser | Server-side `proxy.ts` handles redirects; browser stores session cookies. |
| Route Protection | Frontend Server | — | `proxy.ts` intercepts requests before they hit pages or API routes. |
| Data Isolation | API / Backend | Database | All queries are updated to include a mandatory `where(eq(table.userId, currentUserId))` filter. |
| v1 Data Migration | API / Backend | — | `databaseHooks` in Better Auth trigger the one-time ID reassignment. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `better-auth` | ^1.4.0 | Auth Framework | Highly extensible, built-in Drizzle support, and modern Next.js 15+ ergonomics. |
| `next` | 16.2.4 | Web Framework | Project core; requires the new `proxy.ts` convention for middleware. |
| `drizzle-orm` | ^0.45.2 | Database ORM | Existing project standard for type-safe database access. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `lucide-react` | ^0.460.0 | Icons | Google/Discord icons for OAuth buttons. |

**Installation:**
```bash
npm install better-auth
```

## Architecture Patterns

### System Architecture Diagram
Requests flow through the `proxy.ts` layer before reaching protected routes.
```
Request -> [proxy.ts (Auth Check)] -> [Page/API Route] -> [Drizzle (Filtered by userId)] -> Response
```

### Recommended Project Structure
```
src/
├── proxy.ts                 # Next.js 16 Middleware gateway (renamed from middleware.ts)
├── lib/
│   ├── auth.ts              # Better Auth server instance configuration
│   └── auth-client.ts       # Better Auth React client instance
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx      # Unified Login/Register page
│   └── api/
│       └── auth/
│           └── [...all]/
│               └── route.ts  # Catch-all auth route handler
```

### Pattern 1: Serial ID Alignment
To bridge the `integer` vs `string` mismatch without casting in every query, configure Better Auth to let the database handle ID generation via `serial`.

**Example:**
```typescript
// src/lib/auth.ts
export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    advanced: {
        database: {
            generateId: "serial", // Use integer IDs instead of UUIDs [VERIFIED: better-auth.com]
        },
    },
    // ...
});
```

### Pattern 2: First-User Migration Hook
Use the `after` hook on user creation to identify the first registrant and update legacy data.

**Example:**
```typescript
// src/lib/auth.ts
databaseHooks: {
    user: {
        create: {
            after: async (user) => {
                const [userCount] = await db.select({ value: count() }).from(users);
                if (userCount.value === 1) {
                    // Migrate legacy data (userId = 1) to the new account ID
                    await db.update(userCollections).set({ userId: user.id }).where(eq(userCollections.userId, 1));
                    await db.update(decks).set({ userId: user.id }).where(eq(decks.userId, 1));
                }
            },
        },
    },
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password Hashing | `bcrypt.hash()` | Better Auth | Handles salts, pepper, and future-proof algorithms (Argon2) automatically. |
| Session Expiry | `setInterval` check | Better Auth | Handles rolling sessions, database persistence, and browser cookie management. |
| OAuth Handshake | Custom Fetch/Redirects | Better Auth Providers | Manages PKCE, state tokens, and user profile mapping for Google/Discord. |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `user_collections`, `decks` tables contain `userId = 1` | **Data Migration:** Update rows to the new `userId` via the `after` hook. |
| Secrets/env vars | None currently in `.env` | **Configuration:** Add `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, etc. to `.env`. |
| Live service config | None | N/A |
| OS-registered state | None | N/A |
| Build artifacts | None | N/A |

## Common Pitfalls

### Pitfall 1: Middleware Silence in Next.js 16
**What goes wrong:** Using `middleware.ts` instead of `proxy.ts`.
**Why it happens:** Next.js 16 renames the convention; old middleware files are ignored or trigger warnings, leaving routes public. [VERIFIED: release notes]
**How to avoid:** Use `src/proxy.ts` with `export async function proxy(request: NextRequest)`.

### Pitfall 2: Async Headers/Cookies
**What goes wrong:** `headers().get()` or `cookies().get()` returning errors.
**Why it happens:** React 19 / Next.js 15+ made these functions asynchronous. [VERIFIED: nextjs.org]
**How to avoid:** Always use `await headers()` and `await cookies()` before accessing properties.

### Pitfall 3: OAuth Redirect Mismatch
**What goes wrong:** "Redirect URI mismatch" error in Google/Discord consoles.
**How to avoid:** Ensure `BETTER_AUTH_URL` matches exactly (including trailing slash or lack thereof) in the provider's developer console.

## Code Examples

### Next.js 16 Route Protection (`proxy.ts`)
```typescript
// src/proxy.ts [VERIFIED: nextjs.org]
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

function isProtectedRoute(path: string) {
  return ["/collection", "/decks"].some(prefix => path.startsWith(prefix));
}
```

### Shadcn Login Toggle Pattern
```tsx
// src/app/(auth)/login/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  return (
    <Tabs defaultValue="signin" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Create Account</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">{/* Sign In Form */}</TabsContent>
      <TabsContent value="signup">{/* Sign Up Form */}</TabsContent>
    </Tabs>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 | Network gateway rename for better clarity. |
| Sync `headers()` | Async `await headers()` | Next.js 15 | Better alignment with React 19's async data fetching. |
| UUID only IDs | `generateId: "serial"` | Better Auth 1.x | Easier integration with legacy numeric schemas. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `middleware.ts` is ignored in favor of `proxy.ts` in Next.js 16 | Common Pitfalls | Routes might remain unprotected if old convention still works. |
| A2 | First registered user ID will be 1 or 2 | Migration | Small risk of ID collision if DB serial isn't reset, handled by hook. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 20+ | — |
| PostgreSQL | Data layer | ✓ | 15+ | — |
| OpenSSL | Secret generation | ✓ | — | Manual random string |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.mts` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Protected routes redirect to /login | Integration | `vitest tests/auth-protection.test.ts` | ❌ Wave 0 |
| AUTH-04 | User-data isolation in queries | Unit | `vitest tests/data-isolation.test.ts` | ❌ Wave 0 |
| AUTH-07 | First-user migration logic | Integration | `vitest tests/migration-hook.test.ts` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Better Auth (Password/OAuth) |
| V3 Session Management | Yes | Better Auth (HTTP-only cookies) |
| V5 Input Validation | Yes | Zod (Standard shadcn pattern) |
| V6 Cryptography | Yes | Better Auth (Argon2 / PKCE) |

### Known Threat Patterns for Next.js

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CSRF | Tampering | Better Auth CSRF protection (Origin check) |
| Session Hijacking | Information Disclosure | `secure: true`, `httpOnly: true` cookies |
| IDOR | Information Disclosure | Mandatory `userId` filter on all queries |

## Sources

### Primary (HIGH confidence)
- `better-auth.com/docs` - Hooks, Drizzle Adapter, Database config
- `nextjs.org/docs` - Next 15+ Breaking changes, `proxy.ts` RFC
- `shadcn.com` - Auth form patterns

### Secondary (MEDIUM confidence)
- GitHub Release Notes - Better Auth 1.x features
- Community Forums - Next.js 16 `proxy.ts` implementation details

## Metadata
**Confidence breakdown:**
- Standard stack: HIGH - Docs are current
- Architecture: HIGH - Verified with release notes
- Pitfalls: HIGH - Common issues in Next 15/16 documented

**Research date:** 2025-02-24
**Valid until:** 2025-03-24
