// Investigate why card_definitions have multiple Normal printings
import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';

async function main() {
  // Show the actual cards with duplicate Normal printings
  const dups = await db.execute(sql`
    SELECT cd.id, cd.swudb_id, cd.name, cd.subtitle,
           cp.set_code, cp.collector_number, cp.variant_type
    FROM card_definitions cd
    JOIN card_printings cp ON cp.card_definition_id = cd.id
    WHERE cp.variant_type = 'Normal'
      AND cd.id IN (
        SELECT card_definition_id
        FROM card_printings
        WHERE variant_type = 'Normal'
        GROUP BY card_definition_id
        HAVING COUNT(*) > 1
        LIMIT 5
      )
    ORDER BY cd.id, cp.set_code, cp.collector_number
  `);
  console.log('Cards with multiple Normal printings:');
  for (const row of dups.rows) {
    const r = row as { id: number, swudb_id: string, name: string, subtitle: string | null, set_code: string, collector_number: string, variant_type: string };
    console.log(`  def_id=${r.id} swudb_id=${r.swudb_id} name="${r.name}" subtitle="${r.subtitle ?? ''}" -> ${r.set_code}/${r.collector_number} (${r.variant_type})`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
