/**
 * Unit tests for catalog variant art precedence logic (REQ-COLLECT-08).
 *
 * These tests validate the pure selection function used in CardGrid to pick
 * the best art URL for a card tile based on the user's owned variants.
 *
 * Precedence: Showcase(5) > Hyperspace Foil(4) > Hyperspace(3) > Foil(2) > Normal(1)
 */

import { describe, it, expect } from 'vitest';
import { selectBestVariantArtUrl } from '../src/lib/catalog/select-best-variant';

type PrintingArtMap = Record<number, { variantType: string; frontArtUrl: string | null }>;

describe('selectBestVariantArtUrl', () => {
  const printingArtMap: PrintingArtMap = {
    1: { variantType: 'Normal', frontArtUrl: 'https://cdn.example.com/normal.png' },
    2: { variantType: 'Foil', frontArtUrl: 'https://cdn.example.com/foil.png' },
    3: { variantType: 'Hyperspace', frontArtUrl: 'https://cdn.example.com/hyperspace.png' },
    4: { variantType: 'Hyperspace Foil', frontArtUrl: 'https://cdn.example.com/hs-foil.png' },
    5: { variantType: 'Showcase', frontArtUrl: 'https://cdn.example.com/showcase.png' },
  };

  it('returns null when no variants are owned (zero counts)', () => {
    const variants: Record<number, number> = { 1: 0, 2: 0 };
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBeNull();
  });

  it('returns null when variants map is empty', () => {
    expect(selectBestVariantArtUrl({}, printingArtMap)).toBeNull();
  });

  it('returns null when printingArtMap is empty', () => {
    expect(selectBestVariantArtUrl({ 1: 2 }, {})).toBeNull();
  });

  it('returns the art URL for the single owned variant', () => {
    const variants: Record<number, number> = { 1: 3 };
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBe('https://cdn.example.com/normal.png');
  });

  it('picks the variant with the highest count', () => {
    // Foil has more copies than Normal → use Foil art
    const variants: Record<number, number> = { 1: 1, 2: 3 };
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBe('https://cdn.example.com/foil.png');
  });

  it('picks Hyperspace over Foil when Hyperspace has more copies', () => {
    const variants: Record<number, number> = { 2: 1, 3: 2 };
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBe('https://cdn.example.com/hyperspace.png');
  });

  it('tie-breaks with Showcase over all others when counts are equal', () => {
    // All owned equally — Showcase should win
    const variants: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBe('https://cdn.example.com/showcase.png');
  });

  it('tie-breaks with Hyperspace Foil over Hyperspace/Foil/Normal when counts equal', () => {
    const variants: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 2 };
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBe('https://cdn.example.com/hs-foil.png');
  });

  it('tie-breaks with Hyperspace over Foil/Normal when counts equal', () => {
    const variants: Record<number, number> = { 1: 2, 2: 2, 3: 2 };
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBe('https://cdn.example.com/hyperspace.png');
  });

  it('tie-breaks with Foil over Normal when counts equal', () => {
    const variants: Record<number, number> = { 1: 2, 2: 2 };
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBe('https://cdn.example.com/foil.png');
  });

  it('count wins over precedence (higher count beats higher precedence)', () => {
    // Normal has 5 copies, Showcase has 1 — Normal count wins
    const variants: Record<number, number> = { 1: 5, 5: 1 };
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBe('https://cdn.example.com/normal.png');
  });

  it('handles string keys from Object.entries correctly (Pitfall 2)', () => {
    // Simulates real-world case where JS keys become strings
    // The function must parse string keys to numbers when looking up printingArtMap
    const variants = { '2': 3, '1': 1 } as unknown as Record<number, number>;
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBe('https://cdn.example.com/foil.png');
  });

  it('falls back gracefully when printingId is not in the artMap', () => {
    // printingId 99 is unknown — should be ignored
    const variants: Record<number, number> = { 99: 5, 1: 1 };
    expect(selectBestVariantArtUrl(variants, printingArtMap)).toBe('https://cdn.example.com/normal.png');
  });

  it('returns frontArtUrl even when it is null (null is a valid signal)', () => {
    const mapWithNull: PrintingArtMap = {
      ...printingArtMap,
      6: { variantType: 'Normal', frontArtUrl: null },
    };
    const variants: Record<number, number> = { 6: 3 };
    expect(selectBestVariantArtUrl(variants, mapWithNull)).toBeNull();
  });

  it('treats unknown variant types as lowest precedence (0)', () => {
    const mapWithUnknown: PrintingArtMap = {
      ...printingArtMap,
      7: { variantType: 'Special Edition', frontArtUrl: 'https://cdn.example.com/special.png' },
    };
    // Special Edition tied with Normal → Normal has precedence 1, unknown has 0 → Normal wins
    const variants: Record<number, number> = { 1: 2, 7: 2 };
    expect(selectBestVariantArtUrl(variants, mapWithUnknown)).toBe('https://cdn.example.com/normal.png');
  });
});
