import type { Card } from './deck-validation';

export interface AutoFilter {
  types?: string[];
  aspects?: string[];
}

/**
 * Computes the auto-filter target for the deck builder card browser based on the
 * current leader/base selection state (D-01, D-08).
 *
 * - Empty state (no leader OR no base): filter types to ['Leader', 'Base']
 * - Both selected: filter aspects to the union of leader+base aspects, excluding 'Basic'
 *
 * Pure function — safe to memoize on (leader, base) identity.
 */
export function computeAutoFilter(
  leader: Card | null,
  base: Card | null
): AutoFilter | null {
  if (!leader || !base) {
    return { types: ['Leader', 'Base'] };
  }
  const combined = new Set<string>();
  leader.aspects.forEach((a) => {
    if (a !== 'Basic') combined.add(a);
  });
  base.aspects.forEach((a) => {
    if (a !== 'Basic') combined.add(a);
  });
  return { aspects: [...combined] };
}

/**
 * Computes the human-readable label for the auto-filter chip (D-09).
 *
 * Returns null when the chip should NOT render (overridden, or no auto-filter).
 */
export function computeAutoFilterLabel(
  autoFilter: AutoFilter | null,
  isOverridden: boolean
): string | null {
  if (isOverridden || !autoFilter) return null;
  if (autoFilter.types) return 'Auto: Leader & Base';
  if (autoFilter.aspects) return 'Auto: Aspect filter';
  return null;
}
