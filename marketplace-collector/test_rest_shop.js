const UzumClient = require('./uzum/client');
const client = new UzumClient();

const endpoints = [
  'main/seller/lavido',
  'main/shops/lavido',
  'main/shop/lavido',
  'v2/shops/lavido',
  'v2/shop/lavido',
  'v2/seller/lavido',
  'seller/lavido',
  'shop/lavido',
  'main/seller?slug=lavido',
  'main/shop?slug=lavido'
];

async function testEndpoints() {
  for (const ep of endpoints) {
    try {
      const res = await client.restGet(ep, {}, 'uz-UZ');
      console.log(`Endpoint: ${ep} -> Status/Data:`, JSON.stringify(res).slice(0, 150));
    } catch (e) {
      console.log(`Endpoint: ${ep} -> Error: ${e.message}`);
    }
  }
}

testEndpoints().catch(console.error);
