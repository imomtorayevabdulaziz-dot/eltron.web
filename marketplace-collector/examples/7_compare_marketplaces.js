/**
 * Misol 7: Uzum va Wildberries narxlarini taqqoslash
 */
const { UzumSDK, WildberriesSDK } = require('../index');

async function run() {
  const uzum = new UzumSDK();
  const wb = new WildberriesSDK();

  const model = 'VGR V-030';
  console.log(`--- Narxlarni taqqoslash: "${model}" ---\n`);

  const [uzumRes, wbRes] = await Promise.all([
    uzum.searchProducts(model, { limit: 3, lang: 'uz-UZ' }),
    wb.searchProducts(model, { page: 1 })
  ]);

  console.log('🍇 UZUM MARKET:');
  uzumRes.items.slice(0, 2).forEach(p => {
    console.log(`- ${p.title}: ${p.price ? p.price.toLocaleString() + ' so\'m' : 'N/A'}`);
  });

  console.log('\n🟣 WILDBERRIES:');
  wbRes.items.slice(0, 2).forEach(p => {
    console.log(`- ${p.name}: ${p.price ? p.price.toLocaleString() + ' ' + p.currency : 'N/A'}`);
  });
}

run().catch(console.error);
