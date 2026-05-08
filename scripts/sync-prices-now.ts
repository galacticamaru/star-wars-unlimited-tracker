import { syncPrices } from '../src/lib/sync/prices';

/**
 * Manual trigger script for price synchronization.
 * Run with: npx tsx --env-file=.env.local scripts/sync-prices-now.ts
 */
async function main() {
  console.log('--- Manual Price Sync Started ---');
  const startTime = Date.now();

  try {
    const result = await syncPrices();
    const duration = (Date.now() - startTime) / 1000;

    console.log('\n--- Sync Results ---');
    console.log(`Total cards updated: ${result.totalUpdated}`);
    result.sets.forEach(s => {
      console.log(`  Set ${s.setCode}: ${s.updated} cards`);
    });
    console.log(`Duration: ${duration.toFixed(2)}s`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n--- Sync Failed ---');
    console.error(error);
    process.exit(1);
  }
}

main();
