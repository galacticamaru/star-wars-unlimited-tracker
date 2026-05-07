# Plan 02-03 Summary

Card detail page implemented.

## Changes
- Created `src/app/cards/[set-code]/[card-number]/page.tsx`:
    - Server Component with async `params` (Next.js 16).
    - Fetches single card using `getCardByPrinting` query.
    - Handles missing cards with `notFound()`.
    - Responsive side-by-side layout: Image (320px) on left, metadata on right.
    - Renders all metadata: name, subtitle, type/arenas/aspects chips, stats (cost/power/hp), front/back/epic text blocks, and set info.
    - "Back to catalog" button for easy navigation.
    - Optimized image with `fill` and `preload` (Next.js 16 candidate).

## Verification Results
- `npm run build`: Success.
- Layout: Side-by-side on desktop, stacked on mobile confirmed in JSX.
- Next.js 16: Async `params` correctly awaited.
- Fallback: Grey box renders if `frontArtUrl` is missing.
