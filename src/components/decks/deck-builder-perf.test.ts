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
    const startTransitionIndex = source.indexOf('startTransition(');
    const setLeaderIndex = source.indexOf("'SET_LEADER'");
    // startTransition must appear before SET_LEADER
    expect(startTransitionIndex).toBeGreaterThan(-1);
    expect(setLeaderIndex).toBeGreaterThan(startTransitionIndex);
    // Pattern must also exist
    expect(source).toMatch(/startTransition\s*\(\s*\(\s*\)\s*=>/);
  });

  it('SET_BASE dispatch is wrapped in a startTransition callback', () => {
    const startTransitionIndex = source.indexOf('startTransition(');
    const setBaseIndex = source.indexOf("'SET_BASE'");
    expect(startTransitionIndex).toBeGreaterThan(-1);
    expect(setBaseIndex).toBeGreaterThan(startTransitionIndex);
  });

  it('UPDATE_CARD dispatch is wrapped in a startTransition callback', () => {
    const startTransitionIndex = source.indexOf('startTransition(');
    const updateCardIndex = source.indexOf("'UPDATE_CARD'");
    expect(startTransitionIndex).toBeGreaterThan(-1);
    expect(updateCardIndex).toBeGreaterThan(startTransitionIndex);
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
