---
phase: 29-card-detail-page-performance
plan: "04"
subsystem: speed-insights-checkpoint
tags: [performance, lcp, speed-insights, checkpoint]
dependency_graph:
  requires: [29-01, 29-02, 29-03]
  provides: [speed-insights-findings]
  affects: [29-05]
tech_stack:
  - Vercel Speed Insights
status: complete
---

## Summary

Human checkpoint: user reviewed Vercel Speed Insights for `/cards/[set-code]/[card-number]`.

**Decision:** `targeted-fixes-needed`

**Recorded regression:**
- **LCP — Poor** — LCP element is `img.object-cover.transition-opacity.duration-300`
  - The `transition-opacity duration-300` Tailwind classes delay the browser's LCP timestamp by ~300 ms; the image is not scored as painted until it reaches full opacity
  - Fix in Wave 2b (plan 29-05): remove the opacity transition from the LCP image (or guard it so it only fires on subsequent navigations, not the initial load)

## Self-Check: PASSED

- [x] 29-04-SPEED-INSIGHTS.md created with `## Findings` section
- [x] `Decision:` line is `targeted-fixes-needed`
- [x] Regression itemised with metric, rating, and responsible element
