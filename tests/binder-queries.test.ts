import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserIdByUsername, getPublicBinderData } from '@/db/queries/binder';
import { db } from '@/db';
import * as binderLogic from '@/lib/binder-logic';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/binder-logic', () => ({
  calculateLookingFor: vi.fn(),
}));

describe('Binder Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserIdByUsername', () => {
    it('resolves a username to a userId', async () => {
      const mockLimit = vi.fn().mockResolvedValue([{ id: 123 }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await getUserIdByUsername('testuser');

      expect(result).toBe(123);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('returns null if user not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await getUserIdByUsername('unknown');

      expect(result).toBeNull();
    });
  });

  describe('getPublicBinderData', () => {
    it('fetches offerings and looking for cards', async () => {
      const mockOfferings = [{ id: 1, tradeQuantity: 5, name: 'Card A' }];
      const whereMock = vi.fn()
        .mockResolvedValueOnce(mockOfferings) // offerings
        .mockResolvedValueOnce([]) // inventory
        .mockResolvedValueOnce([]) // manualWants
        .mockResolvedValueOnce([]) // exclusions
        .mockResolvedValueOnce([]); // decks

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: whereMock
        })
      });

      const result = await getPublicBinderData(123);

      expect(result.offerings).toEqual(mockOfferings);
      expect(result.lookingFor).toEqual([]);
    });

    it('calculates looking for quantity correctly', async () => {
      const mockInventory = [{ cardDefinitionId: 1, count: 1 }];
      const mockManualWants = [{ cardDefinitionId: 1, quantity: 3 }];
      const mockExclusions: any[] = [];
      const mockDecks: any[] = [];
      const mockCardDetails = [{ id: 1, name: 'Card 1' }];

      (binderLogic.calculateLookingFor as any).mockReturnValue(2);

      const whereMock = vi.fn()
        .mockResolvedValueOnce([]) // offerings
        .mockResolvedValueOnce(mockInventory) // inventory
        .mockResolvedValueOnce(mockManualWants) // manualWants
        .mockResolvedValueOnce(mockExclusions) // exclusions
        .mockResolvedValueOnce(mockDecks) // decks
        .mockResolvedValueOnce(mockCardDetails); // cardDetails

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: whereMock
        })
      });

      const result = await getPublicBinderData(123);

      expect(binderLogic.calculateLookingFor).toHaveBeenCalled();
      expect(result.lookingFor).toHaveLength(1);
      expect(result.lookingFor[0]).toMatchObject({ id: 1, lookingForQuantity: 2 });
    });
  });
});
