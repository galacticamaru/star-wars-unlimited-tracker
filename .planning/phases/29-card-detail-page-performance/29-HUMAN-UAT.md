---
status: partial
phase: 29-card-detail-page-performance
source: [29-VERIFICATION.md]
started: 2026-06-03T00:00:00Z
updated: 2026-06-03T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Loading skeleton FCP
expected: Navigate to any card detail URL (e.g. `/cards/SOR/001`). The two-column animate-pulse skeleton should render immediately before DB queries resolve — visible as a brief flash of grey placeholders before the real card content appears.
result: [pending]

### 2. Cache invalidation round-trip
expected: While logged in, update a variant count on a card detail page. Navigate away (e.g. to the collection page), then navigate back to the same card detail page. The variant count should reflect the update — no stale cached values shown.
result: [pending]

### 3. LCP opacity-transition guard
expected: Open a card detail page and inspect the hero card image element in browser DevTools. On first paint, the classes `transition-opacity`, `duration-300`, and `opacity-0` should be absent from the `<img>` element. After clicking the leader-flip toggle button (if present), those classes should appear.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
