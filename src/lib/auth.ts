import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        }
    }),
    plugins: [
        username(),
    ],
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
        },
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID || "placeholder",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "placeholder",
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    advanced: {
        database: {
            generateId: "serial",
        },
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Check if this is the first user in the system
                    const result = await db.select({ count: sql<number>`count(*)` }).from(schema.user);
                    const userCount = Number(result[0].count);

                    if (userCount === 1) {
                        // Migrate data from default userId 1 to the new first user
                        // If user.id is already 1, no migration is needed as they already own the data
                        if (Number(user.id) !== 1) {
                            await db.transaction(async (tx) => {
                                await tx.update(schema.userCollections)
                                    .set({ userId: Number(user.id) })
                                    .where(eq(schema.userCollections.userId, 1));

                                await tx.update(schema.decks)
                                    .set({ userId: Number(user.id) })
                                    .where(eq(schema.decks.userId, 1));
                            });
                        }
                    }
                }
            }
        }
    }
});
