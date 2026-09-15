/**
 * Misol 6: Wildberries mahsulot kartasi va xususiyatlarini olish
 */
const { WildberriesSDK } = require('../index');

async function run() {
  const wb = new WildberriesSDK();

  const nmId = 850556897; // VGR Epilyator V-739
  console.log(`--- Wildberries: Mahsulot kartasi (Artikul: ${nmId}) ---`);

  const prod = await wb.getProduct(nmId);
  console.log('Nomi:', prod.name);
  console.log('Brend:', prod.brand);
  console.log('Kategoriya:', prod.category);
  console.log('Narxi:', prod.price ? prod.price.toLocaleString() + ' ' + prod.currency : 'N/A');
  console.log('Sotuvchi:', prod.seller);
  console.log('Rasmlar soni:', prod.images?.length);
  console.log('Xususiyatlar:', prod.characteristics);
  console.log('Tavsif snippet:', prod.description?.slice(0, 200));
}

run().catch(console.error);
