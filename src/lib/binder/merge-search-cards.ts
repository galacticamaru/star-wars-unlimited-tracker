/**
 * Pure data transforms powering the unified search-driven add flow (Phase 30, BINDER-10/11/12).
 *
 * No React, no fetch, no DOM — merges the full catalog with per-user ownership/trade/want data
 * into one MergedCard per card definition, and filters those merged cards by search term.
 */
import type { OwnedCard } from '@/db/queries/collection';
import { VARIANT_PRECEDENCE } from '@/lib/catalog/select-best-variant';

/** Row shape returned by GET /api/cards/all (see src/app/api/cards/all/route.ts). */
export interface CatalogRow {
  id: number; // cardDefinitionId
  name: string;
  subtitle: string | null;
  frontArtUrl: string | null;
  type: string;
  variantType: string;
  printingId: number;
}

/** Minimal manual-want shape consumed from TradeData.manualWants (manage/page.tsx). */
export interface ManualWantLike {
  cardPrintingId: number;
  quantity: number;
}

export interface MergedCardPrinting {
  id: number; // cardPrintingId
  variantType: string;
  frontArtUrl: string | null;
  ownedCount: number;
  tradeQuantity: number;
  quantity: number; // manual want quantity
}

export interface MergedCard {
  cardDefinitionId: number;
  name: string;
  subtitle: string | null;
  type: string;
  bestArtUrl: string | null;
  bestVariantType: string;
  printings: MergedCardPrinting[];
}

/**
 * Merges full-catalog rows with the user's owned/trade/want data into one MergedCard
 * per card definition. Cards the user does not own at all still produce a MergedCard
 * (drawn purely from the catalog rows), so unowned cards remain searchable (D-01/D-03).
 */
export function mergeCatalogWithOwnership(
  catalogRows: CatalogRow[],
  ownedCards: OwnedCard[],
  manualWants: ManualWantLike[]
): MergedCard[] {
  const ownedByDefId = new Map<number, OwnedCard>(
    ownedCards.map(c => [c.cardDefinitionId, c])
  );
  const wantQtyByPrintingId = new Map<number, number>(
    manualWants.map(w => [w.cardPrintingId, w.quantity])
  );

  // Group catalog rows by cardDefinitionId, preserving first-seen order.
  const rowsByDefId = new Map<number, CatalogRow[]>();
  const defOrder: number[] = [];
  for (const row of catalogRows) {
    if (!rowsByDefId.has(row.id)) {
      rowsByDefId.set(row.id, []);
      defOrder.push(row.id);
    }
    rowsByDefId.get(row.id)!.push(row);
  }

  return defOrder.map(defId => {
    const rows = rowsByDefId.get(defId)!;
    const firstRow = rows[0];
    const owned = ownedByDefId.get(defId);
    const ownedPrintingById = new Map(
      (owned?.printings ?? []).map(p => [p.id, p])
    );

    const printings: MergedCardPrinting[] = rows.map(row => {
      const ownedPrinting = ownedPrintingById.get(row.printingId);
      return {
        id: row.printingId,
        variantType: row.variantType,
        frontArtUrl: row.frontArtUrl,
        ownedCount: ownedPrinting?.ownedCount ?? 0,
        tradeQuantity: ownedPrinting?.tradeQuantity ?? 0,
        quantity: wantQtyByPrintingId.get(row.printingId) ?? 0,
      };
    });

    let bestArtUrl: string | null;
    let bestVariantType: string;
    if (owned) {
      bestArtUrl = owned.bestArtUrl;
      bestVariantType = owned.bestVariantType;
    } else {
      // No owned data for this definition — derive the "best" (highest-precedence)
      // variant purely from the catalog rows themselves.
      let highestPrec = -1;
      bestArtUrl = firstRow.frontArtUrl;
      bestVariantType = firstRow.variantType;
      for (const row of rows) {
        const prec = VARIANT_PRECEDENCE[row.variantType] ?? 0;
        if (prec > highestPrec) {
          highestPrec = prec;
          bestArtUrl = row.frontArtUrl;
          bestVariantType = row.variantType;
        }
      }
    }

    return {
      cardDefinitionId: defId,
      name: owned?.name ?? firstRow.name,
      subtitle: owned?.subtitle ?? firstRow.subtitle,
      type: owned?.type ?? firstRow.type,
      bestArtUrl,
      bestVariantType,
      printings,
    };
  });
}

export interface FilterSearchCardsResult {
  results: MergedCard[];
  wasTruncated: boolean;
}

/**
 * Filters merged cards by search term (D-02): a 2-character minimum gate (trimmed),
 * case-insensitive match on name OR subtitle, capped at `cap` results with a
 * `wasTruncated` flag set only when the underlying match count exceeds the cap.
 */
export function filterSearchCards(
  cards: MergedCard[],
  term: string,
  cap = 20
): FilterSearchCardsResult {
  const trimmed = term.trim();
  if (trimmed.length < 2) {
    return { results: [], wasTruncated: false };
  }

  const q = trimmed.toLowerCase();
  const matches = cards.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      (c.subtitle?.toLowerCase().includes(q) ?? false)
  );

  return {
    results: matches.slice(0, cap),
    wasTruncated: matches.length > cap,
  };
}
