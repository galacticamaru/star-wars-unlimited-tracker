
import 'dotenv/config';

async function testEndpoint(url: string, key: string, isRapid: boolean) {
  const headers: Record<string, string> = isRapid 
    ? {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'pokemon-tcg-api.p.rapidapi.com',
      }
    : {
        'X-API-Key': key,
      };

  console.log(`Testing: ${url} (Headers: ${isRapid ? 'RapidAPI' : 'Native'})`);
  try {
    const res = await fetch(url, { headers });
    console.log(`Result: ${res.status} ${res.statusText}`);
    if (res.ok) {
        const data = await res.json();
        console.log(`  Success! Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
        return true;
    } else {
        const text = await res.text();
        console.log(`  Failed: ${text.substring(0, 100)}`);
    }
  } catch (e: any) {
    console.log(`  Error: ${e.message}`);
  }
  return false;
}

async function main() {
  const key = process.env.POKEMON_API_KEY || '';
  if (!key) {
    console.error('POKEMON_API_KEY not found');
    return;
  }

  console.log(`Key length: ${key.length}`);

  const variations = [
    // Native variations
    { url: 'https://api.pokewallet.io/prices/SOR?game_id=3', isRapid: false },
    { url: 'https://api.pokewallet.io/sets?game_id=3', isRapid: false },
    
    // RapidAPI variations
    { url: 'https://pokemon-tcg-api.p.rapidapi.com/prices/SOR?game_id=3', isRapid: true },
    { url: 'https://pokemon-tcg-api.p.rapidapi.com/sets?game_id=3', isRapid: true },
    
    // Lowercase set code
    { url: 'https://api.pokewallet.io/prices/sor?game_id=3', isRapid: false },
    { url: 'https://pokemon-tcg-api.p.rapidapi.com/prices/sor?game_id=3', isRapid: true },

    // Game=swu instead of game_id=3
    { url: 'https://pokemon-tcg-api.p.rapidapi.com/prices/SOR?game=swu', isRapid: true },
    { url: 'https://pokemon-tcg-api.p.rapidapi.com/sets?game=swu', isRapid: true },

    // Cards endpoint
    { url: 'https://pokemon-tcg-api.p.rapidapi.com/cards?game_id=3&limit=1', isRapid: true },
    { url: 'https://pokemon-tcg-api.p.rapidapi.com/cards?game=swu&limit=1', isRapid: true },

    // Root /
    { url: 'https://pokemon-tcg-api.p.rapidapi.com/', isRapid: true },
  ];

  for (const v of variations) {
    const success = await testEndpoint(v.url, key, v.isRapid);
    if (success) {
      console.log('--- FOUND WORKING CONFIGURATION ---');
      console.log(`URL: ${v.url}`);
      console.log(`Headers: ${v.isRapid ? 'RapidAPI' : 'Native'}`);
      break;
    }
    console.log('---');
  }
}

main();
