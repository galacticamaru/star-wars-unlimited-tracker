import { describe, it, expect } from "vitest";
import { auth } from "@/lib/auth";

describe("Better Auth Configuration", () => {
    it("has the username plugin registered", () => {
        const plugins = auth.options.plugins;
        const hasUsernamePlugin = plugins?.some(p => p.id === "username");
        expect(hasUsernamePlugin).toBe(true);
    });
});
