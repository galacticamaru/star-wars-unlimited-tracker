import { describe, it, expect } from 'vitest';
import { validateDeck, Card, DeckCard } from './deck-validation';

// Helper to create a mock card
const createCard = (overrides: Partial<Card>): Card => ({
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

const mockLeader = createCard({ type: 'Leader', aspects: ['Command', 'Vigilance'], swudbId: 'L-1' });
const mockBase = createCard({ type: 'Base', aspects: ['Command'], swudbId: 'B-1' });

describe('validateDeck', () => {
  it('should return errors for an empty deck', () => {
    const result = validateDeck(null, null, [], []);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Leader is required');
    expect(result.errors).toContain('Base is required');
    expect(result.errors).toContain('Main deck must have at least 50 cards');
  });

  it('should be valid for a legal Premier deck', () => {
    const mainDeck: DeckCard[] = [];
    for (let i = 0; i < 17; i++) {
      mainDeck.push({
        card: createCard({ swudbId: `C-${i}`, cost: i % 5 }),
        quantity: 3,
      });
    }
    // 17 * 3 = 51 cards
    
    const result = validateDeck(mockLeader, mockBase, mainDeck, []);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return error if a card has more than 3 copies across main and side', () => {
    const sameCard = createCard({ swudbId: 'SAME' });
    const mainDeck = [{ card: sameCard, quantity: 3 }];
    const sideboard = [{ card: sameCard, quantity: 1 }];
    
    const result = validateDeck(mockLeader, mockBase, mainDeck, sideboard);
    expect(result.errors).toContain('Exceeded 3 copies of Test Card');
  });

  it('should allow up to 15 copies of Swarming Vulture Droid (JTL-256)', () => {
    const vultureDroid = createCard({
      name: 'Swarming Vulture Droid',
      setCode: 'JTL',
      collectorNumber: 'JTL-256',
      swudbId: 'JTL-256'
    });
    const mainDeck = [{ card: vultureDroid, quantity: 15 }];
    
    // We need 50 cards total for validity, but we only care about the copies error here
    const result = validateDeck(mockLeader, mockBase, mainDeck, []);
    
    const copiesError = result.errors.find(e => e.includes('Exceeded'));
    expect(copiesError).toBeUndefined();
  });

  it('should return error if Swarming Vulture Droid (JTL-256) has more than 15 copies', () => {
    const vultureDroid = createCard({
      name: 'Swarming Vulture Droid',
      setCode: 'JTL',
      collectorNumber: 'JTL-256',
      swudbId: 'JTL-256'
    });
    const mainDeck = [{ card: vultureDroid, quantity: 16 }];
    
    const result = validateDeck(mockLeader, mockBase, mainDeck, []);
    
    expect(result.errors).toContain('Exceeded 15 copies of Swarming Vulture Droid');
  });

  it('should return warnings for off-aspect cards', () => {
    const leader = createCard({ type: 'Leader', aspects: ['Vigilance'] });
    const base = createCard({ type: 'Base', aspects: ['Vigilance'] });
    const offAspectCard = createCard({ name: 'Off Aspect', aspects: ['Command'] });
    
    const result = validateDeck(leader, base, [{ card: offAspectCard, quantity: 1 }], []);
    expect(result.warnings).toContain('Off Aspect is off-aspect (requires Command)');
  });

  it('should correctly calculate statistics', () => {
    const card1 = createCard({ type: 'Unit', cost: 1, arenas: ['Ground'], aspects: ['Command'] });
    const card2 = createCard({ type: 'Event', cost: 2, arenas: [], aspects: ['Vigilance'] });
    
    const mainDeck = [
      { card: card1, quantity: 2 },
      { card: card2, quantity: 3 },
    ];
    
    const result = validateDeck(mockLeader, mockBase, mainDeck, []);
    
    expect(result.stats.costCurve[1]).toBe(2);
    expect(result.stats.costCurve[2]).toBe(3);
    expect(result.stats.typeCounts['Unit']).toBe(2);
    expect(result.stats.typeCounts['Event']).toBe(3);
    expect(result.stats.arenaCounts['Ground']).toBe(2);
    expect(result.stats.aspectCounts['Command']).toBe(2);
    expect(result.stats.aspectCounts['Vigilance']).toBe(3);
  });

  it('should handle double-aspect cards and Basic aspect correctly', () => {
    const leader = createCard({ type: 'Leader', aspects: ['Command'] });
    const base = createCard({ type: 'Base', aspects: ['Command'] });
    
    const doubleAspectCard = createCard({ name: 'Double', aspects: ['Command', 'Aggression'] });
    const basicCard = createCard({ name: 'Basic Card', aspects: ['Basic'] });
    
    const result = validateDeck(leader, base, [
      { card: doubleAspectCard, quantity: 1 },
      { card: basicCard, quantity: 1 }
    ], []);
    
    expect(result.warnings).toContain('Double is off-aspect (requires Aggression)');
    expect(result.warnings).not.toContain('Double is off-aspect (requires Command)');
    expect(result.warnings).not.toContain('Basic Card is off-aspect (requires Basic)');
  });
});
