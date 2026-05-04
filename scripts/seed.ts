// DATABASE_URL is loaded by tsx --env-file=.env.local (see db:seed script in package.json)
// ESM import hoisting means dotenv config() runs too late; --env-file loads before any module code
import { syncAllCards } from '../src/lib/sync/upsert-cards';

async function seed() {
  console.log('Starting card catalog seed from swu-db.com...');
  const result = await syncAllCards();
  console.log(
    `Seed complete: ${result.setsProcessed} sets processed, ${result.cardsUpserted} cards upserted`
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
