import { getAllCards, getFilterOptions } from '@/db/queries/catalog';
import { CatalogClient } from '@/components/catalog/catalog-client';

export default async function CatalogPage() {
  const [cards, filterOptions] = await Promise.all([
    getAllCards(),
    getFilterOptions(),
  ]);

  // Map to plain serializable objects — exclude createdAt/updatedAt (Date objects)
  // Pitfall 4: Drizzle timestamp columns return Date objects which cannot be serialized
  // across the Server→Client boundary. Select only needed columns (done in getAllCards).
  const plainCards = cards.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    aspects: c.aspects ?? [],
    setCode: c.setCode,
    collectorNumber: c.collectorNumber,
    frontArtUrl: c.frontArtUrl,
  }));

  return (
    <CatalogClient
      cards={plainCards}
      filterOptions={filterOptions}
    />
  );
}
