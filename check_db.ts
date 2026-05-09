import { db } from './src/db/index';
import { cardDefinitions } from './src/db/schema';
import { count, isNotNull } from 'drizzle-orm';

async function main() {
  const [total, withPrice] = await Promise.all([
    db.select({ value: count() }).from(cardDefinitions),
    db.select({ value: count() }).from(cardDefinitions).where(isNotNull(cardDefinitions.priceEur))
  ]);
  
  console.log('Total card definitions:', total[0].value);
  console.log('Cards with price data:', withPrice[0].value);
  
  if (withPrice[0].value > 0) {
    const sample = await db.select().from(cardDefinitions).where(isNotNull(cardDefinitions.priceEur)).limit(3);
    console.log('Sample prices:', sample.map(c => `${c.swudbId}: EUR ${c.priceEur}, USD ${c.priceUsd}`));
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
