import { getDeckWithCards } from '@/db/queries/decks';
import { getAllCards, getFilterOptions } from '@/db/queries/catalog';
import { DeckBuilder } from '@/components/decks/deck-builder';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deckId = parseInt(id, 10);
  
  if (isNaN(deckId)) notFound();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const [deckData, allCards, filterOptions] = await Promise.all([
    getDeckWithCards(deckId, Number(session.user.id)),
    getAllCards(Number(session.user.id)),
    getFilterOptions(),
  ]);

  if (!deckData) notFound();

  const formattedDeck = {
    id: deckData.id,
    name: deckData.name,
    leaderCardDefinitionId: deckData.leaderCardDefinitionId,
    baseCardDefinitionId: deckData.baseCardDefinitionId,
    isDraft: deckData.isDraft,
    cards: deckData.cards.map(c => ({
        cardDefinitionId: c.cardDefinitionId,
        quantity: c.quantity,
        isSideboard: c.isSideboard
    }))
  };

  // Convert DB cards to plain serializable objects
  const cards = allCards.map(c => ({
    id: c.id,
    swudbId: c.swudbId,
    name: c.name,
    subtitle: c.subtitle,
    type: c.type,
    aspects: c.aspects ?? [],
    arenas: c.arenas ?? [],
    traits: c.traits ?? [],
    keywords: c.keywords ?? [],
    cost: c.cost,
    power: c.power,
    hp: c.hp,
    rarity: c.rarity,
    setCode: c.setCode,
    collectorNumber: c.collectorNumber,
    frontArtUrl: c.frontArtUrl,
    backArtUrl: c.backArtUrl,
    frontText: c.frontText,
    backText: c.backText,
    epicAction: c.epicAction,
    doubleSided: c.doubleSided,
    unique: c.unique,
    priceEur: c.priceEur,
    priceUsd: c.priceUsd,
    variantType: c.variantType ?? undefined,
  }));

  return (
    <DeckBuilder 
      initialDeck={formattedDeck} 
      allCards={cards} 
      filterOptions={filterOptions} 
    />
  );
}
