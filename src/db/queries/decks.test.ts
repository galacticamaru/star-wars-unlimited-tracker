// @vitest-environment node
// Wave 0 stub — source-text assertions for PERF-07 caching requirements.
// These tests read src/db/queries/decks.ts as plain text (via readFileSync) and
// assert that the expected cache directives are present in the source. This avoids
// the DATABASE_URL trap: importing the module directly would trigger the Neon DB
// connection at module load time, crashing the test runner in CI.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(
  join(__dirname, 'decks.ts'),
  'utf-8'
);

describe("getDecks() caching (PERF-07)", () => {
  it("getDecks function body contains 'use cache' directive", () => {
    // Match from 'export async function getDecks' up to the next 'export' keyword
    const getDecksFnMatch = source.match(
      /export async function getDecks[\s\S]*?(?=\nexport)/
    );
    expect(getDecksFnMatch).not.toBeNull();
    const getDecksFnBody = getDecksFnMatch![0];
    expect(getDecksFnBody).toContain("'use cache'");
  });

  it("getDecks function body contains per-user cacheTag with userId", () => {
    expect(source).toContain('cacheTag(`decks-user-${userId}`)');
  });

  it("getDecks uses cacheLife directive for cache duration", () => {
    // Scoped to the getDecks function body
    const getDecksFnMatch = source.match(
      /export async function getDecks[\s\S]*?(?=\nexport)/
    );
    expect(getDecksFnMatch).not.toBeNull();
    const getDecksFnBody = getDecksFnMatch![0];
    expect(getDecksFnBody).toContain('cacheLife(');
  });
});

describe("getDeckWithCards() caching (PERF-07)", () => {
  it("getDeckWithCards function body contains 'use cache' directive", () => {
    const getDeckWithCardsFnMatch = source.match(
      /export async function getDeckWithCards[\s\S]*?(?=\nexport)/
    );
    expect(getDeckWithCardsFnMatch).not.toBeNull();
    const getDeckWithCardsFnBody = getDeckWithCardsFnMatch![0];
    expect(getDeckWithCardsFnBody).toContain("'use cache'");
  });

  it("getDeckWithCards function body contains per-deck per-user cacheTag", () => {
    expect(source).toContain('cacheTag(`deck-${deckId}-user-${userId}`)');
  });

  it("getDeckWithCards still contains ownership clause (Pitfall 3 — must not be removed by caching)", () => {
    // The ownership guard eq(decks.userId, userId) must remain even after
    // adding 'use cache' — removing it would be a cross-user data leak.
    expect(source).toContain('eq(decks.userId, userId)');
  });

  it("getDeckWithCards uses cacheLife directive for cache duration", () => {
    const getDeckWithCardsFnMatch = source.match(
      /export async function getDeckWithCards[\s\S]*?(?=\nexport)/
    );
    expect(getDeckWithCardsFnMatch).not.toBeNull();
    const getDeckWithCardsFnBody = getDeckWithCardsFnMatch![0];
    expect(getDeckWithCardsFnBody).toContain('cacheLife(');
  });

  it("getDeckWithCards still has and(eq(decks.id, deckId), eq(decks.userId, userId)) ownership guard", () => {
    expect(source).toContain('and(eq(decks.id, deckId), eq(decks.userId, userId))');
  });
});
