---
phase: 29-card-detail-page-performance
plan: "04"
recorded: 2026-06-03
---

## Findings

Metric: LCP
Rating: Poor
LCP element: `img.object-cover.transition-opacity.duration-300`
Root cause: The `transition-opacity duration-300` Tailwind classes on the card image delay the browser's LCP measurement — the image is not considered painted until it reaches full opacity, adding ~300 ms to the reported LCP timestamp.

Decision: targeted-fixes-needed

Regression list:
1. LCP — Poor — `img.object-cover.transition-opacity.duration-300` (card image, card detail route) — remove or guard the opacity transition so the above-fold LCP image is immediately opaque on first paint
