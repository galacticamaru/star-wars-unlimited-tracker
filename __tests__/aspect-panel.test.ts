// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { filterAndSortAspects } from '@/lib/aspect-panel';

describe('filterAndSortAspects', () => {
  it('excludes Basic aspect from output', () => {
    const input = { Aggression: 8, Basic: 5, Command: 3 };
    const result = filterAndSortAspects(input);
    expect(result.map(([k]) => k)).not.toContain('Basic');
  });

  it('sorts aspects descending by count', () => {
    const input = { Command: 3, Aggression: 8, Cunning: 5 };
    const result = filterAndSortAspects(input);
    expect(result[0][0]).toBe('Aggression');
    expect(result[1][0]).toBe('Cunning');
    expect(result[2][0]).toBe('Command');
  });

  it('returns empty array when aspectCounts is empty', () => {
    expect(filterAndSortAspects({})).toHaveLength(0);
  });

  it('returns empty array when only Basic aspect exists', () => {
    const result = filterAndSortAspects({ Basic: 12 });
    expect(result).toHaveLength(0);
  });

  it('returns all non-Basic entries when none are Basic', () => {
    const input = { Vigilance: 4, Force: 6 };
    const result = filterAndSortAspects(input);
    expect(result).toHaveLength(2);
  });
});
