/**
 * LaVIDO do'konidagi barcha mahsulotlarni skraping qilish va saqlash
 * URL: https://uzum.uz/uz/shop/lavido
 */
const { UzumSDK, Exporter } = require('./index');
const path = require('path');

async function scrapeLavido() {
  const uzum = new UzumSDK();
  const shopSlug = 'lavido';

  console.log(`\n======================================================`);
  console.log(`🛒 Uzum Market: "${shopSlug}" do'koni mahsulotlarini yig'ish`);
  console.log(`======================================================\n`);

  // 1. Do'kon ma'lumotlari
  const shopInfo = await uzum.seller.getShopInfo(shopSlug);
  console.log('Do\'kon ma\'lumotlari:');
  console.log(`- Nomi: ${shopInfo?.title || 'LaVIDO'}`);
  console.log(`- Do'kon ID: ${shopInfo?.id}`);
  console.log(`- Havola: https://uzum.uz/uz/shop/${shopSlug}`);
  console.log(`- Banner: ${shopInfo?.banner || 'N/A'}`);
  console.log(`------------------------------------------------------\n`);

  // 2. Do'kondagi barcha mahsulotlarni UZ va RU tillarida skraping qilish
  const result = await uzum.scrapeShop(shopSlug, true);

  console.log(`\n✅ Skraping yakunlandi: Jami ${result.total} ta mahsulot yig'ildi!\n`);

  // Namuna ko'rsatish
  console.log('--- Dastlabki 10 ta mahsulot ---');
  result.products.slice(0, 10).forEach((p, idx) => {
    console.log(`\n${idx + 1}. [ID: ${p.productId}]`);
    console.log(`   🇺🇿 UZ: ${p.title_uz}`);
    console.log(`   🇷🇺 RU: ${p.title_ru}`);
    console.log(`   💵 Narxi: ${p.price ? p.price.toLocaleString() + ' so\'m' : 'N/A'} (Eski narx: ${p.fullPrice ? p.fullPrice.toLocaleString() + ' so\'m' : 'N/A'})`);
    console.log(`   ⭐ Reyting: ${p.rating} (${p.feedbackCount} sharh)`);
    console.log(`   🖼 Rasmlar soni: ${p.images?.length || 0}`);
    console.log(`   🔗 Havola: ${p.url_uz}`);
  });

  // 3. JSON va CSV formatida saqlash
  const dataDir = path.join(__dirname, 'downloads');
  const jsonPath = path.join(dataDir, 'lavido_products.json');
  const csvPath = path.join(dataDir, 'lavido_products.csv');

  Exporter.saveToJson(result, jsonPath);
  Exporter.saveToCsv(result.products, csvPath);

  console.log(`\n======================================================`);
  console.log(`💾 1. JSON fayl: ${jsonPath}`);
  console.log(`💾 2. CSV fayl:  ${csvPath}`);
  console.log(`======================================================\n`);
}

scrapeLavido().catch(console.error);
