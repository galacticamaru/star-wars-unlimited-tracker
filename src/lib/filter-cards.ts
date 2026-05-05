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
}

export interface CardForFilter {
  id: number;
  name: string;
  type: string;
  aspects: string[];
  arenas: string[];
  traits: string[];
  keywords: string[];
  cost: number | null;
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
  backArtUrl: string | null;
  rarity: string;
}

export function filterCards(cards: CardForFilter[], filters: FilterState): CardForFilter[] {
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
  } = filters;

  return cards.filter(card => {
    // Search: case-insensitive substring on name (D-04)
    const matchesSearch = search === '' ||
      card.name.toLowerCase().includes(search.toLowerCase());

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

    // Rarity: OR within category (BYPASSED: selecting rarities does nothing for now)
    const matchesRarity = true;

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
      matchesCost
    );
  });
}
