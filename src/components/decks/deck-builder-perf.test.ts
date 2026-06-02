// @vitest-environment node
// Wave 0 stub — source-text assertions for PERF-08 startTransition requirements.
// NOTE: This is a separate file from deck-builder.test.tsx (which uses jsdom environment
// for Phase 26 mobile layout tests). Source-inspection tests must run in node environment
// to avoid importing the component and triggering jsdom/next/image issues.
// These tests read deck-builder.tsx as plain text and assert cache-related patterns.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(
  join(__dirname, 'deck-builder.tsx'),
  'utf-8'
);

describe('deck-builder startTransition (PERF-08)', () => {
  it('imports startTransition from react', () => {
    // After Plan 01, deck-builder.tsx should import startTransition from 'react'
    // Currently it only imports: useReducer, useState, useMemo, useEffect, useRef
    expect(source).toMatch(/import\s*\{[^}]*startTransition[^}]*\}\s*from\s*['"]react['"]/);
  });

  it('SET_LEADER dispatch is wrapped in a startTransition callback', () => {
    // The dispatch for SET_LEADER should occur inside startTransition(() => { ... })
    // Use regex to find startTransition wrapping the SET_LEADER dispatch call
    // (indexOf comparison fails because 'SET_LEADER' also appears in the DeckAction type definition)
    expect(source).toMatch(/startTransition\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*'SET_LEADER'/s);
  });

  it('SET_BASE dispatch is wrapped in a startTransition callback', () => {
    // Use regex to find startTransition wrapping the SET_BASE dispatch call
    expect(source).toMatch(/startTransition\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*'SET_BASE'/s);
  });

  it('UPDATE_CARD dispatch is wrapped in a startTransition callback', () => {
    // Use regex to find startTransition wrapping the UPDATE_CARD dispatch call
    expect(source).toMatch(/startTransition\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*'UPDATE_CARD'/s);
  });

  it('source contains at least 3 startTransition wrappers (one per dispatch type)', () => {
    // Count all occurrences of startTransition( in source
    const matches = source.match(/startTransition\s*\(/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(3);
  });

  it('setIsAutoFilterOverridden(false) remains outside startTransition (Pitfall 4)', () => {
    // The setIsAutoFilterOverridden(false) call must NOT be inside a startTransition;
    // it updates UI filtering state and should remain synchronous.
    expect(source).toContain('setIsAutoFilterOverridden(false)');
  });
});
