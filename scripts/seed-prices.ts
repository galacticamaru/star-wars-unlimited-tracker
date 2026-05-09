
import { db } from '../src/db/index';
import { cardDefinitions } from '../src/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function main() {
  console.log('Seeding mock price data...');
  
  // Spark of Rebellion starters/common
  const mockPrices = [
    { swudbId: 'SOR-001', priceEur: 6800, priceUsd: 8550 }, // Luke Skywalker
    { swudbId: 'SOR-010', priceEur: 8500, priceUsd: 9500 }, // Darth Vader
    { swudbId: 'SOR-030', priceEur: 125,  priceUsd: 150  }, // Common
    { swudbId: 'SOR-050', priceEur: 250,  priceUsd: 300  }, // Uncommon
  ];

  for (const p of mockPrices) {
    await db.update(cardDefinitions)
      .set({
        priceEur: p.priceEur,
        priceUsd: p.priceUsd,
        pricesUpdatedAt: new Date(),
      })
      .where(eq(cardDefinitions.swudbId, p.swudbId));
  }

  console.log('Seeded prices for 4 cards.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
