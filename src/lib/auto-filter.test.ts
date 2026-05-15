// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { computeAutoFilter, computeAutoFilterLabel, type AutoFilter } from './auto-filter';
import type { Card } from './deck-validation';

const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: Math.floor(Math.random() * 1000),
  swudbId: 'TEST-001',
  name: 'Test Card',
  subtitle: null,
  type: 'Unit',
  aspects: [],
  arenas: ['Ground'],
  traits: [],
  keywords: [],
  cost: 1,
  power: 1,
  hp: 1,
  setCode: 'SOR',
  collectorNumber: '001',
  rarity: 'Common',
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

describe('computeAutoFilter', () => {
  it('returns Leader+Base types filter when both leader and base are null', () => {
    expect(computeAutoFilter(null, null)).toEqual({ types: ['Leader', 'Base'] });
  });

  it('returns Leader+Base types filter when only leader is set (leader-only state, D-01)', () => {
    const leader = createCard({ type: 'Leader', aspects: ['Command'] });
    expect(computeAutoFilter(leader, null)).toEqual({ types: ['Leader', 'Base'] });
  });

  it('returns Leader+Base types filter when only base is set (symmetric to leader-only)', () => {
    const base = createCard({ type: 'Base', aspects: ['Command'] });
    expect(computeAutoFilter(null, base)).toEqual({ types: ['Leader', 'Base'] });
  });

  it('returns aspects union (deduplicated) when both leader and base are set', () => {
    const leader = createCard({ type: 'Leader', aspects: ['Command'] });
    const base = createCard({ type: 'Base', aspects: ['Vigilance'] });
    const result = computeAutoFilter(leader, base);
    expect(result).not.toBeNull();
    expect(result!.aspects).toHaveLength(2);
    expect(result!.aspects).toEqual(expect.arrayContaining(['Command', 'Vigilance']));
    expect(result!.types).toBeUndefined();
  });

  it('deduplicates overlapping aspects between leader and base', () => {
    const leader = createCard({ type: 'Leader', aspects: ['Command'] });
    const base = createCard({ type: 'Base', aspects: ['Command'] });
    const result = computeAutoFilter(leader, base);
    expect(result!.aspects).toEqual(['Command']);
  });

  it('excludes "Basic" from the aspect union (D-08)', () => {
    const leader = createCard({ type: 'Leader', aspects: ['Command', 'Basic'] });
    const base = createCard({ type: 'Base', aspects: ['Basic'] });
    const result = computeAutoFilter(leader, base);
    expect(result!.aspects).toEqual(['Command']);
    expect(result!.aspects).not.toContain('Basic');
  });

  it('returns aspects=[] (empty array, not null) when leader and base only have Basic', () => {
    const leader = createCard({ type: 'Leader', aspects: ['Basic'] });
    const base = createCard({ type: 'Base', aspects: ['Basic'] });
    const result = computeAutoFilter(leader, base);
    expect(result).toEqual({ aspects: [] });
  });
});

describe('computeAutoFilterLabel', () => {
  it('returns null when isOverridden is true (even with a valid autoFilter)', () => {
    const autoFilter: AutoFilter = { types: ['Leader', 'Base'] };
    expect(computeAutoFilterLabel(autoFilter, true)).toBeNull();
  });

  it('returns null when autoFilter is null', () => {
    expect(computeAutoFilterLabel(null, false)).toBeNull();
  });

  it('returns "Auto: Leader & Base" (D-09 exact copy, ampersand) for a types filter', () => {
    const autoFilter: AutoFilter = { types: ['Leader', 'Base'] };
    expect(computeAutoFilterLabel(autoFilter, false)).toBe('Auto: Leader & Base');
  });

  it('returns "Auto: Aspect filter" (D-09 exact copy, lowercase filter) for an aspects filter', () => {
    const autoFilter: AutoFilter = { aspects: ['Command'] };
    expect(computeAutoFilterLabel(autoFilter, false)).toBe('Auto: Aspect filter');
  });

  it('returns "Auto: Aspect filter" even when aspects array is empty', () => {
    const autoFilter: AutoFilter = { aspects: [] };
    expect(computeAutoFilterLabel(autoFilter, false)).toBe('Auto: Aspect filter');
  });
});
