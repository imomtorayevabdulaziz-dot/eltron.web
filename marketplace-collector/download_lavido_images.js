const fs = require('fs');
const path = require('path');
const ImageDownloader = require('./storage/imageDownloader');

async function downloadFirstImages() {
  const jsonPath = path.join(__dirname, 'downloads/lavido_products.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const outputDir = path.join(__dirname, 'downloads/lavido_images');

  console.log(`Downloading 1st images for ${data.products.length} products...`);

  const batch = [];
  data.products.forEach((p, idx) => {
    if (p.images && p.images.length > 0) {
      const padIndex = String(idx + 1).padStart(2, '0');
      batch.push({
        url: p.images[0],
        name: `${padIndex}_ID_${p.productId}`,
        index: 1
      });
    }
  });

  const results = await ImageDownloader.downloadBatch(batch, outputDir, 6);
  const successCount = results.filter(r => r.success).length;
  console.log(`\n✅ Downloaded ${successCount}/${data.products.length} images to ${outputDir}`);
}

downloadFirstImages().catch(console.error);
