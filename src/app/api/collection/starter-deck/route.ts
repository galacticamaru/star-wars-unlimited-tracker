import { NextRequest } from 'next/server';
import { db } from '@/db';
import { cardPrintings } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { starterDecks } from '@/data/starter-decks';
import { batchIncrementVariantCounts, batchRecomputeTotals } from '@/db/queries/collection';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { deckId } = body as { deckId?: string };

    // Validate deckId against known starter decks (T-18-01: prevent tampering)
    if (!deckId) {
      return new Response('Missing deckId', { status: 400 });
    }
    const deck = starterDecks.find((d) => d.id === deckId);
    if (!deck) {
      return new Response('Unknown deck', { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);
    if (!Number.isFinite(userId) || userId <= 0) {
      return new Response('Unauthorized', { status: 401 });
    }
    const collectorNumbers = deck.cards.map((c) => c.collectorNumber);

    // Look up Normal variant printings for all cards in this deck
    const printings = await db
      .select({
        id: cardPrintings.id,
        collectorNumber: cardPrintings.collectorNumber,
        cardDefinitionId: cardPrintings.cardDefinitionId,
      })
      .from(cardPrintings)
      .where(
        and(
          inArray(cardPrintings.collectorNumber, collectorNumbers),
          eq(cardPrintings.variantType, 'Normal')
        )
      );

    // Build a lookup map: collectorNumber -> printing
    const printingByNumber = new Map(printings.map((p) => [p.collectorNumber, p]));

    // Build batch items; collect distinct cardDefinitionIds for batchRecomputeTotals
    const affectedDefinitionIds = new Set<number>();
    let cardsAdded = 0;
    const batchItems: Array<{ cardPrintingId: number; qtyToAdd: number }> = [];

    for (const card of deck.cards) {
      const printing = printingByNumber.get(card.collectorNumber);
      if (!printing) {
        // Card not found in DB — skip silently (could be a data gap)
        continue;
      }
      batchItems.push({ cardPrintingId: printing.id, qtyToAdd: card.qty });
      affectedDefinitionIds.add(printing.cardDefinitionId);
      cardsAdded += card.qty;
    }

    // Single batch upsert for all variant counts, then one batch recompute for totals
    await batchIncrementVariantCounts(batchItems, userId);
    await batchRecomputeTotals([...affectedDefinitionIds], userId);

    return Response.json({ cardsAdded });
  } catch (error) {
    console.error('Starter deck quick-add failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
