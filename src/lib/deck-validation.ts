export interface Card {
  id: number;
  swudbId: string;
  name: string;
  subtitle: string | null;
  type: string;
  aspects: string[];
  arenas: string[];
  traits: string[];
  keywords: string[];
  cost: number | null;
  power: number | null;
  hp: number | null;
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
  backArtUrl: string | null;
  rarity: string;
  frontText: string | null;
  backText: string | null;
  epicAction: string | null;
  doubleSided: boolean;
  unique: boolean;
  priceEur: number | null;
  priceUsd: number | null;
}

export interface DeckCard {
  card: Card;
  quantity: number;
}

export interface ValidationStats {
  costCurve: Record<number, number>;
  typeCounts: Record<string, number>;
  aspectCounts: Record<string, number>;
  arenaCounts: Record<string, number>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: ValidationStats;
}

/**
 * Validates a deck based on SWU Premier rules.
 */
export function validateDeck(
  leader: Card | null,
  base: Card | null,
  mainDeck: DeckCard[],
  sideboard: DeckCard[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: ValidationStats = {
    costCurve: {},
    typeCounts: {},
    aspectCounts: {},
    arenaCounts: {},
  };

  // 1. Check Leader and Base
  if (!leader) {
    errors.push('Leader is required');
  }
  if (!base) {
    errors.push('Base is required');
  }

  // 2. Aggregate counts and stats
  const mainDeckCount = mainDeck.reduce((sum, item) => sum + item.quantity, 0);
  if (mainDeckCount < 50) {
    errors.push('Main deck must have at least 50 cards');
  }

  const combinedAspects = new Set<string>();
  if (leader) {
    leader.aspects.forEach((a) => combinedAspects.add(a));
  }
  if (base) {
    base.aspects.forEach((a) => combinedAspects.add(a));
  }

  const cardQuantities = new Map<string, { name: string; quantity: number; maxAllowed: number }>();

  const processCard = (item: DeckCard, isMain: boolean) => {
    const { card, quantity } = item;
    
    // Track quantities for 3-copy limit
    const isSwarmingVultureDroid = card.swudbId === 'JTL-256';
    const maxAllowed = isSwarmingVultureDroid ? 15 : 3;

    const existing = cardQuantities.get(card.swudbId) || { name: card.name, quantity: 0, maxAllowed };
    existing.quantity += quantity;
    cardQuantities.set(card.swudbId, existing);

    if (isMain) {
      // Statistics
      if (card.cost !== null) {
        const costKey = Math.min(card.cost, 9);
        stats.costCurve[costKey] = (stats.costCurve[costKey] || 0) + quantity;
      }

      stats.typeCounts[card.type] = (stats.typeCounts[card.type] || 0) + quantity;

      card.arenas.forEach((arena) => {
        stats.arenaCounts[arena] = (stats.arenaCounts[arena] || 0) + quantity;
      });

      card.aspects.forEach((aspect) => {
        stats.aspectCounts[aspect] = (stats.aspectCounts[aspect] || 0) + quantity;
        
        // Aspect penalty check (warning)
        if (aspect !== 'Basic' && !combinedAspects.has(aspect)) {
          const warning = `${card.name} is off-aspect (requires ${aspect})`;
          if (!warnings.includes(warning)) {
            warnings.push(warning);
          }
        }
      });
    }
  };

  mainDeck.forEach((item) => processCard(item, true));
  sideboard.forEach((item) => processCard(item, false));

  // 3. Final error checks
  for (const [swudbId, data] of cardQuantities.entries()) {
    if (data.quantity > data.maxAllowed) {
      errors.push(`Exceeded ${data.maxAllowed} copies of ${data.name}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}
