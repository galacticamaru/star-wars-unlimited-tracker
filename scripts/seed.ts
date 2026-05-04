// dotenv must be loaded BEFORE any app module imports
// This loads .env.local which contains DATABASE_URL
import { config } from 'dotenv';
config({ path: '.env.local' });

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
