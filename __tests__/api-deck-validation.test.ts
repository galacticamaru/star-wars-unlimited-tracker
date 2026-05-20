// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '@/app/api/decks/[id]/route';
import { NextRequest } from 'next/server';
import { getDeckWithCards, updateDeck, getCardsByDefinitionIds } from '@/db/queries/decks';
import { validateDeck, ValidationResult } from '@/lib/deck-validation';

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(() => Promise.resolve({ user: { id: '1' } })),
    },
  },
}));

vi.mock('@/db/queries/decks', () => ({
  getDeckWithCards: vi.fn(),
  updateDeck: vi.fn(),
  getCardsByDefinitionIds: vi.fn(),
  deleteDeck: vi.fn(),
}));

vi.mock('@/lib/deck-validation', () => ({
  validateDeck: vi.fn(),
}));

type MockCard = Partial<Awaited<ReturnType<typeof getCardsByDefinitionIds>>[0]>;

describe('PATCH /api/decks/[id] validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCardsByDefinitionIds).mockReset();
    vi.mocked(validateDeck).mockReset();
    vi.mocked(getDeckWithCards).mockReset();
    vi.mocked(updateDeck).mockReset();
  });

  it('allows saving as draft without validation', async () => {
    const body = { name: 'Test Deck', isDraft: true };
    const request = new NextRequest('http://localhost/api/decks/1', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    const response = await PATCH(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(validateDeck).not.toHaveBeenCalled();
    expect(updateDeck).toHaveBeenCalledWith(1, 1, body);
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

    const mockCards: MockCard[] = [
      { id: 1, type: 'Leader' },
      { id: 2, type: 'Base' }
    ];
    vi.mocked(getCardsByDefinitionIds).mockResolvedValue(mockCards as any);
    
    const mockValidationResult: ValidationResult = { 
      isValid: false, 
      errors: ['Main deck must have at least 50 cards'],
      warnings: [],
      stats: { costCurve: {}, sideboardCostCurve: {}, typeCounts: {}, aspectCounts: {}, arenaCounts: {} }
    };
    vi.mocked(validateDeck).mockReturnValue(mockValidationResult);

    const response = await PATCH(request, { params: { id: '1' } });
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

    const mockCards: MockCard[] = [
        { id: 1, type: 'Leader' },
        { id: 2, type: 'Base' }
    ];
    vi.mocked(getCardsByDefinitionIds).mockResolvedValue(mockCards as any);
    
    const mockValidationResult: ValidationResult = { 
      isValid: true, 
      errors: [], 
      warnings: [], 
      stats: { costCurve: {}, sideboardCostCurve: {}, typeCounts: {}, aspectCounts: {}, arenaCounts: {} } 
    };
    vi.mocked(validateDeck).mockReturnValue(mockValidationResult);

    const response = await PATCH(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(updateDeck).toHaveBeenCalledWith(1, 1, body);
  });

  it('fetches existing state if body is partial and isDraft is set to false', async () => {
    const body = { isDraft: false };
    const request = new NextRequest('http://localhost/api/decks/1', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    vi.mocked(getDeckWithCards).mockResolvedValue({
      id: 1,
      name: 'Existing Deck',
      userId: 1,
      leaderCardDefinitionId: 10,
      baseCardDefinitionId: 20,
      isDraft: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      cards: [
        { deckId: 1, cardDefinitionId: 30, quantity: 3, isSideboard: false }
      ]
    });

    const mockCards: MockCard[] = [
      { id: 10, type: 'Leader' },
      { id: 20, type: 'Base' },
      { id: 30, type: 'Unit' }
    ];
    vi.mocked(getCardsByDefinitionIds).mockResolvedValue(mockCards as any);

    const mockValidationResult: ValidationResult = { 
      isValid: true, 
      errors: [], 
      warnings: [], 
      stats: { costCurve: {}, sideboardCostCurve: {}, typeCounts: {}, aspectCounts: {}, arenaCounts: {} } 
    };
    vi.mocked(validateDeck).mockReturnValue(mockValidationResult);

    const response = await PATCH(request, { params: { id: '1' } });
    await response.json();

    expect(response.status).toBe(200);
    expect(getDeckWithCards).toHaveBeenCalledWith(1, 1);
    expect(getCardsByDefinitionIds).toHaveBeenCalled();
    expect(validateDeck).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
      expect.objectContaining({ id: 20 }),
      expect.any(Array),
      expect.any(Array)
    );
  });
});
