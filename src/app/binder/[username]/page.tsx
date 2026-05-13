import { notFound } from 'next/navigation';
import { getUserIdByUsername, getPublicBinderData } from '@/db/queries/binder';
import { getFilterOptions } from '@/db/queries/catalog';
import { PublicBinderClient } from '@/components/binder/public-binder-client';
import type { CardForFilter } from '@/lib/filter-cards';

export const dynamic = 'force-dynamic';

interface PublicBinderPageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicBinderPage({ params }: PublicBinderPageProps) {
  const { username } = await params;
  
  const userId = await getUserIdByUsername(username);
  if (!userId) {
    notFound();
  }

  const [binderData, filterOptions] = await Promise.all([
    getPublicBinderData(userId),
    getFilterOptions(),
  ]);

  const mapToFilterable = (c: any): CardForFilter => ({
    id: c.id,
    swudbId: '', 
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
    backArtUrl: null, 
    frontText: null, 
    backText: null, 
    epicAction: null, 
    doubleSided: false, 
    unique: false, 
    priceEur: null,
    priceUsd: null,
    tradeQuantity: c.tradeQuantity,
    lookingForQuantity: c.lookingForQuantity,
  });

  const offerings = binderData.offerings.map(mapToFilterable);
  const lookingFor = binderData.lookingFor.map(mapToFilterable);

  return (
    <PublicBinderClient
      username={username}
      offerings={offerings}
      lookingFor={lookingFor}
      filterOptions={filterOptions}
    />
  );
}
