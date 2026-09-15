const https = require('https');

function getRedirect(url) {
  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'uz-UZ,uz;q=0.9'
    }
  }, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Location:', res.headers.location);
    console.log('Headers:', res.headers);
  });
}

getRedirect('https://uzum.uz/uz/shop/lavido');
