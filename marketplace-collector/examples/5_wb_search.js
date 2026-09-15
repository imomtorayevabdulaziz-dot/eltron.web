/**
 * Misol 5: Wildberries Marketda qidirish
 */
const { WildberriesSDK, Exporter } = require('../index');
const path = require('path');

async function run() {
  const wb = new WildberriesSDK();

  console.log('--- Wildberries: "Триммер VGR" qidiruvi ---');
  const res = await wb.searchProducts('Триммер VGR', { page: 1, sort: 'popular' });

  console.log(`Topildi: ${res.total} ta mahsulot`);
  res.items.slice(0, 10).forEach((p, i) => {
    console.log(`${i + 1}. [Artikul: ${p.id}] ${p.name} (${p.brand})`);
    console.log(`   Narxi: ${p.price ? p.price.toLocaleString() + ' ' + p.currency : 'N/A'} | Sotuvchi: ${p.seller}`);
    console.log(`   Havola: ${p.url}\n`);
  });

  const outPath = path.join(__dirname, '../downloads/wb_vgr_search.json');
  Exporter.saveToJson(res, outPath);
  console.log(`Saqlandi: ${outPath}`);
}

run().catch(console.error);
