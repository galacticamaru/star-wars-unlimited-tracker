import type { NextRequest } from 'next/server';
import { asc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { cardPrintings } from '@/db/schema';

// SYNC-02's 24-hour staleness window — the single threshold this route checks against.
export const FRESH_WINDOW_HOURS = 24;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Guard: cronSecret must be set AND header must match exactly
  // Checking !cronSecret first prevents empty-string bypass
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Single read-only aggregate over card_printings (D-02) — no new table, no migration.
    // orderBy is load-bearing: Postgres does not guarantee GROUP BY output order, so without
    // it two identical calls could return differently-ordered bodies.
    const rows = await db
      .select({
        setCode: cardPrintings.setCode,
        lastSyncedAt: sql<string>`max(${cardPrintings.updatedAt})`,
      })
      .from(cardPrintings)
      .groupBy(cardPrintings.setCode)
      .orderBy(asc(cardPrintings.setCode));

    // Sorted again in application code, not just via SQL orderBy: Postgres GROUP BY
    // output order is unspecified, so a belt-and-suspenders sort here is what actually
    // guarantees two identical calls serialise identically, independent of driver behavior.
    const sets = rows
      .map((row) => {
        const ageHours =
          Math.round(
            ((Date.now() - new Date(row.lastSyncedAt).getTime()) / 3_600_000) * 100
          ) / 100;
        return {
          setCode: row.setCode,
          lastSyncedAt: row.lastSyncedAt,
          ageHours,
          stale: ageHours > FRESH_WINDOW_HOURS,
        };
      })
      .sort((a, b) => a.setCode.localeCompare(b.setCode));

    // sets.length > 0 is mandatory: Array.prototype.every is vacuously true on an empty
    // array, so an entirely empty card_printings table must never report fresh:true.
    const fresh = sets.length > 0 && sets.every((s) => !s.stale);

    return Response.json({ fresh, checkedAt: new Date().toISOString(), sets });
  } catch (error) {
    console.error('Sync status failed:', error);
    return new Response('Sync status failed', { status: 500 });
  }
}
