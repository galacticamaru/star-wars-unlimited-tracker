import { describe, it, expect } from 'vitest';
import { mapPriceData, type SWUDBCard } from './prices';

describe('mapPriceData', () => {
  it('should map valid MarketPrice to integer cents for both USD and EUR', () => {
    const mockCard: SWUDBCard = {
      Set: 'SOR',
      Number: '001',
      Name: 'Test Card',
      VariantType: 'Normal',
      MarketPrice: '10.00'
    };

    const result = mapPriceData(mockCard);
    expect(result.priceUsd).toBe(1000);
    expect(result.priceEur).toBe(920); // 10.00 * 0.92 * 100
  });

  it('should handle missing MarketPrice', () => {
    const mockCard: SWUDBCard = {
      Set: 'SOR',
      Number: '001',
      Name: 'Test Card',
      VariantType: 'Normal',
      MarketPrice: undefined
    };

    const result = mapPriceData(mockCard);
    expect(result.priceEur).toBeNull();
    expect(result.priceUsd).toBeNull();
  });

  it('should handle invalid MarketPrice', () => {
    const mockCard: SWUDBCard = {
      Set: 'SOR',
      Number: '001',
      Name: 'Test Card',
      VariantType: 'Normal',
      MarketPrice: 'invalid'
    };

    const result = mapPriceData(mockCard);
    expect(result.priceEur).toBeNull();
    expect(result.priceUsd).toBeNull();
  });
});
