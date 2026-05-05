import { db } from './src/db/index';
import { cardDefinitions } from './src/db/schema';
import { count } from 'drizzle-orm';

async function main() {
  const result = await db.select({ value: count() }).from(cardDefinitions);
  console.log('Total card definitions:', result[0].value);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
