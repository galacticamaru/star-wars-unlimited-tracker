import { fetchSetPrices, mapPriceData } from '../src/lib/sync/prices';

async function main() {
  const setCode = 'SOR';
  console.log(`Starting API verification for set: ${setCode}`);

  try {
    let prices: any;
    try {
      prices = await fetchSetPrices(setCode);
      console.log(`✅ Successfully connected to API. Found ${Object.keys(prices).length} cards.`);
    } catch (apiError: any) {
      console.warn(`⚠️ API connection failed: ${apiError.message}`);
      console.log('Falling back to mock data for mapping verification...');
      
      // Mock data matching the schema in 07-RESEARCH.md
      prices = {
        "001": {
          "tcgplayer": {
            "variants": {
              "Normal": {
                "current": { "market": 85.50 }
              }
            }
          },
          "cardmarket": {
            "variants": {
              "normal": {
                "current": { "low": 68.00 }
              }
            }
          }
        },
        "002": {
          "tcgplayer": {
            "variants": {
              "Normal": {
                "current": { "market": 1.25 }
              }
            }
          },
          "cardmarket": {
            "variants": {
              "normal": {
                "current": { "low": 0.95 }
              }
            }
          }
        }
      };
    }

    const keys = Object.keys(prices);
    keys.slice(0, 5).forEach(key => {
      const raw = prices[key];
      const mapped = mapPriceData(raw);
      console.log(`- ${key}: Mapped: EUR ${mapped.priceEur} cents, USD ${mapped.priceUsd} cents | Raw values: EUR ${raw.cardmarket?.variants?.normal?.current?.low}, USD ${raw.tcgplayer?.variants?.Normal?.current?.market}`);
    });

    // Final verification of mapping
    if (keys.includes("001")) {
      const first = prices["001"];
      const mapped = mapPriceData(first);
      if (mapped.priceEur === 6800 && mapped.priceUsd === 8550) {
         console.log('✅ Mapping verification passed.');
      } else {
         console.error(`❌ Mapping verification failed. Expected EUR 6800 USD 8550, got EUR ${mapped.priceEur} USD ${mapped.priceUsd}`);
      }
    } else {
      console.log('✅ Mapping verification finished (real data).');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
