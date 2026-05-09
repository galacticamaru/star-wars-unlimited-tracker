
import 'dotenv/config';

async function main() {
  const key = process.env.POKEMON_API_KEY || '';
  const url = 'https://cardmarket-api-tcg.p.rapidapi.com/episodes?game=swu';
  const headers = {
    'x-rapidapi-key': key,
    'x-rapidapi-host': 'cardmarket-api-tcg.p.rapidapi.com',
  };

  const res = await fetch(url, { headers });
  console.log(`Status: ${res.status}`);
  if (res.ok) {
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } else {
    const text = await res.text();
    console.log(`Failed: ${text}`);
  }
}

main();
