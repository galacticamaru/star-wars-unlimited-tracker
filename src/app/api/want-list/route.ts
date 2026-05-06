import { getDeckCardsForUser } from '@/db/queries/decks';
import { getUserCollection } from '@/db/queries/collection';

export async function GET() {
  try {
    const [allDeckCards, collection] = await Promise.all([
      getDeckCardsForUser(1),
      getUserCollection(1),
    ]);

    // Build owned-count map
    const ownedMap: Record<number, number> = {};
    for (const row of collection) {
      ownedMap[row.cardDefinitionId] = row.count;
    }

    // Aggregate: max quantity per card across all decks (non-sideboard only)
    const maxQty: Record<number, { quantity: number; meta: typeof allDeckCards[0] }> = {};
    for (const row of allDeckCards) {
      if (row.isSideboard) continue;
      const existing = maxQty[row.cardDefinitionId];
      if (!existing || row.quantity > existing.quantity) {
        maxQty[row.cardDefinitionId] = { quantity: row.quantity, meta: row };
      }
    }

    // Compute shortfall and filter to cards where shortfall > 0
    const result = Object.entries(maxQty)
      .map(([idStr, { quantity, meta }]) => {
        const id = Number(idStr);
        const owned = ownedMap[id] ?? 0;
        const shortfall = Math.max(0, quantity - owned);
        if (shortfall === 0) return null;
        return {
          cardDefinitionId: id,
          name: meta.name,
          type: meta.type,
          setCode: meta.setCode,
          collectorNumber: meta.collectorNumber,
          frontArtUrl: meta.frontArtUrl,
          backArtUrl: meta.backArtUrl,
          maxQuantity: quantity,
          owned,
          shortfall,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return Response.json(result);
  } catch (error) {
    console.error('Failed to compute want list:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
