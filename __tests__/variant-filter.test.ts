// @vitest-environment node
/**
 * Contract test: confirms that the Phase 19 variant strings ('Foil', 'Hyperspace Foil')
 * are correctly handled when passed as selectedVariants to filterCards.
 * This acts as an integration guard between VARIANT_OPTIONS in variant-filter.tsx
 * and the filter engine in filter-cards.ts.
 */
import { describe, it, expect } from 'vitest';
import { filterCards, type CardForFilter, type FilterState } from '@/lib/filter-cards';

const makeCard = (overrides: Partial<CardForFilter> = {}): CardForFilter => ({
  id: 1,
  swudbId: 'SOR-001',
  name: 'Luke Skywalker',
  subtitle: null,
  type: 'Unit',
  aspects: ['Heroism'],
  arenas: ['Ground'],
  traits: ['REBEL'],
  keywords: [],
  cost: 3,
  power: null,
  hp: null,
  rarity: 'Common',
  setCode: 'SOR',
  collectorNumber: 'SOR-001',
  frontArtUrl: null,
  backArtUrl: null,
  frontText: null,
  backText: null,
  epicAction: null,
  doubleSided: false,
  unique: false,
  priceEur: null,
  priceUsd: null,
  ...overrides,
});

const baseFilters: FilterState = {
  search: '',
  selectedSets: [],
  selectedTypes: [],
  selectedAspects: [],
  selectedArenas: [],
  selectedTraits: [],
  selectedRarities: [],
  selectedKeywords: [],
  selectedCosts: [],
};

/**
 * Phase 19 added 'Foil' and 'Hyperspace Foil' to VARIANT_OPTIONS.
 * These tests confirm filterCards accepts these exact strings and
 * correctly matches / rejects cards by variantType.
 */
describe('Phase 19 variant contract — Foil and Hyperspace Foil strings', () => {
  it('"Foil" from VARIANT_OPTIONS correctly selects cards with variantType "Foil"', () => {
    const cards = [
      makeCard({ id: 1, variantType: 'Foil' }),
      makeCard({ id: 2, variantType: 'Normal' }),
      makeCard({ id: 3, variantType: 'Hyperspace Foil' }),
    ];
    const result = filterCards(cards, { ...baseFilters, selectedVariants: ['Foil'] });
    expect(result).toHaveLength(1);
    expect(result[0].variantType).toBe('Foil');
  });

  it('"Hyperspace Foil" from VARIANT_OPTIONS correctly selects cards with variantType "Hyperspace Foil"', () => {
    const cards = [
      makeCard({ id: 1, variantType: 'Foil' }),
      makeCard({ id: 2, variantType: 'Hyperspace Foil' }),
      makeCard({ id: 3, variantType: 'Normal' }),
    ];
    const result = filterCards(cards, { ...baseFilters, selectedVariants: ['Hyperspace Foil'] });
    expect(result).toHaveLength(1);
    expect(result[0].variantType).toBe('Hyperspace Foil');
  });

  it('selecting both "Foil" and "Hyperspace Foil" returns exactly those two variant types (OR logic)', () => {
    const cards = [
      makeCard({ id: 1, variantType: 'Normal' }),
      makeCard({ id: 2, variantType: 'Foil' }),
      makeCard({ id: 3, variantType: 'Hyperspace Foil' }),
      makeCard({ id: 4, variantType: 'Showcase' }),
      makeCard({ id: 5, variantType: 'Prestige' }),
      makeCard({ id: 6, variantType: 'Serialized' }),
    ];
    const result = filterCards(cards, {
      ...baseFilters,
      selectedVariants: ['Foil', 'Hyperspace Foil'],
    });
    expect(result).toHaveLength(2);
    const variantTypes = result.map(c => c.variantType);
    expect(variantTypes).toContain('Foil');
    expect(variantTypes).toContain('Hyperspace Foil');
  });

  it('no selectedVariants (All) returns cards of every VARIANT_OPTIONS type without exclusion', () => {
    // Simulates user selecting "All" in VariantFilter, which sets selectedVariants to []
    const phaseNineVariants = ['Normal', 'Foil', 'Hyperspace', 'Hyperspace Foil', 'Showcase', 'Prestige', 'Serialized'];
    const cards = phaseNineVariants.map((v, i) => makeCard({ id: i + 1, variantType: v }));
    const result = filterCards(cards, { ...baseFilters, selectedVariants: [] });
    expect(result).toHaveLength(phaseNineVariants.length);
  });
});
