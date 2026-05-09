import { fetchSetPrices, mapPriceData } from '../src/lib/sync/prices';

async function main() {
  const setCode = 'SOR'.trim();
  console.log(`Starting API verification for set: [${setCode}] (length: ${setCode.length})`);

  const apiKey = process.env.POKEMON_API_KEY || '';
  console.log(`API Key length: ${apiKey.length}`);
  console.log(`API Key starts with: ${apiKey.substring(0, 5)}...`);

  try {
    // Try /sets first to see if game_id=3 is working
    console.log('Testing /sets?game_id=3...');
    const isRapidApi = apiKey.length === 50;
    const baseUrl = isRapidApi 
      ? 'https://pokemon-tcg-api.p.rapidapi.com' 
      : 'https://api.pokewallet.io';

    const headers: Record<string, string> = isRapidApi 
      ? {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'pokemon-tcg-api.p.rapidapi.com',
        }
      : {
          'X-API-Key': apiKey,
        };

    const setsResponse = await fetch(`${baseUrl}/sets?game_id=3`, { headers });
    if (setsResponse.ok) {
      const setsData = await setsResponse.json();
      console.log(`✅ /sets ok. Found ${Array.isArray(setsData) ? setsData.length : 'unknown'} sets.`);
    } else {
      console.warn(`⚠️ /sets failed: ${setsResponse.status} ${setsResponse.statusText}`);
      // Try /sets without game_id
      const setsNoId = await fetch(`${baseUrl}/sets`, { headers });
      console.log(`Testing /sets without game_id: ${setsNoId.status}`);
    }

    let prices: any;
    try {
      console.log(`Fetching ${baseUrl}/prices/${setCode}?game_id=3`);
      prices = await fetchSetPrices(setCode);
      console.log(`✅ Successfully connected to API. Found ${Object.keys(prices).length} cards.`);
    } catch (apiError: any) {
      console.warn(`⚠️ API connection failed: ${apiError.message}`);
      
      console.log(`Testing ${baseUrl}/prices/${setCode} (no game_id)...`);
      const noIdResponse = await fetch(`${baseUrl}/prices/${setCode}`, { headers });
      console.log(`Result: ${noIdResponse.status} ${noIdResponse.statusText}`);
      if (noIdResponse.ok) {
        console.log('✅ Success without game_id!');
      }

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
