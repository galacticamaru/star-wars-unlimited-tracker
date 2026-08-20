import { syncPrices } from '../src/lib/sync/prices';

/**
 * Manual trigger script for price synchronization.
 * Run with: npx tsx --env-file=.env.local scripts/sync-prices-now.ts
 *
 * G-34-1: this script used to print totalUpdated and per-set lines but never
 * looked at failedSets / unprocessedSets / setsProcessed / setsTotal, and
 * exited 0 whenever syncPrices() resolved -- so a run in which every real
 * card set failed (see 34-UAT.md) still printed a clean, exit-0 report. The
 * reporting below mirrors the shortfall vocabulary and strict
 * setsProcessed === setsTotal verdict already used by
 * src/app/api/cron/sync-cards/route.ts, so this manual trigger can no longer
 * hide a shortfall.
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

    console.log(`\nSets processed: ${result.setsProcessed}/${result.setsTotal}`);

    if (result.failedSets.length > 0) {
      console.error(`Failed sets: ${result.failedSets.join(', ')}`);
    } else {
      console.log('Failed sets: (none)');
    }

    if (result.unprocessedSets.length > 0) {
      console.error(`Unprocessed sets: ${result.unprocessedSets.join(', ')}`);
    } else {
      console.log('Unprocessed sets: (none)');
    }

    console.log(`Deadline hit: ${result.deadlineHit}`);

    const shortfall =
      result.failedSets.length > 0 ||
      result.unprocessedSets.length > 0 ||
      result.totalUpdated === 0;

    if (shortfall) {
      console.error('\n--- Sync completed with a shortfall ---');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n--- Sync Failed ---');
    console.error(error);
    process.exit(1);
  }
}

main();
