
import 'dotenv/config';

async function main() {
  const key = process.env.POKEMON_API_KEY || '';
  const url = 'https://pokemon-tcg-api.p.rapidapi.com/star-wars/episodes';
  const headers = {
    'x-rapidapi-key': key,
    'x-rapidapi-host': 'pokemon-tcg-api.p.rapidapi.com',
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
