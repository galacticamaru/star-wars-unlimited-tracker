---
phase: 30
slug: unified-search-driven-add-flow
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-19
---

# Phase 30 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| client → `PATCH /api/trade` | Authenticated user submits `{ cardPrintingId, tradeQuantity }`; server authorizes per-printing ownership | User trade-offering quantities (own data) |
| client → `POST /api/binder/wants` | Authenticated user submits `{ cardPrintingId, quantity }`; wants intentionally allowed for any printing (D-06/BINDER-14) | User want quantities (own data) |
| client → `GET /api/cards/all` | Unauthenticated public catalog; full catalog shipped to browser on first keystroke | Public card metadata (names/art/types) |
| client → `GET /api/collection/owned-cards` | Authenticated; rows scoped to `session.user.id` | Current user's ownership/trade counts |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-30-01 | Elevation of Privilege / Broken Access Control | `PATCH /api/trade` | high | mitigate | Server-side ownership gate: `requestedQuantity > 0` requires `userPrintingCollections.count > 0` else `403`; numeric-type validation on `cardPrintingId`/`tradeQuantity` (CR-01) prevents `NaN`-bypass. `src/app/api/trade/route.ts:24-53` | closed |
| T-30-02 | Tampering | `VariantWantSection` → `POST /api/binder/wants` | low | accept | Wants deliberately unrestricted by ownership; endpoint requires a session and scopes writes to `session.user.id` — no new exposure | closed |
| T-30-03 | Information Disclosure | client trade/want steppers | low | accept | Steppers receive only the current user's own per-printing counts from authenticated endpoints; no cross-user data | closed |
| T-30-04 | Elevation of Privilege | trade stepper rendered in variant sheet | medium | mitigate | Trade stepper disabled for unowned variants client-side (`variant-trade-section.tsx:92,105,114` — `count === 0 \|\| !isOwned` / `!isOwned`) AND rejected server-side (T-30-01); sheet composes both, no independent write path | closed |
| T-30-05 | Information Disclosure | sheet variant list showing unowned variants | low | accept | Variant metadata (name/subtitle/variantType) is public catalog data; only the current user's own counts are pre-filled | closed |
| T-30-06 | Information Disclosure | full-catalog client fetch (`GET /api/cards/all`) | low | accept | Catalog is public, non-user data; route returns no user-scoped fields | closed |
| T-30-07 | Information Disclosure | `GET /api/collection/owned-cards` fetched on first keystroke | low | accept | Endpoint requires a session and scopes rows to `session.user.id`; moving the fetch to first keystroke does not change authorization | closed |
| T-30-08 | Elevation of Privilege | want/trade writes from reworked page | low | mitigate | Trade writes remain server-authorized (T-30-01); want writes intentionally unrestricted (BINDER-14) and stay session-scoped — no new write path | closed |
| T-30-09 | Denial of Service | first-keystroke full-catalog fetch | low | accept | Single cached fetch (`cards` tag, `cacheLife('days')`), gated behind a fetched-once flag + 2-char minimum + 150ms debounce; no unbounded amplification | closed |
| T-30-SC | Tampering (supply chain) | npm installs | low | accept | No new dependencies added across Plans 01–03 (PATTERNS.md confirms zero new packages); no install step to gate | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-30-01 | T-30-02, T-30-03, T-30-05 | Want writes and stepper data expose only public catalog data or the current user's own session-scoped counts | plan-time disposition (Plans 01–02) | 2026-07-19 |
| AR-30-02 | T-30-06, T-30-07 | Public catalog is non-sensitive; owned-cards fetch remains session-scoped regardless of fetch timing | plan-time disposition (Plan 03) | 2026-07-19 |
| AR-30-03 | T-30-09 | Cached, debounced, fetched-once catalog request bounds request volume | plan-time disposition (Plan 03) | 2026-07-19 |
| AR-30-04 | T-30-SC | No new dependencies introduced this phase | plan-time disposition (Plans 01–03) | 2026-07-19 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-19 | 10 | 10 | 0 | gsd-secure-phase (L1, register authored at plan time) |

Verification method: L1 short-circuit — register authored at plan time (all three PLANs carried parseable `<threat_model>` blocks), ASVS level 1, `threats_open: 0`. The three `mitigate`-disposition threats (T-30-01, T-30-04, T-30-08) were grep-verified against implementation; all `accept`-disposition threats documented in the Accepted Risks Log. No auditor subagent required per the short-circuit rule.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-19
