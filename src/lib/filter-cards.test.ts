// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { filterCards, type CardForFilter, type FilterState } from './filter-cards';

const makeCard = (overrides: Partial<CardForFilter> = {}): CardForFilter => ({
  id: 1,
  name: 'Luke Skywalker',
  type: 'Unit',
  aspects: ['Heroism'],
  setCode: 'SOR',
  collectorNumber: 'SOR-001',
  frontArtUrl: 'https://cdn.swu-db.com/images/cards/SOR/001.webp',
  ...overrides,
});

const emptyFilters: FilterState = {
  search: '',
  selectedSets: [],
  selectedTypes: [],
  selectedAspects: [],
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

  it('filters by aspect (OR within category — card.aspects.some())', () => {
    const cards = [
      makeCard({ aspects: ['Heroism'] }),
      makeCard({ id: 2, aspects: ['Villainy'] }),
      makeCard({ id: 3, aspects: ['Command'] }),
    ];
    const result = filterCards(cards, { ...emptyFilters, selectedAspects: ['Heroism', 'Villainy'] });
    expect(result).toHaveLength(2);
    expect(result.map(c => c.id)).not.toContain(3);
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
});
