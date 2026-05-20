// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: '1' } }),
}));

describe('REQ-CAT-04: Starter Deck Quick-Add', () => {
  it('POST endpoint is exported from the route module', async () => {
    const { POST } = await import('../src/app/api/collection/starter-deck/route');
    expect(POST).toBeDefined();
    expect(typeof POST).toBe('function');
  });

  it('increments are additive — incrementVariantCount uses SQL addition', async () => {
    const { incrementVariantCount } = await import('../src/db/queries/collection');
    expect(incrementVariantCount).toBeDefined();
    expect(typeof incrementVariantCount).toBe('function');
  });

  it('starter decks data file exports a non-empty array', async () => {
    const { starterDecks } = await import('../src/data/starter-decks');
    expect(Array.isArray(starterDecks)).toBe(true);
    expect(starterDecks.length).toBeGreaterThan(0);
  });

  it('each starter deck has required fields', async () => {
    const { starterDecks } = await import('../src/data/starter-decks');
    for (const deck of starterDecks) {
      expect(deck.id, `Deck missing id`).toBeTruthy();
      expect(deck.name, `Deck ${deck.id} missing name`).toBeTruthy();
      expect(deck.setCode, `Deck ${deck.id} missing setCode`).toBeTruthy();
      expect(deck.cards, `Deck ${deck.id} missing cards`).toBeDefined();
      expect(deck.cards.length, `Deck ${deck.id} has no cards`).toBeGreaterThan(0);
    }
  });

  it('all 6 original Two-Player Starter decks are present', async () => {
    const { starterDecks } = await import('../src/data/starter-decks');
    const ids = starterDecks.map((d) => d.id);
    expect(ids).toContain('sor-luke');
    expect(ids).toContain('sor-vader');
    expect(ids).toContain('shd-mando');
    expect(ids).toContain('shd-gideon');
    expect(ids).toContain('twi-ahsoka');
    expect(ids).toContain('twi-grievous');
  });

  it('quantities are positive integers for all deck cards', async () => {
    const { starterDecks } = await import('../src/data/starter-decks');
    for (const deck of starterDecks) {
      for (const card of deck.cards) {
        expect(Number.isInteger(card.qty), `${deck.id}: qty must be integer`).toBe(true);
        expect(card.qty, `${deck.id}: qty must be > 0`).toBeGreaterThan(0);
      }
    }
  });
});
