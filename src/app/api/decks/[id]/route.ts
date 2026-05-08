import { NextRequest } from 'next/server';
import { getDeckWithCards, updateDeck, deleteDeck, getCardsByDefinitionIds } from '@/db/queries/decks';
import { validateDeck } from '@/lib/deck-validation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const deckId = parseInt(id, 10);
    
    if (isNaN(deckId)) {
      return new Response('Invalid deck ID', { status: 400 });
    }

    const deck = await getDeckWithCards(deckId, Number(session.user.id));
    if (!deck) {
      return new Response('Deck not found', { status: 404 });
    }

    return Response.json(deck);
  } catch (error) {
    console.error('Failed to fetch deck:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const deckId = parseInt(id, 10);
    
    if (isNaN(deckId)) {
      return new Response('Invalid deck ID', { status: 400 });
    }

    const body = await request.json();
    const { isDraft, leaderCardDefinitionId, baseCardDefinitionId, cards } = body;

    const userId = Number(session.user.id);

    if (isDraft === false) {
      // Need full deck state for validation
      let validationLeaderId = leaderCardDefinitionId;
      let validationBaseId = baseCardDefinitionId;
      let validationCards = cards;

      // If any part is missing from request, fetch current from DB
      if (validationLeaderId === undefined || validationBaseId === undefined || validationCards === undefined) {
        const currentDeck = await getDeckWithCards(deckId, userId);
        if (!currentDeck) return new Response('Deck not found', { status: 404 });
        
        if (validationLeaderId === undefined) validationLeaderId = currentDeck.leaderCardDefinitionId;
        if (validationBaseId === undefined) validationBaseId = currentDeck.baseCardDefinitionId;
        if (validationCards === undefined) {
          validationCards = currentDeck.cards.map(c => ({
            cardDefinitionId: c.cardDefinitionId,
            quantity: c.quantity,
            isSideboard: c.isSideboard
          }));
        }
      }

      // Fetch all card details
      const allIds = new Set<number>();
      if (validationLeaderId) allIds.add(validationLeaderId);
      if (validationBaseId) allIds.add(validationBaseId);
      validationCards.forEach((c: any) => allIds.add(c.cardDefinitionId));

      const cardDetails = await getCardsByDefinitionIds(Array.from(allIds));
      const cardMap = new Map(cardDetails.map(c => [c.id, c]));

      const leader = validationLeaderId ? (cardMap.get(validationLeaderId) as any) : null;
      const base = validationBaseId ? (cardMap.get(validationBaseId) as any) : null;
      
      const mainDeck = validationCards
        .filter((c: any) => !c.isSideboard)
        .map((c: any) => ({
          card: cardMap.get(c.cardDefinitionId),
          quantity: c.quantity
        }))
        .filter((item: any) => item.card); // Ensure card exists

      const sideboard = validationCards
        .filter((c: any) => c.isSideboard)
        .map((c: any) => ({
          card: cardMap.get(c.cardDefinitionId),
          quantity: c.quantity
        }))
        .filter((item: any) => item.card); // Ensure card exists

      const result = validateDeck(leader, base, mainDeck, sideboard);
      if (!result.isValid) {
        return Response.json({ success: false, errors: result.errors }, { status: 400 });
      }
    }

    await updateDeck(deckId, userId, body);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to update deck:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const deckId = parseInt(id, 10);
    
    if (isNaN(deckId)) {
      return new Response('Invalid deck ID', { status: 400 });
    }

    await deleteDeck(deckId, Number(session.user.id));
    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete deck:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
