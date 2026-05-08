import { describe, it, expect, vi } from "vitest";
import { proxy } from "@/proxy";
import { NextResponse, NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

vi.mock("better-auth/cookies", () => ({
    getSessionCookie: vi.fn(),
}));

vi.mock("next/server", () => {
    class MockNextRequest {
        url: string;
        nextUrl: URL;
        constructor(url: string) {
            this.url = url;
            this.nextUrl = new URL(url);
        }
    }
    return {
        NextResponse: {
            redirect: vi.fn((url) => ({ status: 302, url })),
            next: vi.fn(() => ({ status: 200 })),
        },
        NextRequest: MockNextRequest,
    };
});

describe("Auth Protection", () => {
    it("redirects unauthenticated users from /collection to /login", async () => {
        vi.mocked(getSessionCookie).mockReturnValue(undefined);
        const request = new NextRequest("http://localhost:3000/collection");
        
        const response = await proxy(request as any);
        
        expect(NextResponse.redirect).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: "/login" })
        );
    });

    it("redirects unauthenticated users from /decks to /login", async () => {
        vi.mocked(getSessionCookie).mockReturnValue(undefined);
        const request = new NextRequest("http://localhost:3000/decks");
        
        const response = await proxy(request as any);
        
        expect(NextResponse.redirect).toHaveBeenCalledWith(
            expect.objectContaining({ pathname: "/login" })
        );
    });

    it("allows authenticated users to access /collection", async () => {
        vi.mocked(getSessionCookie).mockReturnValue({ name: "session", value: "token" } as any);
        const request = new NextRequest("http://localhost:3000/collection");
        
        const response = await proxy(request as any);
        
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it("allows public access to home page", async () => {
        vi.mocked(getSessionCookie).mockReturnValue(undefined);
        const request = new NextRequest("http://localhost:3000/");
        
        const response = await proxy(request as any);
        
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it("allows public access to /cards/set-001", async () => {
        vi.mocked(getSessionCookie).mockReturnValue(undefined);
        const request = new NextRequest("http://localhost:3000/cards/set-001");
        
        const response = await proxy(request as any);
        
        expect(NextResponse.next).toHaveBeenCalled();
    });
});
