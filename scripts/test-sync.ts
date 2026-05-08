import { syncPrices } from '../src/lib/sync/prices';

async function test() {
  try {
    const result = await syncPrices();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
