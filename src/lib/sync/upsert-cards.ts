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
  setsProcessed: number;
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
 * Uses a two-pass strategy: Normal variants first (create card_definitions),
 * then Foil/Hyperspace variants (look up existing card_definitions by name+subtitle).
 */
export async function upsertCards(setId: string, cards: SWUCard[]): Promise<number> {
  // Primary token set filter — skip entire token sets
  if (setId.startsWith('T')) return 0;

  // Secondary filter — skip token card types
  const nonTokenCards = cards.filter(
    (card) => !card.Type.toLowerCase().includes('token')
  );

  let upsertCount = 0;

  // Pass 1: Normal variants — these anchor the card_definitions rows
  const normalCards = nonTokenCards.filter((card) => card.VariantType === 'Normal');

  for (const card of normalCards) {
    const collectorNumber = `${card.Set}-${card.Number}`;

    // Upsert card_definitions row keyed on swudb_id = collectorNumber
    const [def] = await db
      .insert(cardDefinitions)
      .values({
        swudbId: collectorNumber,
        name: card.Name,
        subtitle: card.Subtitle ?? null,
        type: card.Type,
        aspects: card.Aspects ?? [],
        arenas: card.Arenas ?? [],
        traits: card.Traits ?? [],
        keywords: card.Keywords ?? [],
        cost: parseIntOrNull(card.Cost),
        power: parseIntOrNull(card.Power),
        hp: parseIntOrNull(card.HP),
        frontText: card.FrontText ?? null,
        backText: card.BackText ?? null,
        epicAction: card.EpicAction ?? null,
        doubleSided: card.DoubleSided,
        unique: card.Unique,
        updatedAt: new Date(),
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
          updatedAt: new Date(),
        },
      })
      .returning({ id: cardDefinitions.id });

    // Upsert the Normal card_printings row
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
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [cardPrintings.setCode, cardPrintings.collectorNumber],
        set: {
          rarity: sql`excluded.rarity`,
          variantType: sql`excluded.variant_type`,
          frontArtUrl: sql`excluded.front_art_url`,
          backArtUrl: sql`excluded.back_art_url`,
          artist: sql`excluded.artist`,
          updatedAt: new Date(),
        },
      });

    upsertCount++;
  }

  // Pass 2: Non-Normal variants (Foil, Hyperspace, Hyperspace Foil, Showcase)
  // Look up existing card_definitions by name+subtitle rather than creating new rows
  const variantCards = nonTokenCards.filter((card) => card.VariantType !== 'Normal');

  for (const card of variantCards) {
    const collectorNumber = `${card.Set}-${card.Number}`;

    // Look up existing card_definitions by name + subtitle
    const query = db
      .select({ id: cardDefinitions.id })
      .from(cardDefinitions)
      .where(
        card.Subtitle
          ? and(
              eq(cardDefinitions.name, card.Name),
              eq(cardDefinitions.subtitle, card.Subtitle)
            )
          : and(
              eq(cardDefinitions.name, card.Name),
              isNull(cardDefinitions.subtitle)
            )
      );

    const [existing] = await query;

    if (!existing) {
      // If no Normal variant was found (e.g., card only exists as Hyperspace in this set),
      // create the card_definitions row using this variant's data
      const [def] = await db
        .insert(cardDefinitions)
        .values({
          swudbId: collectorNumber,
          name: card.Name,
          subtitle: card.Subtitle ?? null,
          type: card.Type,
          aspects: card.Aspects ?? [],
          arenas: card.Arenas ?? [],
          traits: card.Traits ?? [],
          keywords: card.Keywords ?? [],
          cost: parseIntOrNull(card.Cost),
          power: parseIntOrNull(card.Power),
          hp: parseIntOrNull(card.HP),
          frontText: card.FrontText ?? null,
          backText: card.BackText ?? null,
          epicAction: card.EpicAction ?? null,
          doubleSided: card.DoubleSided,
          unique: card.Unique,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: cardDefinitions.swudbId,
          set: { updatedAt: new Date() },
        })
        .returning({ id: cardDefinitions.id });

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
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [cardPrintings.setCode, cardPrintings.collectorNumber],
          set: {
            rarity: sql`excluded.rarity`,
            variantType: sql`excluded.variant_type`,
            frontArtUrl: sql`excluded.front_art_url`,
            backArtUrl: sql`excluded.back_art_url`,
            artist: sql`excluded.artist`,
            updatedAt: new Date(),
          },
        });
    } else {
      // Found existing card_definitions — insert only card_printings
      await db
        .insert(cardPrintings)
        .values({
          cardDefinitionId: existing.id,
          setCode: card.Set,
          collectorNumber,
          rarity: card.Rarity,
          variantType: card.VariantType,
          frontArtUrl: card.FrontArt ?? null,
          backArtUrl: card.BackArt ?? null,
          artist: card.Artist ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [cardPrintings.setCode, cardPrintings.collectorNumber],
          set: {
            rarity: sql`excluded.rarity`,
            variantType: sql`excluded.variant_type`,
            frontArtUrl: sql`excluded.front_art_url`,
            backArtUrl: sql`excluded.back_art_url`,
            artist: sql`excluded.artist`,
            updatedAt: new Date(),
          },
        });
    }

    upsertCount++;
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

  // Filter out token sets (setId starts with "T", e.g., TSOR, TSHD)
  const nonTokenSets = sets.filter((s) => !s.setId.startsWith('T'));

  let totalUpserted = 0;

  for (const set of nonTokenSets) {
    const cardsResponse = await fetch(`https://api.swu-db.com/cards/${set.setId}`);
    if (!cardsResponse.ok) {
      console.error(`Failed to fetch cards for set ${set.setId}: ${cardsResponse.status}`);
      continue; // Skip this set, continue with others
    }
    const { data: cards }: { data: SWUCard[] } = await cardsResponse.json();
    const count = await upsertCards(set.setId, cards);
    totalUpserted += count;
  }

  return { setsProcessed: nonTokenSets.length, cardsUpserted: totalUpserted };
}
