// Run with: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx --env-file=.env.local scripts/orphan-check.ts
// Checks for orphaned card_printings rows (variants whose card_definition_id doesn't match
// the Normal anchor for their set+name group) after re-seeding with the new upsertCards.
import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running orphan-check queries...\n');

  // Query 1: card_printings rows where no sibling sharing the same card_definition_id
  // has variant_type = 'Normal', but a Normal card with the same set_code exists under
  // a different collector_number (i.e. different card_definition_id — orphaned link).
  const orphanResult = await db.execute(sql`
    SELECT COUNT(*)::int AS orphaned_variants
    FROM card_printings cp
    WHERE NOT EXISTS (
      SELECT 1 FROM card_printings cp2
      WHERE cp2.card_definition_id = cp.card_definition_id
        AND cp2.set_code = cp.set_code
        AND cp2.variant_type = 'Normal'
    )
    AND EXISTS (
      SELECT 1 FROM card_printings cp3
      WHERE cp3.set_code = cp.set_code
        AND cp3.variant_type = 'Normal'
        AND cp3.collector_number != cp.collector_number
    )
  `);

  const orphanedVariants: number = (orphanResult.rows[0] as { orphaned_variants: number }).orphaned_variants;
  console.log('orphaned_variants:', orphanedVariants);

  // Query 2: card_definitions with no card_printings referencing them (leftover from old runs)
  const unrefResult = await db.execute(sql`
    SELECT COUNT(*)::int AS unreferenced_definitions
    FROM card_definitions cd
    WHERE NOT EXISTS (
      SELECT 1 FROM card_printings cp
      WHERE cp.card_definition_id = cd.id
    )
  `);

  const unreferencedDefinitions: number = (unrefResult.rows[0] as { unreferenced_definitions: number }).unreferenced_definitions;
  console.log('unreferenced_definitions:', unreferencedDefinitions);

  // If orphaned variants exist, list them for the report
  if (orphanedVariants > 0) {
    const detailResult = await db.execute(sql`
      SELECT cp.set_code, cp.collector_number, cp.variant_type, cp.card_definition_id
      FROM card_printings cp
      WHERE NOT EXISTS (
        SELECT 1 FROM card_printings cp2
        WHERE cp2.card_definition_id = cp.card_definition_id
          AND cp2.set_code = cp.set_code
          AND cp2.variant_type = 'Normal'
      )
      AND EXISTS (
        SELECT 1 FROM card_printings cp3
        WHERE cp3.set_code = cp.set_code
          AND cp3.variant_type = 'Normal'
          AND cp3.collector_number != cp.collector_number
      )
      ORDER BY cp.set_code, cp.collector_number
      LIMIT 50
    `);
    console.log('\nOrphaned rows (up to 50):');
    console.table(detailResult.rows);
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch((err) => {
  console.error('orphan-check failed:', err);
  process.exit(1);
});
