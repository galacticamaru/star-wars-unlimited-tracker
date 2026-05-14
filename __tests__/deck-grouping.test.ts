// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { groupDeckCards } from '@/lib/deck-grouping';
import type { DeckCard } from '@/lib/deck-validation';

function makeCard(overrides: Partial<import('@/lib/deck-validation').Card>): import('@/lib/deck-validation').Card {
  return {
    id: 1, swudbId: 'x', name: 'Test', subtitle: null, type: 'Unit',
    aspects: [], arenas: [], traits: [], keywords: [], cost: 1,
    power: 1, hp: 1, setCode: 'SOR', collectorNumber: '1',
    frontArtUrl: null, backArtUrl: null, rarity: 'Common',
    frontText: null, backText: null, epicAction: null,
    doubleSided: false, unique: false, priceEur: null, priceUsd: null,
    ...overrides,
  };
}

describe('groupDeckCards', () => {
  it('classifies Ground unit into groundUnits', () => {
    const items: DeckCard[] = [{ card: makeCard({ type: 'Unit', arenas: ['Ground'] }), quantity: 2 }];
    const groups = groupDeckCards(items);
    expect(groups.groundUnits).toHaveLength(1);
    expect(groups.spaceUnits).toHaveLength(0);
  });

  it('classifies Space unit into spaceUnits', () => {
    const items: DeckCard[] = [{ card: makeCard({ type: 'Unit', arenas: ['Space'] }), quantity: 1 }];
    const groups = groupDeckCards(items);
    expect(groups.spaceUnits).toHaveLength(1);
    expect(groups.groundUnits).toHaveLength(0);
  });

  it('classifies Upgrade card into upgrades', () => {
    const items: DeckCard[] = [{ card: makeCard({ type: 'Upgrade', arenas: [] }), quantity: 1 }];
    const groups = groupDeckCards(items);
    expect(groups.upgrades).toHaveLength(1);
  });

  it('classifies Event card into events', () => {
    const items: DeckCard[] = [{ card: makeCard({ type: 'Event', arenas: [] }), quantity: 1 }];
    const groups = groupDeckCards(items);
    expect(groups.events).toHaveLength(1);
  });

  it('classifies unknown type into other', () => {
    const items: DeckCard[] = [{ card: makeCard({ type: 'Token', arenas: [] }), quantity: 1 }];
    const groups = groupDeckCards(items);
    expect(groups.other).toHaveLength(1);
  });

  it('returns all empty arrays for empty input', () => {
    const groups = groupDeckCards([]);
    expect(groups.groundUnits).toHaveLength(0);
    expect(groups.spaceUnits).toHaveLength(0);
    expect(groups.upgrades).toHaveLength(0);
    expect(groups.events).toHaveLength(0);
    expect(groups.other).toHaveLength(0);
  });

  it('handles card with frontArtUrl=null without throwing', () => {
    const items: DeckCard[] = [{ card: makeCard({ type: 'Unit', arenas: ['Ground'], frontArtUrl: null }), quantity: 1 }];
    expect(() => groupDeckCards(items)).not.toThrow();
    const groups = groupDeckCards(items);
    expect(groups.groundUnits).toHaveLength(1);
  });

  it('returns empty groundUnits when no Ground units in deck', () => {
    const items: DeckCard[] = [{ card: makeCard({ type: 'Unit', arenas: ['Space'] }), quantity: 2 }];
    const groups = groupDeckCards(items);
    expect(groups.groundUnits).toHaveLength(0);
  });
});
