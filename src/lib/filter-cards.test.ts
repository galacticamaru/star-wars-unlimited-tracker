// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { filterCards, type CardForFilter, type FilterState } from './filter-cards';

const makeCard = (overrides: Partial<CardForFilter> = {}): CardForFilter => {
  const defaults: CardForFilter = {
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
    frontArtUrl: 'https://cdn.swu.db.com/images/cards/SOR/001.webp',
    backArtUrl: null,
    frontText: null,
    backText: null,
    epicAction: null,
    doubleSided: false,
    unique: false,
    priceEur: null,
    priceUsd: null,
  };
  return { ...defaults, ...overrides };
};

const emptyFilters: FilterState = {
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

describe('filterCards', () => {
  it('returns empty array when cards is empty', () => {
    expect(filterCards([], emptyFilters)).toEqual([]);
  });

  it('returns all cards when all filters are empty', () => {
    const cards = [makeCard(), makeCard({ id: 2, name: 'Vader' })];
    expect(filterCards(cards, emptyFilters)).toHaveLength(2);
  });

  it('filters by name substring (case-insensitive)', () => {
    const cards = [makeCard({ name: 'Luke Skywalker' }), makeCard({ id: 2, name: 'Darth Vader' })];
    expect(filterCards(cards, { ...emptyFilters, search: 'luke' })).toHaveLength(1);
    expect(filterCards(cards, { ...emptyFilters, search: 'VADER' })).toHaveLength(1);
    expect(filterCards(cards, { ...emptyFilters, search: 'zzz' })).toHaveLength(0);
  });

  it('filters by set (exact match, OR within category)', () => {
    const cards = [
      makeCard({ setCode: 'SOR' }),
      makeCard({ id: 2, setCode: 'TWI', collectorNumber: 'TWI-001' }),
    ];
    expect(filterCards(cards, { ...emptyFilters, selectedSets: ['SOR'] })).toHaveLength(1);
    expect(filterCards(cards, { ...emptyFilters, selectedSets: ['SOR', 'TWI'] })).toHaveLength(2);
  });

  it('filters by type (exact match)', () => {
    const cards = [makeCard({ type: 'Unit' }), makeCard({ id: 2, type: 'Event' })];
    expect(filterCards(cards, { ...emptyFilters, selectedTypes: ['Unit'] })).toHaveLength(1);
    expect(filterCards(cards, { ...emptyFilters, selectedTypes: ['Event'] })).toHaveLength(1);
  });

  it('filters by aspect (subset match — all card aspects must be within selection)', () => {
    const cards = [
      makeCard({ aspects: ['Heroism'] }),
      makeCard({ id: 2, aspects: ['Villainy'] }),
      makeCard({ id: 3, aspects: ['Command'] }),
      makeCard({ id: 4, aspects: ['Heroism', 'Villainy'] }),
      makeCard({ id: 5, aspects: ['Command', 'Heroism'] }), // has out-of-selection aspect
    ];
    const result = filterCards(cards, { ...emptyFilters, selectedAspects: ['Heroism', 'Villainy'] });
    expect(result).toHaveLength(3); // Heroism, Villainy, Heroism+Villainy
    expect(result.map(c => c.id)).not.toContain(3); // Command-only hidden
    expect(result.map(c => c.id)).not.toContain(5); // Command+Heroism hidden
  });

  it('filters by arena (OR match)', () => {
    const cards = [
      makeCard({ arenas: ['Ground'] }),
      makeCard({ id: 2, arenas: ['Space'] }),
    ];
    expect(filterCards(cards, { ...emptyFilters, selectedArenas: ['Ground'] })).toHaveLength(1);
    expect(filterCards(cards, { ...emptyFilters, selectedArenas: ['Ground', 'Space'] })).toHaveLength(2);
  });

  it('filters by trait (OR match)', () => {
    const cards = [
      makeCard({ traits: ['REBEL'] }),
      makeCard({ id: 2, traits: ['IMPERIAL'] }),
      makeCard({ id: 3, traits: ['REBEL', 'TROOPER'] }),
    ];
    const result = filterCards(cards, { ...emptyFilters, selectedTraits: ['REBEL'] });
    expect(result).toHaveLength(2);
    expect(result.map(c => c.id)).toContain(1);
    expect(result.map(c => c.id)).toContain(3);
  });

  it('filters by rarity (handles simple and UI-prefixed values)', () => {
    const cards = [
      makeCard({ rarity: 'Common' }),
      makeCard({ id: 2, rarity: 'Uncommon' }),
      makeCard({ id: 3, rarity: 'Rare' }),
    ];
    
    // Simple match
    expect(filterCards(cards, { ...emptyFilters, selectedRarities: ['Common'] })).toHaveLength(1);
    
    // UI-prefixed match (D-05: '(C) Common' -> 'Common')
    expect(filterCards(cards, { ...emptyFilters, selectedRarities: ['(C) Common'] })).toHaveLength(1);
    expect(filterCards(cards, { ...emptyFilters, selectedRarities: ['(C) Common'] })[0].rarity).toBe('Common');
    
    // Multiple selection (OR)
    expect(filterCards(cards, { ...emptyFilters, selectedRarities: ['Common', 'Rare'] })).toHaveLength(2);
    expect(filterCards(cards, { ...emptyFilters, selectedRarities: ['(C) Common', '(R) Rare'] })).toHaveLength(2);
  });

  it('filters by cost (with 9+ handling)', () => {
    const cards = [
      makeCard({ cost: 3 }),
      makeCard({ id: 2, cost: 9 }),
      makeCard({ id: 3, cost: 10 }),
      makeCard({ id: 4, cost: null }), // Base
    ];
    expect(filterCards(cards, { ...emptyFilters, selectedCosts: ['3'] })).toHaveLength(1);
    expect(filterCards(cards, { ...emptyFilters, selectedCosts: ['9+'] })).toHaveLength(2); // 9 and 10
    expect(filterCards(cards, { ...emptyFilters, selectedCosts: ['3', '9+'] })).toHaveLength(3);
  });

  it('applies AND logic across categories', () => {
    const cards = [
      makeCard({ type: 'Unit', setCode: 'SOR' }),
      makeCard({ id: 2, type: 'Event', setCode: 'SOR' }),
      makeCard({ id: 3, type: 'Unit', setCode: 'TWI', collectorNumber: 'TWI-001' }),
    ];
    const result = filterCards(cards, {
      ...emptyFilters,
      selectedSets: ['SOR'],
      selectedTypes: ['Unit'],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  describe('ownedOnly filter', () => {
    const cardA = makeCard({ id: 1 });
    const cardB = makeCard({ id: 2, name: 'Vader' });

    it('ownedOnly=false returns all cards regardless of collection', () => {
      const collection = {};
      expect(
        filterCards([cardA, cardB], { ...emptyFilters, ownedOnly: false }, collection)
      ).toHaveLength(2);
    });

    it('ownedOnly=true returns only cards with collection[id] >= 1', () => {
      const collection = { 1: 2 };
      const result = filterCards([cardA, cardB], { ...emptyFilters, ownedOnly: true }, collection);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('ownedOnly=true with empty collection returns 0 cards', () => {
      const collection = {};
      expect(
        filterCards([cardA, cardB], { ...emptyFilters, ownedOnly: true }, collection)
      ).toHaveLength(0);
    });

    it('ownedOnly=true ANDs correctly with other active filters', () => {
      const cardC = makeCard({ id: 3, name: 'Luke', type: 'Unit' });
      const cardD = makeCard({ id: 4, name: 'Vader', type: 'Unit' });
      const collection = { 3: 1 };
      const result = filterCards(
        [cardC, cardD],
        { ...emptyFilters, selectedTypes: ['Unit'], ownedOnly: true },
        collection
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });
  });
});
