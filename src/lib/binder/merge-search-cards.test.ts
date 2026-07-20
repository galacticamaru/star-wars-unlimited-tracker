// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  mergeCatalogWithOwnership,
  filterSearchCards,
  type CatalogRow,
  type MergedCard,
} from './merge-search-cards';
import type { OwnedCard } from '@/db/queries/collection';

const makeCatalogRow = (overrides: Partial<CatalogRow> = {}): CatalogRow => ({
  id: 1,
  name: 'Luke Skywalker',
  subtitle: 'Faithful Friend',
  frontArtUrl: 'https://cdn.example.com/luke-normal.webp',
  type: 'Unit',
  variantType: 'Normal',
  printingId: 101,
  ...overrides,
});

const makeOwnedCard = (overrides: Partial<OwnedCard> = {}): OwnedCard => ({
  cardDefinitionId: 1,
  name: 'Luke Skywalker',
  subtitle: 'Faithful Friend',
  type: 'Unit',
  bestArtUrl: 'https://cdn.example.com/luke-foil.webp',
  bestVariantType: 'Foil',
  printings: [
    { id: 101, variantType: 'Normal', frontArtUrl: 'https://cdn.example.com/luke-normal.webp', ownedCount: 2, tradeQuantity: 1 },
  ],
  ...overrides,
});

describe('mergeCatalogWithOwnership', () => {
  it('groups catalog rows by cardDefinitionId into one MergedCard per definition, each with a printings array (one per catalog printingId)', () => {
    const catalogRows: CatalogRow[] = [
      makeCatalogRow({ id: 1, printingId: 101, variantType: 'Normal' }),
      makeCatalogRow({ id: 1, printingId: 102, variantType: 'Foil' }),
      makeCatalogRow({ id: 2, printingId: 201, name: 'Darth Vader', subtitle: null }),
    ];
    const result = mergeCatalogWithOwnership(catalogRows, [], []);
    expect(result).toHaveLength(2);
    const luke = result.find(c => c.cardDefinitionId === 1);
    expect(luke?.printings).toHaveLength(2);
    expect(luke?.printings.map(p => p.id).sort()).toEqual([101, 102]);
    const vader = result.find(c => c.cardDefinitionId === 2);
    expect(vader?.printings).toHaveLength(1);
    expect(vader?.printings[0].id).toBe(201);
  });

  it('a printing the user owns gets its ownedCount and tradeQuantity from ownedCards; an unowned printing defaults both to 0', () => {
    const catalogRows: CatalogRow[] = [
      makeCatalogRow({ id: 1, printingId: 101, variantType: 'Normal' }),
      makeCatalogRow({ id: 1, printingId: 102, variantType: 'Foil' }),
    ];
    const ownedCards: OwnedCard[] = [
      makeOwnedCard({
        printings: [
          { id: 101, variantType: 'Normal', frontArtUrl: null, ownedCount: 3, tradeQuantity: 2 },
        ],
      }),
    ];
    const result = mergeCatalogWithOwnership(catalogRows, ownedCards, []);
    const luke = result.find(c => c.cardDefinitionId === 1)!;
    const owned = luke.printings.find(p => p.id === 101)!;
    const unowned = luke.printings.find(p => p.id === 102)!;
    expect(owned.ownedCount).toBe(3);
    expect(owned.tradeQuantity).toBe(2);
    expect(unowned.ownedCount).toBe(0);
    expect(unowned.tradeQuantity).toBe(0);
  });

  it('a printing present in manualWants gets that want quantity; absent defaults to 0', () => {
    const catalogRows: CatalogRow[] = [
      makeCatalogRow({ id: 1, printingId: 101, variantType: 'Normal' }),
      makeCatalogRow({ id: 1, printingId: 102, variantType: 'Foil' }),
    ];
    const manualWants = [
      { cardPrintingId: 101, variantType: 'Normal', quantity: 4, name: 'Luke Skywalker', subtitle: 'Faithful Friend' },
    ];
    const result = mergeCatalogWithOwnership(catalogRows, [], manualWants);
    const luke = result.find(c => c.cardDefinitionId === 1)!;
    const wanted = luke.printings.find(p => p.id === 101)!;
    const notWanted = luke.printings.find(p => p.id === 102)!;
    expect(wanted.quantity).toBe(4);
    expect(notWanted.quantity).toBe(0);
  });

  it('MergedCard carries name/subtitle/type, and a bestArtUrl/bestVariantType from the owned card when available', () => {
    const catalogRows: CatalogRow[] = [
      makeCatalogRow({ id: 1, printingId: 101, variantType: 'Normal', frontArtUrl: 'https://cdn.example.com/luke-normal.webp' }),
    ];
    const ownedCards: OwnedCard[] = [makeOwnedCard()];
    const result = mergeCatalogWithOwnership(catalogRows, ownedCards, []);
    const luke = result.find(c => c.cardDefinitionId === 1)!;
    expect(luke.name).toBe('Luke Skywalker');
    expect(luke.subtitle).toBe('Faithful Friend');
    expect(luke.type).toBe('Unit');
    expect(luke.bestArtUrl).toBe('https://cdn.example.com/luke-foil.webp');
    expect(luke.bestVariantType).toBe('Foil');
  });

  it('a definition the user does not own at all still produces a MergedCard, with bestArtUrl/bestVariantType derived from the definition catalog rows', () => {
    const catalogRows: CatalogRow[] = [
      makeCatalogRow({ id: 2, printingId: 201, name: 'Darth Vader', subtitle: null, variantType: 'Normal', frontArtUrl: 'https://cdn.example.com/vader-normal.webp' }),
      makeCatalogRow({ id: 2, printingId: 202, name: 'Darth Vader', subtitle: null, variantType: 'Showcase', frontArtUrl: 'https://cdn.example.com/vader-showcase.webp' }),
    ];
    const result = mergeCatalogWithOwnership(catalogRows, [], []);
    const vader = result.find(c => c.cardDefinitionId === 2)!;
    expect(vader).toBeDefined();
    expect(vader.name).toBe('Darth Vader');
    // Highest-precedence catalog variant (Showcase > Normal) wins when nothing is owned
    expect(vader.bestVariantType).toBe('Showcase');
    expect(vader.bestArtUrl).toBe('https://cdn.example.com/vader-showcase.webp');
    // No owned/wanted data — everything defaults to 0
    expect(vader.printings.every(p => p.ownedCount === 0 && p.tradeQuantity === 0 && p.quantity === 0)).toBe(true);
  });
});

describe('filterSearchCards', () => {
  const cards: MergedCard[] = [
    { cardDefinitionId: 1, name: 'Luke Skywalker', subtitle: 'Faithful Friend', type: 'Unit', bestArtUrl: null, bestVariantType: 'Normal', printings: [] },
    { cardDefinitionId: 2, name: 'Darth Vader', subtitle: 'Dark Lord of the Sith', type: 'Unit', bestArtUrl: null, bestVariantType: 'Normal', printings: [] },
  ];

  it('returns { results: [], wasTruncated: false } when term is shorter than 2 chars (after trim)', () => {
    expect(filterSearchCards(cards, '')).toEqual({ results: [], wasTruncated: false });
    expect(filterSearchCards(cards, 'l')).toEqual({ results: [], wasTruncated: false });
    expect(filterSearchCards(cards, '  a ')).toEqual({ results: [], wasTruncated: false });
  });

  it('matches on name OR subtitle, case-insensitive', () => {
    expect(filterSearchCards(cards, 'LUKE').results.map(c => c.cardDefinitionId)).toEqual([1]);
    expect(filterSearchCards(cards, 'sith').results.map(c => c.cardDefinitionId)).toEqual([2]);
    expect(filterSearchCards(cards, 'zzz').results).toEqual([]);
  });

  it('caps results at `cap`; wasTruncated is true only when match count exceeds cap', () => {
    const manyCards: MergedCard[] = Array.from({ length: 25 }, (_, i) => ({
      cardDefinitionId: i,
      name: `Trooper ${i}`,
      subtitle: null,
      type: 'Unit',
      bestArtUrl: null,
      bestVariantType: 'Normal',
      printings: [],
    }));
    const capped = filterSearchCards(manyCards, 'trooper', 20);
    expect(capped.results).toHaveLength(20);
    expect(capped.wasTruncated).toBe(true);

    const exact = filterSearchCards(manyCards.slice(0, 20), 'trooper', 20);
    expect(exact.results).toHaveLength(20);
    expect(exact.wasTruncated).toBe(false);

    const under = filterSearchCards(manyCards.slice(0, 5), 'trooper', 20);
    expect(under.results).toHaveLength(5);
    expect(under.wasTruncated).toBe(false);
  });
});
