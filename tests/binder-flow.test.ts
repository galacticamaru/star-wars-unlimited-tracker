/**
 * @vitest-environment node
 */
import { expect, test, vi } from 'vitest';
import { getUserIdByUsername, getPublicBinderData } from '@/db/queries/binder';
import { upsertTradeQuantity } from '@/db/queries/trade';
import { db } from '@/db';
import { user, userCollections } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Mock DB
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

// Mock binder logic
vi.mock('@/lib/binder-logic', () => ({
  calculateLookingFor: vi.fn(() => 0),
}));

test('Full Binder Flow: Set Username -> Add to Binder -> Public View', async () => {
  const userId = 42;
  const username = 'test-trader';
  const cardId = 101;
  const quantity = 3;

  // 1. Set Username (Update user table)
  const mockSet = vi.fn().mockReturnThis();
  const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
  (db.update as any).mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: mockUpdateWhere });

  await db.update(user)
    .set({ username: username.toLowerCase(), displayUsername: username })
    .where(eq(user.id, userId));
    
  expect(db.update).toHaveBeenCalledWith(user);

  // 2. Add card to trade binder (upsertTradeQuantity)
  const mockReturning = vi.fn().mockResolvedValue([{ userId, cardDefinitionId: cardId, tradeQuantity: quantity }]);
  const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflict });
  (db.insert as any).mockReturnValue({ values: mockValues });

  await upsertTradeQuantity(userId, cardId, quantity);
  
  expect(db.insert).toHaveBeenCalledWith(userCollections);

  // 3. Resolve username to userId (getUserIdByUsername) & Fetch public binder data (getPublicBinderData)
  
  const mockLimit = vi.fn().mockResolvedValue([{ id: userId }]);
  const mockWhereUser = vi.fn().mockReturnValue({ limit: mockLimit });
  
  const mockOffering = { id: cardId, name: 'Vader', tradeQuantity: quantity };
  const mockResults = vi.fn()
    .mockResolvedValueOnce([mockOffering]) // offerings
    .mockResolvedValueOnce([]) // inventory
    .mockResolvedValueOnce([]) // manualWants
    .mockResolvedValueOnce([]) // exclusions
    .mockResolvedValueOnce([]) // decks
    .mockResolvedValueOnce([]); // cardDetails

  // Configure db.select to handle the sequence of calls
  (db.select as any).mockImplementation(() => ({
    from: (table: any) => {
      if (table === user) {
        return { where: mockWhereUser };
      }
      return {
        innerJoin: vi.fn().mockReturnThis(),
        where: mockResults
      };
    }
  }));

  // Execute Step 3: Resolve
  const resolvedUserId = await getUserIdByUsername(username);
  expect(resolvedUserId).toBe(userId);

  // Execute Step 4: Fetch
  const binderData = await getPublicBinderData(resolvedUserId!);
  expect(binderData.offerings).toHaveLength(1);
  expect(binderData.offerings[0].id).toBe(cardId);
  expect(binderData.offerings[0].tradeQuantity).toBe(quantity);
});
