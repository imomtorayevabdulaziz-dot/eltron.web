#!/usr/bin/env node

const path = require('path');
const { UzumSDK } = require('./uzum');
const { WildberriesSDK } = require('./wildberries');
const Exporter = require('./storage/exporter');
const ImageDownloader = require('./storage/imageDownloader');

const uzum = new UzumSDK();
const wb = new WildberriesSDK();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
🛒 MARKETPLACE COLLECTOR CLI — Uzum Market & Wildberries API Suite
===================================================================

[UZUM MARKET BUYRUQLARI]:
1. uzum:search <query> [--limit 20] [--lang uz|ru] [--save output.json]
   Misol: node cli.js uzum:search "VGR V-030" --lang uz

2. uzum:bilingual <query> [--limit 10]
   Misol: node cli.js uzum:bilingual "VGR V-107"

3. uzum:product <productId> [--lang uz|ru]
   Misol: node cli.js uzum:product 1403916

4. uzum:shop <shopSlugOrUrl> [--out ./downloads]
   Misol: node cli.js uzum:shop "lavido"
   Misol: node cli.js uzum:shop "https://uzum.uz/uz/shop/lavido"

5. uzum:categories [searchQuery]
   Misol: node cli.js uzum:categories "texnika"

6. uzum:download-images <productId> [--out ./images]
   Misol: node cli.js uzum:download-images 1403916

-------------------------------------------------------------------
[WILDBERRIES BUYRUQLARI]:
7. wb:search <query> [--page 1] [--sort popular] [--save output.json]
   Misol: node cli.js wb:search "Триммер VGR"

8. wb:product <nmId>
   Misol: node cli.js wb:product 850556897

9. wb:seller <supplierId>
   Misol: node cli.js wb:seller 250111769

10. wb:download-images <nmId> [--out ./images]
   Misol: node cli.js wb:download-images 850556897

-------------------------------------------------------------------
[TAQQOSLASH (COMPARE)]:
11. compare <query>
   Misol: node cli.js compare "VGR V-030"
`);
    return;
  }

  const getArg = (flag, defaultValue = null) => {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) {
      return args[idx + 1];
    }
    return defaultValue;
  };

  switch (command) {
    // ================= UZUM =================
    case 'uzum:search': {
      const query = args[1];
      if (!query) return console.error('Xatolik: Qidiruv so\'zini kiriting!');
      const limit = Number(getArg('--limit', 10));
      const lang = getArg('--lang', 'uz') === 'ru' ? 'ru-RU' : 'uz-UZ';
      const savePath = getArg('--save');

      console.log(`[Uzum] Qidirilmoqda: "${query}" (Til: ${lang}, Cheklov: ${limit})...`);
      const res = await uzum.searchProducts(query, { limit, lang });
      console.log(`\nJami topildi: ${res.total} ta mahsulot (Ko'rsatilgan: ${res.items.length} ta)`);
      
      res.items.forEach((item, idx) => {
        console.log(`\n${idx + 1}. [ID: ${item.productId}] ${item.title}`);
        console.log(`   Narxi: ${item.price ? item.price.toLocaleString() + ' so\'m' : 'N/A'} | Reyting: ${item.rating || 'N/A'} (${item.feedbackCount || 0} ta sharh)`);
        console.log(`   Havola: ${item.url}`);
      });

      if (savePath) {
        Exporter.saveToJson(res, path.resolve(savePath));
        console.log(`\nNatija saqlandi: ${savePath}`);
      }
      break;
    }

    case 'uzum:shop': {
      const shopInput = args[1];
      if (!shopInput) return console.error('Xatolik: Do\'kon nomi yoki URL manzilini kiriting! (Masalan: lavido)');
      const slug = shopInput.replace(/^https?:\/\/uzum\.uz\/[a-z]+\/shop\//i, '').replace(/\/$/, '').trim();

      console.log(`[Uzum] "${slug}" do'koni ma'lumotlari va barcha mahsulotlari yig'ilmoqda...`);
      const shopInfo = await uzum.seller.getShopInfo(slug);
      console.log(`Do'kon: ${shopInfo?.title || slug} (ID: ${shopInfo?.id || 'N/A'})`);

      const result = await uzum.scrapeShop(slug, true);
      console.log(`\nJami ${result.total} ta mahsulot muvaffaqiyatli yig'ildi!`);

      const outDir = path.resolve(getArg('--out', './downloads'));
      const jsonPath = path.join(outDir, `${slug}_products.json`);
      const csvPath = path.join(outDir, `${slug}_products.csv`);

      Exporter.saveToJson(result, jsonPath);
      Exporter.saveToCsv(result.products, csvPath);

      console.log(`💾 JSON saqlandi: ${jsonPath}`);
      console.log(`💾 CSV saqlandi:  ${csvPath}`);
      break;
    }

    case 'uzum:bilingual': {
      const query = args[1];
      if (!query) return console.error('Xatolik: Qidiruv so\'zini kiriting!');
      const limit = Number(getArg('--limit', 5));

      console.log(`[Uzum] Bilingual qidiruv: "${query}"...`);
      const res = await uzum.searchBilingual(query, { limit });

      console.log(`\n--- 🇺🇿 O'ZBEKCHA NATIJALAR (${res.uz.items.length} ta) ---`);
      res.uz.items.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.title} — ${item.price ? item.price.toLocaleString() + ' so\'m' : ''}`);
      });

      console.log(`\n--- 🇷🇺 RUSCHA NATIJALAR (${res.ru.items.length} ta) ---`);
      res.ru.items.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.title} — ${item.price ? item.price.toLocaleString() + ' so\'m' : ''}`);
      });
      break;
    }

    case 'uzum:product': {
      const productId = args[1];
      if (!productId) return console.error('Xatolik: Product ID kiriting!');
      const lang = getArg('--lang', 'uz') === 'ru' ? 'ru-RU' : 'uz-UZ';

      console.log(`[Uzum] Mahsulot ma'lumotlari olinmoqda (ID: ${productId})...`);
      const prod = await uzum.getProduct(productId, lang);
      if (!prod) return console.log('Mahsulot topilmadi.');

      console.log(`\n================ MAHSULOT KARTASI (UZUM) ================`);
      console.log(`Nomi: ${prod.title}`);
      console.log(`ID: ${prod.productId}`);
      console.log(`Kategoriya: ${prod.category?.title || 'N/A'}`);
      console.log(`Reyting: ${prod.rating} (${prod.feedbackCount} sharh, ${prod.ordersCount || 0} buyurtma)`);
      console.log(`SKU variantlar soni: ${prod.skus?.length || 0}`);
      console.log(`Rasmlar soni: ${prod.images?.length || 0}`);
      if (prod.images?.length > 0) {
        console.log(`Bosh rasm: ${prod.images[0]}`);
      }
      console.log(`=========================================================\n`);
      break;
    }

    case 'uzum:categories': {
      const q = args[1] || '';
      console.log(`[Uzum] Kategoriyalar olinmoqda...`);
      const res = await uzum.getCategories(q);
      console.log(`\nTopilgan kategoriyalar soni: ${res.categories.length}`);
      res.categories.slice(0, 20).forEach((c, idx) => {
        console.log(`${idx + 1}. [ID: ${c.id}] ${c.title} (${c.totalProducts || 0} ta mahsulot)`);
      });
      break;
    }

    case 'uzum:download-images': {
      const productId = args[1];
      if (!productId) return console.error('Xatolik: Product ID kiriting!');
      const outDir = path.resolve(getArg('--out', `./downloads/uzum_prod_${productId}`));

      console.log(`[Uzum] Mahsulot rasmlari yuklab olinmoqda (ID: ${productId})...`);
      const prod = await uzum.getProduct(productId);
      if (!prod || !prod.images || prod.images.length === 0) {
        return console.log('Rasmlar topilmadi.');
      }

      console.log(`${prod.images.length} ta rasm yuklanmoqda -> ${outDir}...`);
      const batch = prod.images.map((url, i) => ({ url, name: `uzum_${productId}`, index: i + 1 }));
      const results = await ImageDownloader.downloadBatch(batch, outDir);
      console.log(`Muvaffaqiyatli yuklandi: ${results.filter(r => r.success).length}/${results.length}`);
      break;
    }

    // ================= WILDBERRIES =================
    case 'wb:search': {
      const query = args[1];
      if (!query) return console.error('Xatolik: Qidiruv so\'zini kiriting!');
      const page = Number(getArg('--page', 1));
      const sort = getArg('--sort', 'popular');
      const savePath = getArg('--save');

      console.log(`[Wildberries] Qidirilmoqda: "${query}" (Sahifa: ${page}, Saralash: ${sort})...`);
      const res = await wb.searchProducts(query, { page, sort });
      console.log(`\nJami topildi: ${res.total} ta mahsulot (Ko'rsatilgan: ${res.items.length} ta)`);

      res.items.slice(0, 15).forEach((item, idx) => {
        console.log(`\n${idx + 1}. [Artikul: ${item.id}] ${item.name} (${item.brand || 'No brand'})`);
        console.log(`   Narxi: ${item.price ? item.price.toLocaleString() + ' ' + item.currency : 'N/A'} | Sotuvchi: ${item.seller || 'N/A'}`);
        console.log(`   Reyting: ${item.rating} (${item.feedbackCount || 0} ta sharh) | Qoldiq: ${item.totalQuantity} ta`);
        console.log(`   Havola: ${item.url}`);
      });

      if (savePath) {
        Exporter.saveToJson(res, path.resolve(savePath));
        console.log(`\nNatija saqlandi: ${savePath}`);
      }
      break;
    }

    case 'wb:product': {
      const nmId = args[1];
      if (!nmId) return console.error('Xatolik: Wildberries artikul (nmId) kiriting!');

      console.log(`[Wildberries] Mahsulot ma'lumotlari olinmoqda (Artikul: ${nmId})...`);
      const prod = await wb.getProduct(nmId);
      if (!prod || !prod.name) return console.log('Mahsulot topilmadi.');

      console.log(`\n================ MAHSULOT KARTASI (WB) ================`);
      console.log(`Nomi: ${prod.name}`);
      console.log(`Artikul (nmId): ${prod.id}`);
      console.log(`Brend: ${prod.brand || 'N/A'}`);
      console.log(`Kategoriya: ${prod.category || 'N/A'}`);
      console.log(`Narxi: ${prod.price ? prod.price.toLocaleString() + ' ' + prod.currency : 'N/A'}`);
      console.log(`Sotuvchi: ${prod.seller || 'N/A'}`);
      console.log(`Reyting: ${prod.rating} (${prod.feedbackCount} ta sharh)`);
      console.log(`Rasmlar soni: ${prod.images?.length || 0}`);
      console.log(`Xususiyatlar soni: ${prod.characteristics?.length || 0}`);
      if (prod.characteristics?.length > 0) {
        console.log(`Asosiy xususiyatlar:`, prod.characteristics.slice(0, 5));
      }
      if (prod.description) {
        console.log(`Tavsif snippet: ${prod.description.slice(0, 200)}...`);
      }
      console.log(`=======================================================\n`);
      break;
    }

    case 'wb:seller': {
      const supplierId = args[1];
      if (!supplierId) return console.error('Xatolik: Supplier ID kiriting!');

      console.log(`[Wildberries] Sotuvchi ma'lumotlari olinmoqda (ID: ${supplierId})...`);
      const seller = await wb.getSeller(supplierId);
      console.log('Sotuvchi:', seller);
      break;
    }

    case 'wb:download-images': {
      const nmId = args[1];
      if (!nmId) return console.error('Xatolik: Wildberries artikul (nmId) kiriting!');
      const outDir = path.resolve(getArg('--out', `./downloads/wb_prod_${nmId}`));

      console.log(`[Wildberries] Mahsulot rasmlari yuklab olinmoqda (Artikul: ${nmId})...`);
      const prod = await wb.getProduct(nmId);
      if (!prod || !prod.images || prod.images.length === 0) {
        return console.log('Rasmlar topilmadi.');
      }

      console.log(`${prod.images.length} ta rasm yuklanmoqda -> ${outDir}...`);
      const batch = prod.images.map((url, i) => ({ url, name: `wb_${nmId}`, index: i + 1 }));
      const results = await ImageDownloader.downloadBatch(batch, outDir);
      console.log(`Muvaffaqiyatli yuklandi: ${results.filter(r => r.success).length}/${results.length}`);
      break;
    }

    // ================= COMPARE =================
    case 'compare': {
      const query = args[1];
      if (!query) return console.error('Xatolik: Qidiruv so\'zini kiriting!');

      console.log(`\n⚖️ TAQQOSLASH: "${query}" bo'yicha Uzum va Wildberries qidiruvi...\n`);
      const [uzumRes, wbRes] = await Promise.all([
        uzum.searchProducts(query, { limit: 5, lang: 'uz-UZ' }),
        wb.searchProducts(query, { page: 1 })
      ]);

      console.log(`================ 🍇 UZUM MARKET (${uzumRes.items.length} ta) ================`);
      uzumRes.items.slice(0, 3).forEach((p, i) => {
        console.log(`${i + 1}. ${p.title}`);
        console.log(`   Narxi: ${p.price ? p.price.toLocaleString() + ' so\'m' : 'N/A'} | Reyting: ${p.rating} ⭐`);
      });

      console.log(`\n================ 🟣 WILDBERRIES (${wbRes.items.length} ta) ================`);
      wbRes.items.slice(0, 3).forEach((p, i) => {
        console.log(`${i + 1}. [${p.brand || 'No brand'}] ${p.name}`);
        console.log(`   Narxi: ${p.price ? p.price.toLocaleString() + ' ' + p.currency : 'N/A'} | Reyting: ${p.rating} ⭐`);
      });
      console.log(`=================================================================\n`);
      break;
    }

    default:
      console.log(`Noma'lum buyruq: ${command}. Yordam uchun: node cli.js --help`);
  }
}

main().catch(console.error);
