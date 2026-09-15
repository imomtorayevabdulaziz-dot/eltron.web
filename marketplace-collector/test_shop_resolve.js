const UzumClient = require('./uzum/client');
const client = new UzumClient();

const shopQueries = [
  'shop(slug: "lavido") { id title }',
  'shop(name: "lavido") { id title }',
  'shop(title: "lavido") { id title }',
  'shop(shopName: "lavido") { id title }',
  'getShop(slug: "lavido") { id title }',
  'seller(slug: "lavido") { id title }',
  'seller(name: "lavido") { id title }',
  'getSuggestions(query: { text: "lavido" }) { suggestions { ... on ShopSuggestion { id title } } }'
];

async function testShopQueries() {
  for (const q of shopQueries) {
    const query = `query { ${q} }`;
    const res = await client.graphql('TestShop', query);
    console.log(`Query: ${q}`);
    console.log('Result:', JSON.stringify(res).slice(0, 200));
  }
}

testShopQueries().catch(console.error);
