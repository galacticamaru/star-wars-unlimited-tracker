import { getTopCardsByPrice } from '@/db/queries/catalog';
import { HeroSection } from '@/components/home/hero-section';
import { HighValueGrid } from '@/components/home/high-value-grid';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const topCards = await getTopCardsByPrice(10);

  // Serialize to plain objects — never pass Date columns across RSC→client boundary
  // getTopCardsByPrice selects only primitive columns (no timestamps), so the map
  // is a straightforward identity projection.
  const plainCards = topCards.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    setCode: c.setCode,
    collectorNumber: c.collectorNumber,
    frontArtUrl: c.frontArtUrl,
    backArtUrl: c.backArtUrl,
    priceUsd: c.priceUsd,
  }));

  return (
    <main>
      <HeroSection />
      <HighValueGrid cards={plainCards} />
    </main>
  );
}
