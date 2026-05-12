// @vitest-environment node
// Wave 0 stub — covers CATALOG-01 query behavior
// These tests require a live DB connection; mark as todo for CI
// Full integration validation: manual smoke test after Wave 2 deployment
import { describe, it } from 'vitest';

describe('getAllCards()', () => {
  it.todo('returns an array of card objects');
  it.todo('excludes cards whose type contains "token" (case-insensitive)');
  it.todo('each returned card has a frontArtUrl field (string | null)');
  it.todo('each returned card has aspects as an array');
  it.todo('returns only Normal variant cards (no Foil/Hyperspace duplicates)');
});

describe('getFilterOptions()', () => {
  it.todo('returns { sets: string[], types: string[] }');
  it.todo('sets array is sorted ascending');
  it.todo('types array excludes token types');
});

describe('getTopCardsByPrice()', () => {
  it.todo('returns at most `limit` cards');
  it.todo('excludes cards with null priceUsd');
  it.todo('excludes token type cards (type contains "token", case-insensitive)');
  it.todo('excludes non-Normal variant cards (no Foil/Hyperspace duplicates)');
  it.todo('returns cards ordered by priceUsd DESC (highest first)');
});
