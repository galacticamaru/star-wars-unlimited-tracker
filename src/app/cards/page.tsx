import { getAllCards, getFilterOptions } from '@/db/queries/catalog';
import { CatalogClient } from '@/components/catalog/catalog-client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const [cards, filterOptions] = await Promise.all([
    getAllCards(session?.user.id ? Number(session.user.id) : undefined),
    getFilterOptions(),
  ]);

  // Map to plain serializable objects — exclude createdAt/updatedAt (Date objects)
  // Pitfall 4: Drizzle timestamp columns return Date objects which cannot be serialized
  // across the Server→Client boundary. Select only needed columns (done in getAllCards).
  const plainCards = cards.map(c => ({
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
  }));

  return (
    <CatalogClient
      cards={plainCards}
      filterOptions={filterOptions}
    />
  );
}
