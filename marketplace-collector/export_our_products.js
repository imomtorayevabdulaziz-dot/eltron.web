const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function exportOurProducts() {
  console.log('--- Bazadagi mahsulotlarni eksport qilish va tartibga solish boshlandi ---');

  // 1. Brand va Kategoriya lug'atlarini olish
  const { data: brands, error: bErr } = await supabase.from('brands').select('id, name');
  if (bErr) throw bErr;
  const brandMap = {};
  brands.forEach(b => brandMap[b.id] = b.name);

  const { data: categories, error: cErr } = await supabase.from('categories').select('id, name');
  if (cErr) throw cErr;
  const catMap = {};
  categories.forEach(c => catMap[c.id] = c.name);

  // 2. Barcha faol mahsulotlarni olish
  const { data: prods, error: pErr } = await supabase
    .from('products')
    .select('id, sku, brand_id, model, color_name, category_id, name, name_uz, name_ru, price, old_price, cost_price, stock, image, images')
    .eq('is_deleted', false)
    .order('category_id', { ascending: true })
    .order('model', { ascending: true });

  if (pErr) throw pErr;

  console.log(`Jami faol mahsulotlar: ${prods.length} ta`);

  // 3. Toza va tartiblangan formatga o'tkazish
  const cleanProducts = prods.map((p, index) => {
    const brandName = brandMap[p.brand_id] || 'Boshqa';
    const categoryName = catMap[p.category_id] || 'Boshqa';

    return {
      index: index + 1,
      id: p.id,
      sku: p.sku || '',
      brand: brandName,
      model: p.model || '',
      color: p.color_name || '',
      category: categoryName,
      categoryId: p.category_id,
      name_uz: p.name_uz || p.name || '',
      name_ru: p.name_ru || p.name || '',
      selling_price: Number(p.price) || 0,
      old_price: p.old_price ? Number(p.old_price) : null,
      stock: p.stock !== null && p.stock !== undefined ? Number(p.stock) : 0,
      images_count: (p.images || []).length || (p.image ? 1 : 0)
    };
  });

  // 4. Kategoriya bo'yicha guruhlash
  const byCategory = {};
  cleanProducts.forEach(p => {
    if (!byCategory[p.category]) {
      byCategory[p.category] = {
        categoryId: p.categoryId,
        categoryName: p.category,
        totalProducts: 0,
        products: []
      };
    }
    byCategory[p.category].totalProducts++;
    byCategory[p.category].products.push(p);
  });

  // 5. Saqlash
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const flatJsonPath = path.join(dataDir, 'our_products.json');
  fs.writeFileSync(flatJsonPath, JSON.stringify(cleanProducts, null, 2), 'utf-8');

  const groupedJsonPath = path.join(dataDir, 'our_products_by_category.json');
  fs.writeFileSync(groupedJsonPath, JSON.stringify(byCategory, null, 2), 'utf-8');

  console.log(`\n✅ 1. Barcha mahsulotlar ro'yxati saqlandi: ${flatJsonPath}`);
  console.log(`✅ 2. Kategoriya bo'yicha guruhlangan ro'yxat saqlandi: ${groupedJsonPath}`);

  console.log('\n--- Kategoriya statistikasi ---');
  Object.keys(byCategory).forEach(cat => {
    console.log(`- ${cat}: ${byCategory[cat].totalProducts} ta mahsulot`);
  });
}

exportOurProducts().catch(console.error);
