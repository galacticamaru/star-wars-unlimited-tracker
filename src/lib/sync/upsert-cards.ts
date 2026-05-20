import { db } from '@/db';
import { cardDefinitions, cardPrintings } from '@/db/schema';
import { sql, eq, and, isNull } from 'drizzle-orm';

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

export interface SWUSet {
  setId: string;
  fullName: string;
  numberCards: number;
}

interface SyncResult {
  setsTotal: number;
  setsProcessed: number; // successfully processed sets
  cardsUpserted: number;
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

  let upsertCount = 0;

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

    // --- Upsert card_definitions once per logical card ---
    const [def] = await db
      .insert(cardDefinitions)
      .values({
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
      })
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
      .returning({ id: cardDefinitions.id });

    // --- Upsert card_printings for every variant in the group ---
    // CRITICAL: cardDefinitionId is included in the update set so that
    // re-seeding self-heals previously orphaned rows (rows that point to
    // the wrong card_definition_id due to the old two-pass bug).
    for (const card of variants) {
      const collectorNumber = `${card.Set}-${card.Number}`;
      await db
        .insert(cardPrintings)
        .values({
          cardDefinitionId: def.id,
          setCode: card.Set,
          collectorNumber,
          rarity: card.Rarity,
          variantType: card.VariantType,
          frontArtUrl: card.FrontArt ?? null,
          backArtUrl: card.BackArt ?? null,
          artist: card.Artist ?? null,
          updatedAt: sql`now()`,
        })
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

      upsertCount++;
    }
  }

  return upsertCount;
}

// ---- Top-level sync function (used by seed script and cron route) ----

/**
 * Fetches all sets from swu-db.com, skips token sets, and upserts all cards.
 * This is the entry point for both the seed script and the Vercel Cron job.
 */
export async function syncAllCards(): Promise<SyncResult> {
  const setsResponse = await fetch('https://api.swu-db.com/sets');
  if (!setsResponse.ok) {
    throw new Error(`Failed to fetch sets: ${setsResponse.status}`);
  }
  const sets: SWUSet[] = await setsResponse.json();

  // Pre-filter token sets here to avoid unnecessary API calls — upsertCards also
  // guards against token sets (that is the canonical location), but fetching cards
  // for token sets only to discard them is wasteful.
  const nonTokenSets = sets.filter((s) => !(s.setId.startsWith('T') && s.setId.length > 3 && !s.setId.match(/^TS\d{2}$/)));

  let totalUpserted = 0;
  let setsSucceeded = 0;

  for (const set of nonTokenSets) {
    const cardsResponse = await fetch(`https://api.swu-db.com/cards/${set.setId}`);
    if (!cardsResponse.ok) {
      console.error(`Failed to fetch cards for set ${set.setId}: ${cardsResponse.status}`);
      continue; // Skip this set, continue with others
    }
    const { data: cards }: { data: SWUCard[] } = await cardsResponse.json();
    const count = await upsertCards(set.setId, cards);
    totalUpserted += count;
    setsSucceeded = setsSucceeded + 1;
  }

  return { setsTotal: nonTokenSets.length, setsProcessed: setsSucceeded, cardsUpserted: totalUpserted };
}
