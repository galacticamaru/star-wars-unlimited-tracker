export interface FilterState {
  search: string;
  selectedSets: string[];
  selectedTypes: string[];
  selectedAspects: string[];
  selectedArenas: string[];
  selectedTraits: string[];
  selectedRarities: string[];
  selectedKeywords: string[];
  selectedCosts: string[];
  selectedVariants?: string[] | null;
  ownedOnly?: boolean;
}

export interface CardForFilter {
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
  variantType?: string;
  frontText: string | null;
  backText: string | null;
  epicAction: string | null;
  doubleSided: boolean;
  unique: boolean;
  priceEur: number | null;
  priceUsd: number | null;
  tradeQuantity?: number;
  lookingForQuantity?: number;
}

export function filterCards(
  cards: CardForFilter[],
  filters: FilterState,
  collection: Record<number, number> = {}
): CardForFilter[] {
  const {
    search = '',
    selectedSets = [],
    selectedTypes = [],
    selectedAspects = [],
    selectedArenas = [],
    selectedTraits = [],
    selectedRarities = [],
    selectedKeywords = [],
    selectedCosts = [],
    selectedVariants = [],
    ownedOnly = false,
  } = filters;

  return cards.filter(card => {
    const q = search.toLowerCase();
    const matchesSearch = search === '' ||
      card.name.toLowerCase().includes(q) ||
      (card.frontText ?? '').toLowerCase().includes(q) ||
      (card.backText ?? '').toLowerCase().includes(q) ||
      (card.epicAction ?? '').toLowerCase().includes(q);

    // Set: OR within category (D-05 — AND is across categories)
    const matchesSet = (selectedSets?.length ?? 0) === 0 ||
      selectedSets.includes(card.setCode);

    // Type: OR within category
    const matchesType = (selectedTypes?.length ?? 0) === 0 ||
      selectedTypes.includes(card.type);

    // Aspect: subset match — every aspect on the card must be within the selected set.
    const matchesAspect = (selectedAspects?.length ?? 0) === 0 ||
      (card.aspects || []).every(a => selectedAspects.includes(a));

    // Arena: OR within category (some overlap with multiple arenas is possible)
    const matchesArena = (selectedArenas?.length ?? 0) === 0 ||
      (card.arenas || []).some(a => selectedArenas.includes(a));

    // Trait: OR within category
    const matchesTrait = (selectedTraits?.length ?? 0) === 0 ||
      (card.traits || []).some(t => selectedTraits.includes(t));

    // Rarity: OR within category
    const matchesRarity = (selectedRarities?.length ?? 0) === 0 ||
      selectedRarities.some(r => {
        // UI uses "(C) Common", DB uses "Common"
        const normalizedRarity = r.includes(' ') ? r.split(' ')[1] : r;
        return card.rarity === normalizedRarity;
      });

    // Keyword: OR within category
    const matchesKeyword = (selectedKeywords?.length ?? 0) === 0 ||
      (card.keywords || []).some(k => selectedKeywords.includes(k));

    // Cost: OR within category, special handling for 9+
    const matchesCost = (selectedCosts?.length ?? 0) === 0 || (
      card.cost !== null && card.cost !== undefined && selectedCosts.some(c => {
        if (c === '9+') return card.cost! >= 9;
        return card.cost === parseInt(c, 10);
      })
    );

    // Variant: OR within category
    const matchesVariant = !selectedVariants?.length || (card.variantType && selectedVariants.includes(card.variantType));

    // Owned-only gate: pass-through when toggle is off; checks collection count when on (D-01)
    const matchesOwned = !ownedOnly || (collection[card.id] ?? 0) >= 1;

    // AND across categories (D-05)
    return (
      matchesSearch &&
      matchesSet &&
      matchesType &&
      matchesAspect &&
      matchesArena &&
      matchesTrait &&
      matchesRarity &&
      matchesKeyword &&
      matchesCost &&
      matchesVariant &&
      matchesOwned
    );
  });
}
