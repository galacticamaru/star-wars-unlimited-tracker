import { db } from '@/db';
import { userCollections, userPrintingCollections, cardPrintings, cardDefinitions, userTradeOfferings } from '@/db/schema';
import { sql, eq, and, gt, inArray, asc, notIlike } from 'drizzle-orm';
import { selectBestVariantArtUrl, VARIANT_PRECEDENCE } from '@/lib/catalog/select-best-variant';

// ---------------------------------------------------------------------------
// OwnedCard — shape returned by getOwnedCardDefinitions
// ---------------------------------------------------------------------------

export interface OwnedCardPrinting {
  id: number;              // cardPrintingId
  variantType: string;
  frontArtUrl: string | null;
  ownedCount: number;
  tradeQuantity: number;
}

export interface OwnedCard {
  cardDefinitionId: number;
  name: string;
  subtitle: string | null;
  type: string;
  bestArtUrl: string | null;
  bestVariantType: string;   // variantType corresponding to bestArtUrl, for the tile badge
  printings: OwnedCardPrinting[];
}

/**
 * Returns the list of card definitions the user owns (userCollections.count > 0),
 * enriched with:
 *  - per-printing rows (ALL printings of each owned definition — for chip selector)
 *  - per-printing ownedCount (from userPrintingCollections)
 *  - per-printing tradeQuantity (from userTradeOfferings)
 *  - bestArtUrl / bestVariantType derived from highest-precedence owned variant
 *
 * Ordered by card name ASC for stable rendering.
 * Tokens are excluded (mirrors catalog.ts getAllCards filter).
 */
export async function getOwnedCardDefinitions(userId: number): Promise<OwnedCard[]> {
  // Step 1: fetch all owned card definitions (count > 0) for this user
  const ownedDefRows = await db
    .select({
      cardDefinitionId: userCollections.cardDefinitionId,
      name: cardDefinitions.name,
      subtitle: cardDefinitions.subtitle,
      type: cardDefinitions.type,
    })
    .from(userCollections)
    .innerJoin(cardDefinitions, eq(cardDefinitions.id, userCollections.cardDefinitionId))
    .where(
      and(
        eq(userCollections.userId, userId),
        gt(userCollections.count, 0),
        notIlike(cardDefinitions.type, '%token%')
      )
    )
    .orderBy(asc(cardDefinitions.name));

  if (ownedDefRows.length === 0) {
    return [];
  }

  const ownedDefIds = ownedDefRows.map(r => r.cardDefinitionId);

  // Step 2: fetch ALL printings for these card definitions (not just owned ones —
  // the chip selector should show every variant so users can want variants they don't own)
  const printingRows = await db
    .select({
      id: cardPrintings.id,
      cardDefinitionId: cardPrintings.cardDefinitionId,
      variantType: cardPrintings.variantType,
      frontArtUrl: cardPrintings.frontArtUrl,
    })
    .from(cardPrintings)
    .where(inArray(cardPrintings.cardDefinitionId, ownedDefIds));

  const printingIds = printingRows.map(p => p.id);

  // Step 3: fetch per-printing owned counts for this user
  const printingCountRows =
    printingIds.length > 0
      ? await db
          .select({
            cardPrintingId: userPrintingCollections.cardPrintingId,
            count: userPrintingCollections.count,
          })
          .from(userPrintingCollections)
          .where(
            and(
              eq(userPrintingCollections.userId, userId),
              inArray(userPrintingCollections.cardPrintingId, printingIds)
            )
          )
      : [];

  // Step 4: fetch per-printing trade quantities for this user
  const tradeOfferingRows =
    printingIds.length > 0
      ? await db
          .select({
            cardPrintingId: userTradeOfferings.cardPrintingId,
            quantity: userTradeOfferings.quantity,
          })
          .from(userTradeOfferings)
          .where(
            and(
              eq(userTradeOfferings.userId, userId),
              inArray(userTradeOfferings.cardPrintingId, printingIds)
            )
          )
      : [];

  // Step 5: build lookup maps
  const ownedCountMap = new Map<number, number>(
    printingCountRows.map(r => [r.cardPrintingId, r.count])
  );
  const tradeMap = new Map<number, number>(
    tradeOfferingRows.map(r => [r.cardPrintingId, r.quantity])
  );

  // Group printings by cardDefinitionId
  const printingsByDef = new Map<number, typeof printingRows>();
  for (const p of printingRows) {
    const existing = printingsByDef.get(p.cardDefinitionId) ?? [];
    existing.push(p);
    printingsByDef.set(p.cardDefinitionId, existing);
  }

  // Step 6: assemble OwnedCard[]
  const result: OwnedCard[] = ownedDefRows.map(def => {
    const defPrintings = printingsByDef.get(def.cardDefinitionId) ?? [];

    const enrichedPrintings: OwnedCardPrinting[] = defPrintings.map(p => ({
      id: p.id,
      variantType: p.variantType,
      frontArtUrl: p.frontArtUrl,
      ownedCount: ownedCountMap.get(p.id) ?? 0,
      tradeQuantity: tradeMap.get(p.id) ?? 0,
    }));

    // Build variants map (printingId → ownedCount) and printingArtMap for selectBestVariantArtUrl
    const variantsMap: Record<number, number> = {};
    const printingArtMap: Record<number, { variantType: string; frontArtUrl: string | null }> = {};
    for (const p of enrichedPrintings) {
      variantsMap[p.id] = p.ownedCount;
      printingArtMap[p.id] = { variantType: p.variantType, frontArtUrl: p.frontArtUrl };
    }

    const bestArtUrl = selectBestVariantArtUrl(variantsMap, printingArtMap);

    // Determine bestVariantType: find the printing whose art matches bestArtUrl and has highest precedence
    let bestVariantType = 'Normal';
    let highestPrec = 0;
    for (const p of enrichedPrintings) {
      if (p.ownedCount > 0 && p.frontArtUrl === bestArtUrl) {
        const prec = VARIANT_PRECEDENCE[p.variantType] ?? 0;
        if (prec > highestPrec) {
          highestPrec = prec;
          bestVariantType = p.variantType;
        }
      }
    }

    return {
      cardDefinitionId: def.cardDefinitionId,
      name: def.name,
      subtitle: def.subtitle,
      type: def.type,
      bestArtUrl,
      bestVariantType,
      printings: enrichedPrintings,
    };
  });

  return result;
}

export async function getUserCollection(userId: number) {
  // LEFT JOIN path: userCollections → cardPrintings → userPrintingCollections
  // Gives one row per printing variant for each owned card definition.
  // Cards with no per-variant rows: cardPrintingId=null, variantCount=null (handled by buildCollectionMap).
  return db
    .select({
      cardDefinitionId: userCollections.cardDefinitionId,
      total: userCollections.count,
      cardPrintingId: userPrintingCollections.cardPrintingId,
      variantCount: userPrintingCollections.count,
    })
    .from(userCollections)
    .leftJoin(
      cardPrintings,
      eq(cardPrintings.cardDefinitionId, userCollections.cardDefinitionId)
    )
    .leftJoin(
      userPrintingCollections,
      and(
        eq(userPrintingCollections.cardPrintingId, cardPrintings.id),
        eq(userPrintingCollections.userId, userId)
      )
    )
    .where(eq(userCollections.userId, userId));
}

export async function upsertCardCount(cardDefinitionId: number, count: number, userId: number) {
  return db
    .insert(userCollections)
    .values({
      userId,
      cardDefinitionId,
      count,
    })
    .onConflictDoUpdate({
      target: [userCollections.userId, userCollections.cardDefinitionId],
      set: {
        count,
        updatedAt: new Date(),
      },
    })
    .returning();
}

export async function upsertVariantCount(cardPrintingId: number, count: number, userId: number) {
  return db
    .insert(userPrintingCollections)
    .values({ userId, cardPrintingId, count })
    .onConflictDoUpdate({
      target: [userPrintingCollections.userId, userPrintingCollections.cardPrintingId],
      set: { count, updatedAt: new Date() },
    })
    .returning();
}

/**
 * Safely increments an existing variant count by qtyToAdd without overwriting.
 * Uses SQL addition on conflict to avoid the upsertVariantCount overwrite pitfall.
 * Neon HTTP driver does not support transactions — caller must invoke recomputeTotal afterward.
 */
export async function incrementVariantCount(
  cardPrintingId: number,
  qtyToAdd: number,
  userId: number
) {
  return db
    .insert(userPrintingCollections)
    .values({ userId, cardPrintingId, count: qtyToAdd })
    .onConflictDoUpdate({
      target: [userPrintingCollections.userId, userPrintingCollections.cardPrintingId],
      set: {
        count: sql`${userPrintingCollections.count} + ${qtyToAdd}`,
        updatedAt: new Date(),
      },
    })
    .returning();
}

/**
 * After a variant upsert, recompute and persist the total count for a card definition.
 * Must be called after every upsertVariantCount.
 * Note: Neon HTTP driver does not support transactions — these are two sequential awaits.
 */
export async function recomputeTotal(userId: number, cardDefinitionId: number) {
  // SUM all variant counts for this user+cardDefinitionId via cardPrintings join
  const [{ total }] = await db
    .select({ total: sql<number>`COALESCE(SUM(${userPrintingCollections.count}), 0)` })
    .from(userPrintingCollections)
    .innerJoin(cardPrintings, eq(cardPrintings.id, userPrintingCollections.cardPrintingId))
    .where(
      and(
        eq(userPrintingCollections.userId, userId),
        eq(cardPrintings.cardDefinitionId, cardDefinitionId)
      )
    );

  // Upsert total into userCollections (same onConflictDoUpdate pattern as upsertCardCount)
  await db
    .insert(userCollections)
    .values({ userId, cardDefinitionId, count: Number(total) })
    .onConflictDoUpdate({
      target: [userCollections.userId, userCollections.cardDefinitionId],
      set: { count: Number(total), updatedAt: new Date() },
    });
}
