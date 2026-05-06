import { describe, it, expect } from 'vitest';
import { toMeleeFormat, ExportDeck } from './export';

describe('toMeleeFormat', () => {
  it('formats a full deck correctly', () => {
    const deck: ExportDeck = {
      name: 'Luke Heroism',
      leader: {
        name: 'Luke Skywalker',
        subtitle: 'Faithful Friend',
        quantity: 1,
        setCode: 'SOR',
        collectorNumber: 'SOR-005',
        isSideboard: false,
        type: 'Leader',
      },
      base: {
        name: 'Echo Base',
        quantity: 1,
        setCode: 'SOR',
        collectorNumber: 'SOR-022',
        isSideboard: false,
        type: 'Base',
      },
      cards: [
        {
          name: 'Restored ARC-170',
          quantity: 3,
          setCode: 'SOR',
          collectorNumber: 'SOR-044',
          isSideboard: false,
          type: 'Unit',
        },
        {
          name: 'You Are My Only Hope',
          quantity: 2,
          setCode: 'SOR',
          collectorNumber: 'SOR-018',
          isSideboard: true,
          type: 'Event',
        },
      ],
    };

    const output = toMeleeFormat(deck);
    expect(output).toContain('Leader');
    expect(output).toContain('1 Luke Skywalker, Faithful Friend (SOR) 005');
    expect(output).toContain('Base');
    expect(output).toContain('1 Echo Base (SOR) 022');
    expect(output).toContain('Deck');
    expect(output).toContain('3 Restored ARC-170 (SOR) 044');
    expect(output).toContain('Sideboard');
    expect(output).toContain('2 You Are My Only Hope (SOR) 018');
  });
});
