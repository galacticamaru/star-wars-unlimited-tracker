
import 'dotenv/config';

async function main() {
  const key = process.env.POKEMON_API_KEY || '';
  const url = 'https://pokemon-tcg-api.p.rapidapi.com/episodes?game=swu';
  const headers = {
    'x-rapidapi-key': key,
    'x-rapidapi-host': 'pokemon-tcg-api.p.rapidapi.com',
  };

  const res = await fetch(url, { headers });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
