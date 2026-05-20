import 'dotenv/config';
import { db } from '../src/db/index';
import { cardDefinitions } from '../src/db/schema';
import { eq, ilike } from 'drizzle-orm';

async function main() {
  const cards = await db.select({ name: cardDefinitions.name, swudbId: cardDefinitions.swudbId }).from(cardDefinitions).where(ilike(cardDefinitions.name, '%Luke Skywalker%')).limit(5);
  console.log(cards);
  process.exit(0);
}
main();