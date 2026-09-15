const https = require('https');
const { UzumSDK } = require('./index');

const uzum = new UzumSDK();

function fetchHtml(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'uz-UZ,uz;q=0.9,ru;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, html: data });
      });
    }).on('error', (e) => resolve({ status: 500, error: e.message }));
  });
}

async function test() {
  console.log('1. Fetching shop HTML...');
  const { status, html } = await fetchHtml('https://uzum.uz/uz/shop/lavido');
  console.log('Status:', status, 'Length:', html?.length);

  if (html) {
    const fs = require('fs');
    fs.writeFileSync('downloads/lavido_page.html', html, 'utf-8');
    
    // Find all JSON strings or patterns
    const idMatches = html.match(/"id":\s*(\d+)|"shopId":\s*(\d+)|"sellerId":\s*(\d+)|"seller":\s*\{[^}]+\}/g) || [];
    console.log('ID Matches:', idMatches.slice(0, 10));

    // Check for title or meta
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    console.log('Title:', titleMatch ? titleMatch[1] : 'N/A');
  }

  // 2. Also test search with shop name "lavido"
  console.log('\n2. Searching "lavido" via Uzum GraphQL...');
  const searchRes = await uzum.searchProducts('lavido', { limit: 10 });
  console.log('Found products for query "lavido":', searchRes.total);
  searchRes.items.forEach((p, i) => {
    console.log(`${i+1}. [ID: ${p.productId}] ${p.title} — ${p.price?.toLocaleString()} so'm`);
  });
}

test().catch(console.error);
