import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userCollections, decks } from "@/db/schema";

vi.mock("@/db", () => ({
    db: {
        select: vi.fn(),
        update: vi.fn(),
        transaction: vi.fn(),
    },
}));

// We need to mock better-auth social providers as well because they are imported in auth.ts
vi.mock("better-auth", async (importOriginal) => {
    const original = await importOriginal() as any;
    return {
        ...original,
        betterAuth: vi.fn().mockImplementation((config) => ({
            options: config,
        })),
    };
});

describe("First-User Migration Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // @ts-ignore
    const afterCreateHook = auth.options.databaseHooks.user.create.after;

    it("migrates legacy data (userId=1) to the first registered user", async () => {
        // Mock user count = 1 (the user just created)
        (db.select as any).mockReturnValue({
            from: vi.fn().mockResolvedValue([{ count: 1 }])
        });

        const mockTx = {
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue({}),
        };
        (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

        const newUser = { id: 10, email: "first@example.com", name: "First User" } as any;
        await afterCreateHook(newUser);

        // Verify that update was called for userCollections and decks
        expect(db.transaction).toHaveBeenCalled();
        expect(mockTx.update).toHaveBeenCalledWith(userCollections);
        expect(mockTx.update).toHaveBeenCalledWith(decks);
    });

    it("does not migrate data if user.id is already 1", async () => {
        // Mock user count = 1
        (db.select as any).mockReturnValue({
            from: vi.fn().mockResolvedValue([{ count: 1 }])
        });

        const newUser = { id: 1, email: "admin@example.com", name: "Admin" } as any;
        await afterCreateHook(newUser);

        expect(db.transaction).not.toHaveBeenCalled();
    });

    it("does not migrate data for subsequent user registrations", async () => {
        // Mock user count = 2
        (db.select as any).mockReturnValue({
            from: vi.fn().mockResolvedValue([{ count: 2 }])
        });

        const newUser = { id: 11, email: "second@example.com", name: "Second User" } as any;
        await afterCreateHook(newUser);

        expect(db.transaction).not.toHaveBeenCalled();
    });
});
