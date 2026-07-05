---
status: diagnosed
phase: 24-catalog-page-load-performance
source: [24-VERIFICATION.md]
started: 2026-05-26T00:00:00Z
updated: 2026-05-27T00:00:00Z
---

## Current Test

Human testing completed 2026-05-27.

## Tests

### 1. Search debounce URL write cadence
expected: Typing quickly in catalog search input updates the visible input instantly, but the URL `?q=` param only updates after ~150ms of typing inactivity — not on every keystroke. Open DevTools Network tab to confirm no per-keystroke requests.
result: passed

### 2. Clear All dual-reset visual confirmation
expected: With text in the search box, clicking "Clear All Filters" immediately clears the visible input AND removes `?q=` from the URL simultaneously. The input does not retain stale text.
result: passed

### 3. Virtualization DOM windowing
expected: With 1000+ cards in the catalog, only the cards visible in the viewport (plus a small overscan buffer) are rendered in the DOM. Open DevTools Elements panel and scroll — card elements should appear and disappear as you scroll. Total DOM card count should stay small (not 1000+).
result: passed

### 4. Responsive column reflow at breakpoints
expected: The card grid reflows columns as viewport width crosses Tailwind breakpoints: 3 columns below 640px, 5 at ≥640px, 7 at ≥768px, 9 at ≥1024px, 11 at ≥1280px. Resize the browser window to confirm reflow.
result: failed
notes: Cards are covering other cards at certain breakpoints. The full card is not always visible. Root cause likely: per-row height estimation (estimateSize: 160) does not account for varying card heights at different column counts, causing rows to overlap.

### 5. RSC cache LCP improvement
expected: On a production or Vercel preview build, the `/cards` route is served as a static (cached) page. Subsequent visitors should see faster LCP than before Phase 24 (no Postgres round-trip per request). Run Lighthouse or check the Network tab for cached HTML delivery.
result: skipped
notes: Requires production/Vercel preview deployment — not yet available for testing.

## Summary

total: 5
passed: 3
issues: 1
pending: 0
skipped: 1
blocked: 0

## Gaps

- status: failed
  test: 4
  description: Cards covering other cards at certain breakpoints — row height estimation insufficient
  root_cause: useVirtualizer estimateSize is a fixed 160px but actual row height varies with column count and card content. When the estimate is too small, absolutely-positioned rows overlap each other.
  fix: Use measureElement / dynamic row measurement in useVirtualizer, or compute estimateSize from actual card aspect ratio × row width ÷ columns. Ensure each virtual row has enough height clearance before the next row begins.
