import type { NextRequest } from 'next/server';
import { syncAllCards } from '@/lib/sync/upsert-cards';
import { syncPrices } from '@/lib/sync/prices';
import { getNonTokenSets } from '@/lib/sync/set-list';
import { revalidateTag } from 'next/cache';

// D-09: confirmed from Vercel Settings -> Functions / Settings -> Cron Jobs
// and recorded in 34-BUDGET.md (CONFIRMED_MAX_DURATION_SECONDS). Plain
// numeric literal — Next.js's route segment config requires this to be
// statically analysable, not imported or computed.
export const maxDuration = 300;

// D-08: soft deadline is 80% of maxDuration, derived once from the export
// above so the deadline and the budget can never drift apart.
const SOFT_DEADLINE_RATIO = 0.8;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Guard: cronSecret must be set AND header must match exactly
  // Checking !cronSecret first prevents empty-string bypass
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const startTime = Date.now();
  const deadlineAt = startTime + maxDuration * 1000 * SOFT_DEADLINE_RATIO;

  try {
    // D-10: fetch the shared set list exactly once and hand the identical
    // array to both halves, so cards and prices can never disagree about scope.
    const sets = await getNonTokenSets();

    console.log('Starting card sync...');
    const cardResult = await syncAllCards({ sets, deadlineAt });

    console.log('Starting price sync...');
    const priceResult = await syncPrices({ sets, deadlineAt });

    // Invalidate cards cache after every non-throwing run (success or
    // shortfall alike) — the sets that did land genuinely changed, and
    // withholding invalidation would serve stale cache for real updates.
    revalidateTag('cards', 'max');

    const duration = (Date.now() - startTime) / 1000;

    // Honest verdict: no threshold, no "mostly succeeded" allowance. A
    // shortfall of even one set in either half fails the run (D-07).
    // setsTotal > 0 guards the empty-set-list case — zero-of-zero must not
    // read as a complete sync.
    const cardsOk = cardResult.setsTotal > 0 && cardResult.setsProcessed === cardResult.setsTotal;
    const pricesOk = priceResult.setsTotal > 0 && priceResult.setsProcessed === priceResult.setsTotal;
    const success = cardsOk && pricesOk;

    if (!success) {
      console.error(
        'Sync shortfall:',
        JSON.stringify({
          cardsOk,
          pricesOk,
          cards: {
            setsProcessed: cardResult.setsProcessed,
            setsTotal: cardResult.setsTotal,
            failedSets: cardResult.failedSets,
            unprocessedSets: cardResult.unprocessedSets,
          },
          prices: {
            setsProcessed: priceResult.setsProcessed,
            setsTotal: priceResult.setsTotal,
            failedSets: priceResult.failedSets,
            unprocessedSets: priceResult.unprocessedSets,
          },
        })
      );
    }

    return Response.json(
      {
        success,
        cards: cardResult,
        prices: priceResult,
        deadlineHit: cardResult.deadlineHit || priceResult.deadlineHit,
        duration: `${duration}s`,
      },
      { status: success ? 200 : 500 }
    );
  } catch (error) {
    console.error('Sync failed:', error);
    return new Response('Sync failed', { status: 500 });
  }
}
