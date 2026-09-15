# 🛒 Marketplace Collector — Uzum Market & Wildberries API Suite

Uzum Market va Wildberries marketplace-laridan mahsulotlar ma'lumotlarini qidirish, yig'ish, tahlil qilish, narxlarni taqqoslash va eksport qilish uchun to'liq mustaqil Node.js API to'plami va CLI vositasi.

> **Eslatma:** Ushbu modul asosiy vebsayt kodlariga daxlsiz bo'lib, `instagram shop` loyihasi ichida alohida mustaqil vosita sifatida ishlaydi.

---

## 📁 Loyiha tuzilishi

```text
marketplace-collector/
├── package.json               # Modul konfiguratsiyasi
├── README.md                  # Qo'llanma va hujjatlar
├── index.js                   # Asosiy SDK (Uzum va Wildberries)
├── config.js                  # API manzillari, tokenlar va sozlamalar
├── cli.js                     # Konsol (CLI) interfeysi
├── uzum/                      # Uzum Market API modullari
│   ├── client.js              # Uzum GraphQL va REST HTTP mijoz
│   ├── search.js              # Qidiruv, filtrlar va bilingual qidiruv
│   ├── product.js             # Mahsulot kartasi, tavsif, rasmlar, SKU va narxlar
│   ├── category.js            # Kategoriya daraxti va toifa bo'yicha mahsulotlar
│   └── cities.js              # Shaharlar va topshirish punktlari (PVZ)
├── wildberries/               # Wildberries API modullari
│   ├── client.js              # WB HTTP mijoz (Basket va rasm hisoblagich)
│   ├── search.js              # WB qidiruv (UZS / RUB, saralash, filtrlar)
│   ├── product.js             # WB mahsulot kartasi, card.json, barcha xususiyatlar
│   └── seller.js              # WB sotuvchi va brend ma'lumotlari
├── storage/
│   ├── exporter.js            # JSON va CSV formatida saqlash
│   └── imageDownloader.js     # Mahsulot rasmlarini parallel yuklab olish
├── examples/                  # Ishga tushirish uchun tayyor namunalar
│   ├── 1_uzum_search.js       # Uzum qidiruv va JSON eksport
│   ├── 2_uzum_product_detail.js # Uzum mahsulot kartasi ma'lumotlari
│   ├── 3_uzum_categories.js   # Uzum toifalar daraxti
│   ├── 4_bilingual_collector.js # Ikki tilda (UZ & RU) qidiruv va CSV eksport
│   ├── 5_wb_search.js         # Wildberries qidiruv
│   ├── 6_wb_product_detail.js # Wildberries mahsulot kartasi va barcha xarakteristikalari
│   └── 7_compare_marketplaces.js # Uzum va WB narxlarini taqqoslash
└── downloads/                 # Yuklangan ma'lumotlar va rasmlar
```

---

## 🚀 Ishlatish bo'yicha qo'llanma

### 1. Dasturiy tarzda (Node.js SDK):

```javascript
const { UzumSDK, WildberriesSDK, Exporter } = require('./marketplace-collector');

const uzum = new UzumSDK();
const wb = new WildberriesSDK();

async function run() {
  // 1. Uzum Marketda qidiruv (O'zbek tilida)
  const uzumRes = await uzum.searchProducts('VGR V-030', { limit: 10, lang: 'uz-UZ' });
  console.log(uzumRes.items);

  // 2. Wildberriesda qidiruv (UZS valyutasida)
  const wbRes = await wb.searchProducts('VGR V-030');
  console.log(wbRes.items);

  // 3. Wildberries mahsulotining barcha texnik xususiyatlarini olish
  const wbProduct = await wb.getProduct(850556897);
  console.log(wbProduct.name, wbProduct.characteristics, wbProduct.images);

  // 4. Uzum va WB narxlarini taqqoslash
  console.log('Uzum narxi:', uzumRes.items[0]?.price);
  console.log('WB narxi:', wbRes.items[0]?.price);
}

run();
```

---

### 2. CLI (Buyruqlar paneli) orqali:

Loyihaning `marketplace-collector` papkasida turib:

#### 🍇 Uzum Market:
```bash
# Qidiruv
node cli.js uzum:search "VGR V-107" --lang uz --limit 10

# Ikki tilda (UZ & RU) parallel qidirish
node cli.js uzum:bilingual "VGR V-030"

# Mahsulot kartasi
node cli.js uzum:product 1403916

# Mahsulot rasmlarini to'liq yuklab olish
node cli.js uzum:download-images 1403916 --out ./downloads/vgr_images
```

#### 🟣 Wildberries:
```bash
# Qidiruv (O'zbekiston / UZS)
node cli.js wb:search "Триммер VGR"

# Mahsulotning to'liq kartasi va xususiyatlari (Artikul bo'yicha)
node cli.js wb:product 850556897

# WB sotuvchisi haqida ma'lumot
node cli.js wb:seller 250111769

# WB mahsulot rasmlarini yuklab olish
node cli.js wb:download-images 850556897 --out ./downloads/wb_photos
```

#### ⚖️ Taqqoslash (Compare):
```bash
node cli.js compare "VGR V-030"
```
