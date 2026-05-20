import 'dotenv/config';
import { db } from '../src/db/index';
import { cardPrintings } from '../src/db/schema';
import { inArray } from 'drizzle-orm';

const spotlightNumbers = [
  // JTL Boba Fett
  'JTL-009','SHD-026','JTL-132','JTL-133','SOR-130','SOR-131','JTL-187','JTL-139',
  'JTL-141','JTL-189','JTL-183','JTL-237','TWI-181','JTL-185','JTL-240','JTL-165',
  'JTL-140','SOR-132','SOR-184','JTL-230','TWI-170','TWI-171','SOR-186','SOR-139','JTL-144',
  // JTL Han Solo
  'JTL-017','SOR-024','SHD-095','SOR-204','JTL-093','JTL-245','JTL-196','SOR-097',
  'TWI-110','JTL-097','SOR-192','JTL-215','JTL-103','TWI-114','JTL-210','SHD-195',
  'TWI-191','JTL-096','JTL-200','JTL-217','JTL-249','JTL-124','SOR-217','TWI-226',
  'JTL-208','JTL-209','JTL-235',
  // LOF Darth Maul
  'LOF-009','LOF-021','LOF-031','LOF-154','LOF-059','LOF-156','LOF-229','LOF-129',
  'LOF-063','LOF-160','LOF-067','LOF-231','LOF-035','TWI-135','LOF-137','LOF-038',
  'LOF-230','LOF-039','LOF-131','LOF-233','LOF-041','LOF-138','LOF-140','SOR-137',
  // LOF Qui-Gon Jinn
  'LOF-016','LOF-023','LOF-190','LOF-255','SHD-096','LOF-242','TWI-193','LOF-193',
  'LOF-111','LOF-096','JTL-201','LOF-196','LOF-249','LOF-199','LOF-100','LOF-194',
  'LOF-099','LOF-197','LOF-198','LOF-218','SOR-219','LOF-227','LOF-104','LOF-201',
  // SEC Palpatine
  'SEC-001','SEC-022','SEC-055','SEC-079','LOF-082','SEC-111','SEC-081','SEC-241',
  'SEC-031','SEC-082','SEC-033','SEC-084','SEC-085','SEC-034','SEC-036','SEC-087',
  'SEC-027','JTL-033','SEC-083','SEC-037','SEC-245','SEC-124','SEC-076','LOF-043',
  'SEC-077','SEC-092','SEC-070','SEC-123',
];

async function main() {
  const rows = await db.select({ collectorNumber: cardPrintings.collectorNumber })
    .from(cardPrintings)
    .where(inArray(cardPrintings.collectorNumber, spotlightNumbers));

  const found = new Set(rows.map((r: { collectorNumber: string }) => r.collectorNumber));
  const missing = spotlightNumbers.filter(n => !found.has(n));
  console.log('Total numbers checked:', spotlightNumbers.length);
  console.log('Found in DB:', found.size);
  console.log('Missing collector numbers:', missing.length > 0 ? missing : '(none - all valid)');

  // Group missing by prefix for diagnosis
  if (missing.length > 0) {
    const bySet: Record<string, string[]> = {};
    for (const n of missing) {
      const prefix = n.split('-')[0];
      bySet[prefix] = bySet[prefix] || [];
      bySet[prefix].push(n);
    }
    console.log('Missing by set:', JSON.stringify(bySet, null, 2));
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Query failed:', err);
  process.exit(1);
});
