// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '@/app/api/decks/[id]/route';
import { NextRequest } from 'next/server';

vi.mock('@/db/queries/decks', () => ({
  getDeckWithCards: vi.fn(),
  updateDeck: vi.fn(),
  getCardsByDefinitionIds: vi.fn(),
  deleteDeck: vi.fn(),
}));

vi.mock('@/lib/deck-validation', () => ({
  validateDeck: vi.fn(),
}));

import { getDeckWithCards, updateDeck, getCardsByDefinitionIds } from '@/db/queries/decks';
import { validateDeck } from '@/lib/deck-validation';

describe('PATCH /api/decks/[id] validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows saving as draft without validation', async () => {
    const body = { name: 'Test Deck', isDraft: true };
    const request = new NextRequest('http://localhost/api/decks/1', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(validateDeck).not.toHaveBeenCalled();
    expect(updateDeck).toHaveBeenCalledWith(1, body);
  });

  it('rejects illegal non-draft decks', async () => {
    const body = { 
      name: 'Test Deck', 
      isDraft: false, 
      leaderCardDefinitionId: 1, 
      baseCardDefinitionId: 2, 
      cards: [] 
    };
    const request = new NextRequest('http://localhost/api/decks/1', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    (getCardsByDefinitionIds as any).mockResolvedValue([
      { id: 1, type: 'Leader' },
      { id: 2, type: 'Base' }
    ]);
    (validateDeck as any).mockReturnValue({ isValid: false, errors: ['Main deck must have at least 50 cards'] });

    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errors).toContain('Main deck must have at least 50 cards');
    expect(updateDeck).not.toHaveBeenCalled();
  });

  it('allows legal non-draft decks', async () => {
    const body = { 
      name: 'Test Deck', 
      isDraft: false, 
      leaderCardDefinitionId: 1, 
      baseCardDefinitionId: 2, 
      cards: [] 
    };
    const request = new NextRequest('http://localhost/api/decks/1', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    (getCardsByDefinitionIds as any).mockResolvedValue([
      { id: 1, type: 'Leader' },
      { id: 2, type: 'Base' }
    ]);
    (validateDeck as any).mockReturnValue({ 
      isValid: true, 
      errors: [], 
      warnings: [], 
      stats: { costCurve: {}, typeCounts: {}, aspectCounts: {}, arenaCounts: {} } 
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(updateDeck).toHaveBeenCalledWith(1, body);
  });

  it('fetches existing state if body is partial and isDraft is set to false', async () => {
    const body = { isDraft: false };
    const request = new NextRequest('http://localhost/api/decks/1', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    (getDeckWithCards as any).mockResolvedValue({
      id: 1,
      leaderCardDefinitionId: 10,
      baseCardDefinitionId: 20,
      cards: [
        { cardDefinitionId: 30, quantity: 3, isSideboard: false }
      ]
    });

    (getCardsByDefinitionIds as any).mockResolvedValue([
      { id: 10, type: 'Leader' },
      { id: 20, type: 'Base' },
      { id: 30, type: 'Unit' }
    ]);

    (validateDeck as any).mockReturnValue({ 
      isValid: true, 
      errors: [], 
      warnings: [], 
      stats: { costCurve: {}, typeCounts: {}, aspectCounts: {}, arenaCounts: {} } 
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getDeckWithCards).toHaveBeenCalledWith(1);
    expect(getCardsByDefinitionIds).toHaveBeenCalled();
    // Verify it called validateDeck with the right merged data
    expect(validateDeck).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
      expect.objectContaining({ id: 20 }),
      [expect.objectContaining({ card: expect.objectContaining({ id: 30 }), quantity: 3 })],
      []
    );
  });
});
