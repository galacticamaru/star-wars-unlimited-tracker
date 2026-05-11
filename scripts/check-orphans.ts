import { db } from '../src/db/index';
import { user, userCollections, decks, tradeExclusions, tradeManualWants, account } from '../src/db/schema';
import { eq, or } from 'drizzle-orm';

async function main() {
  console.log('--- Current Users ---');
  const allUsers = await db.select().from(user);
  console.table(allUsers);

  const oldIds = [1, 2];

  console.log('\n--- Orphaned Records Check ---');
  
  for (const id of oldIds) {
    console.log(`Checking for User ID: ${id}`);
    
    const collectionsCount = await db.select({ value: count() }).from(userCollections).where(eq(userCollections.userId, id));
    const decksCount = await db.select({ value: count() }).from(decks).where(eq(decks.userId, id));
    const exclusionsCount = await db.select({ value: count() }).from(tradeExclusions).where(eq(tradeExclusions.userId, id));
    const wantsCount = await db.select({ value: count() }).from(tradeManualWants).where(eq(tradeManualWants.userId, id));
    const accountsCount = await db.select({ value: count() }).from(account).where(eq(account.userId, id));

    console.log(`  user_collections: ${collectionsCount[0].value}`);
    console.log(`  decks:            ${decksCount[0].value}`);
    console.log(`  trade_exclusions: ${exclusionsCount[0].value}`);
    console.log(`  trade_manual_wants: ${wantsCount[0].value}`);
    console.log(`  accounts:         ${accountsCount[0].value}`);
  }

  process.exit(0);
}

import { count } from 'drizzle-orm';

main().catch(err => {
  console.error(err);
  process.exit(1);
});
