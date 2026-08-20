import { db } from '@/db';
import { cardDefinitions, cardPrintings } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { chunk, SYNC_CHUNK_SIZE } from './chunk';
import { getNonTokenSets, type SWUSet } from './set-list';

// Re-exported so existing importers of `SWUSet` from this module are unaffected
// by the move to set-list.ts (the single source of truth for the set list).
export type { SWUSet };

// ---- Types ----

export interface SWUCard {
  Set: string;
  Number: string;
  Name: string;
  Subtitle?: string;
  Type: string;
  Aspects?: string[];
  Traits?: string[];
  Arenas?: string[];
  Keywords?: string[];
  Cost?: string;
  Power?: string;
  HP?: string;
  FrontText?: string;
  BackText?: string;
  EpicAction?: string;
  DoubleSided: boolean;
  Rarity: string;
  Unique: boolean;
  Artist?: string;
  VariantType: string;
  FrontArt?: string;
  BackArt?: string;
}

export interface SyncRunOptions {
  /** Caller-supplied non-token set list. When absent, fetched via getNonTokenSets(). */
  sets?: SWUSet[];
  /** Absolute epoch-milliseconds instant. When absent, the run is unbounded. */
  deadlineAt?: number;
}

export interface CardSyncResult {
  setsTotal: number;
  setsProcessed: number; // successfully processed sets
  cardsUpserted: number;
  failedSets: string[]; // setIds whose cards fetch failed (D-05: run continues)
  unprocessedSets: string[]; // setIds never attempted because the deadline hit (D-08)
  deadlineHit: boolean;
}

// ---- Helpers ----

function parseIntOrNull(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

// ---- Core upsert function ----

/**
 * Upserts all cards for a given set into the database.
 * Skips token sets (setId starts with "T") and token card types.
 * Groups all variants by (Name, Subtitle) in memory before any DB operations —
 * no cross-DB lookup inside the loop. All variants share one card_definition_id.
 */
export async function upsertCards(setId: string, cards: SWUCard[]): Promise<number> {
  // Token set guard (unchanged — canonical location)
  if (setId.startsWith('T') && setId.length > 3 && !setId.match(/^TS\d{2}$/)) return 0;

  // Secondary filter — skip token card types (unchanged)
  const nonTokenCards = cards.filter(
    (card) => !card.Type.toLowerCase().includes('token')
  );

  // --- In-memory variant grouping ---
  // Key: "Name.trim()|Subtitle.trim()" (empty string for no subtitle)
  // Value: all variants of that logical card returned by the API for this set
  const groups = new Map<string, SWUCard[]>();
  for (const card of nonTokenCards) {
    const key = `${card.Name.trim()}|${(card.Subtitle ?? '').trim()}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(card);
    groups.set(key, bucket);
  }

  // --- Phase A: collect. Walk the groups once, build two in-memory arrays
  // instead of writing per-group. ---
  type DefinitionRow = {
    swudbId: string;
    name: string;
    subtitle: string | null;
    type: string;
    aspects: string[];
    arenas: string[];
    traits: string[];
    keywords: string[];
    cost: number | null;
    power: number | null;
    hp: number | null;
    frontText: string | null;
    backText: string | null;
    epicAction: string | null;
    doubleSided: boolean;
    unique: boolean;
    updatedAt: ReturnType<typeof sql>;
  };
  type PendingPrinting = {
    anchorSwudbId: string;
    setCode: string;
    collectorNumber: string;
    rarity: string;
    variantType: string;
    frontArtUrl: string | null;
    backArtUrl: string | null;
    artist: string | null;
    updatedAt: ReturnType<typeof sql>;
  };

  const definitionRows: DefinitionRow[] = [];
  const pendingPrintings: PendingPrinting[] = [];

  for (const variants of groups.values()) {
    // --- Anchor selection ---
    // Prefer Normal if present; otherwise use the variant with the lowest collectorNumber string.
    // "Lowest" is lexicographic — works for both numeric (SOR-001 < SOR-010) and
    // suffixed (SEC-030F) numbering since we only fall back here when no Normal exists.
    const anchor =
      variants.find((v) => v.VariantType === 'Normal') ??
      variants.slice().sort((a, b) =>
        `${a.Set}-${a.Number}`.localeCompare(`${b.Set}-${b.Number}`)
      )[0];

    const anchorCollectorNumber = `${anchor.Set}-${anchor.Number}`;

    definitionRows.push({
      swudbId: anchorCollectorNumber,
      name: anchor.Name,
      subtitle: anchor.Subtitle ?? null,
      type: anchor.Type,
      aspects: anchor.Aspects ?? [],
      arenas: anchor.Arenas ?? [],
      traits: anchor.Traits ?? [],
      keywords: anchor.Keywords ?? [],
      cost: parseIntOrNull(anchor.Cost),
      power: parseIntOrNull(anchor.Power),
      hp: parseIntOrNull(anchor.HP),
      frontText: anchor.FrontText ?? null,
      backText: anchor.BackText ?? null,
      epicAction: anchor.EpicAction ?? null,
      doubleSided: anchor.DoubleSided,
      unique: anchor.Unique,
      updatedAt: sql`now()`,
    });

    for (const card of variants) {
      const collectorNumber = `${card.Set}-${card.Number}`;
      pendingPrintings.push({
        anchorSwudbId: anchorCollectorNumber,
        setCode: card.Set,
        collectorNumber,
        rarity: card.Rarity,
        variantType: card.VariantType,
        frontArtUrl: card.FrontArt ?? null,
        backArtUrl: card.BackArt ?? null,
        artist: card.Artist ?? null,
        updatedAt: sql`now()`,
      });
    }
  }

  // --- Phase B: de-duplicate. Postgres raises "ON CONFLICT DO UPDATE command
  // cannot affect row a second time" when one multi-row statement carries two
  // rows with the same conflict key — the per-row loop this replaces silently
  // tolerated a duplicate from dirty upstream data, batching cannot. Last write wins. ---
  const dedupedDefinitionRows = Array.from(
    new Map(definitionRows.map((row) => [row.swudbId, row])).values()
  );
  const dedupedPrintingRows = Array.from(
    new Map(
      pendingPrintings.map((row) => [`${row.setCode}|${row.collectorNumber}`, row])
    ).values()
  );

  // --- Phase C: write definitions in chunks, building swudbId -> id from
  // the RETURNING rows (never a positional index). ---
  const idBySwudbId = new Map<string, number>();

  for (const defChunk of chunk(dedupedDefinitionRows, SYNC_CHUNK_SIZE)) {
    if (defChunk.length === 0) continue;
    const returned = await db
      .insert(cardDefinitions)
      .values(defChunk)
      .onConflictDoUpdate({
        target: cardDefinitions.swudbId,
        set: {
          name: sql`excluded.name`,
          subtitle: sql`excluded.subtitle`,
          type: sql`excluded.type`,
          aspects: sql`excluded.aspects`,
          arenas: sql`excluded.arenas`,
          traits: sql`excluded.traits`,
          keywords: sql`excluded.keywords`,
          cost: sql`excluded.cost`,
          power: sql`excluded.power`,
          hp: sql`excluded.hp`,
          frontText: sql`excluded.front_text`,
          backText: sql`excluded.back_text`,
          epicAction: sql`excluded.epic_action`,
          doubleSided: sql`excluded.double_sided`,
          unique: sql`excluded.unique`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: cardDefinitions.id, swudbId: cardDefinitions.swudbId });

    for (const row of returned) {
      idBySwudbId.set(row.swudbId, row.id);
    }
  }

  // --- Phase D: resolve each pending printing's cardDefinitionId from the
  // swudbId map, then write in chunks. A miss throws rather than writing an
  // orphan or silently skipping the row. ---
  const printingRows = dedupedPrintingRows.map((printing) => {
    const cardDefinitionId = idBySwudbId.get(printing.anchorSwudbId);
    if (cardDefinitionId === undefined) {
      throw new Error(
        `upsertCards(${setId}): unresolved swudbId "${printing.anchorSwudbId}" — no card_definitions id returned for this anchor`
      );
    }
    return {
      cardDefinitionId,
      setCode: printing.setCode,
      collectorNumber: printing.collectorNumber,
      rarity: printing.rarity,
      variantType: printing.variantType,
      frontArtUrl: printing.frontArtUrl,
      backArtUrl: printing.backArtUrl,
      artist: printing.artist,
      updatedAt: printing.updatedAt,
    };
  });

  for (const printingChunk of chunk(printingRows, SYNC_CHUNK_SIZE)) {
    if (printingChunk.length === 0) continue;
    await db
      .insert(cardPrintings)
      .values(printingChunk)
      .onConflictDoUpdate({
        target: [cardPrintings.setCode, cardPrintings.collectorNumber],
        set: {
          cardDefinitionId: sql`excluded.card_definition_id`,
          rarity: sql`excluded.rarity`,
          variantType: sql`excluded.variant_type`,
          frontArtUrl: sql`excluded.front_art_url`,
          backArtUrl: sql`excluded.back_art_url`,
          artist: sql`excluded.artist`,
          updatedAt: sql`now()`,
        },
      });
  }

  return printingRows.length;
}

// ---- Top-level sync function (used by seed script and cron route) ----

/**
 * Fetches (or accepts) the non-token set list and upserts all cards for every
 * set. This is the entry point for both the seed script and the Vercel Cron job.
 *
 * Every set in the list ends up accounted for in exactly one of: setsProcessed,
 * failedSets, or unprocessedSets — never silently dropped from the accounting.
 */
export async function syncAllCards(options: SyncRunOptions = {}): Promise<CardSyncResult> {
  const nonTokenSets = options.sets ?? (await getNonTokenSets());

  let totalUpserted = 0;
  let setsSucceeded = 0;
  const failedSets: string[] = [];
  const unprocessedSets: string[] = [];
  let deadlineHit = false;

  for (let i = 0; i < nonTokenSets.length; i++) {
    const set = nonTokenSets[i];

    // D-08: soft deadline, checked once per set boundary — never interrupts a
    // set already in progress. Reports and stops; does not persist a resume
    // cursor (that is SYNC-05, deferred).
    if (options.deadlineAt !== undefined && Date.now() >= options.deadlineAt) {
      deadlineHit = true;
      for (let j = i; j < nonTokenSets.length; j++) {
        unprocessedSets.push(nonTokenSets[j].setId);
      }
      break;
    }

    try {
      const cardsResponse = await fetch(`https://api.swu-db.com/cards/${set.setId}`);
      if (!cardsResponse.ok) {
        console.error(`Failed to fetch cards for set ${set.setId}: ${cardsResponse.status}`);
        failedSets.push(set.setId);
        continue; // Skip this set, continue with others (D-05)
      }
      const { data: cards }: { data: SWUCard[] } = await cardsResponse.json();
      const count = await upsertCards(set.setId, cards);
      totalUpserted += count;
      setsSucceeded = setsSucceeded + 1;
    } catch (error) {
      console.error(`Error syncing cards for set ${set.setId}:`, error);
      failedSets.push(set.setId);
    }
  }

  return {
    setsTotal: nonTokenSets.length,
    setsProcessed: setsSucceeded,
    cardsUpserted: totalUpserted,
    failedSets,
    unprocessedSets,
    deadlineHit,
  };
}
