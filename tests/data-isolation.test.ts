import { describe, it, expect, vi } from "vitest";
import { getUserCollection } from "@/db/queries/collection";
import { getDecks, updateDeck } from "@/db/queries/decks";
import { db } from "@/db";
import { userCollections, decks } from "@/db/schema";

vi.mock("@/db", () => ({
    db: {
        select: vi.fn(),
        update: vi.fn(),
        insert: vi.fn(),
        transaction: vi.fn(),
    },
}));

describe("Data Isolation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("only returns collection items belonging to the current user", async () => {
        const mockWhere = vi.fn().mockResolvedValue([]);
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        (db.select as any).mockReturnValue({ from: mockFrom });

        await getUserCollection(123);

        expect(db.select).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalledWith(userCollections);
        expect(mockWhere).toHaveBeenCalled();
    });

    it("uses the provided userId when upserting card counts", async () => {
        const { upsertCardCount } = await import("@/db/queries/collection");
        const mockReturning = vi.fn().mockResolvedValue([]);
        const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning });
        const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflict });
        (db.insert as any).mockReturnValue({ values: mockValues });

        await upsertCardCount(1, 3, 789);

        expect(db.insert).toHaveBeenCalledWith(userCollections);
        expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({ userId: 789 }));
    });

    it("only returns decks belonging to the current user", async () => {
        const mockOrderBy = vi.fn().mockResolvedValue([]);
        const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
        const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
        (db.select as any).mockReturnValue({ from: mockFrom });

        await getDecks(456);

        expect(db.select).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalledWith(decks);
        expect(mockWhere).toHaveBeenCalled();
        expect(mockOrderBy).toHaveBeenCalled();
    });

    it("prevents users from updating other users' decks", async () => {
        // updateDeck uses a transaction and first selects the deck to check ownership
        const mockTx = {
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([]), // Empty result = deck not found or unauthorized
        };

        (db.transaction as any).mockImplementation(async (cb: any) => {
            return cb(mockTx);
        });

        await expect(updateDeck(1, 999, { name: "New Name" }))
            .rejects.toThrow("Deck not found or unauthorized");
    });

    it("allows updating own decks", async () => {
        const mockTx = {
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([{ id: 1, userId: 999 }]), // Deck exists and belongs to user
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            // where for update
        };
        mockTx.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(1) }) });

        (db.transaction as any).mockImplementation(async (cb: any) => {
            return cb(mockTx);
        });

        const result = await updateDeck(1, 999, { name: "New Name" });
        expect(result).toBe(1);
    });
});
