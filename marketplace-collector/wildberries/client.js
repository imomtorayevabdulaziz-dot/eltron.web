const https = require('https');
const http = require('http');

class WildberriesClient {
  constructor(options = {}) {
    this.curr = options.curr || 'uzs'; // uzs, rub
    this.dest = options.dest || '-1257786'; // default dest
    this.spp = options.spp || '30';
    this.appType = options.appType || '1';
    this.lang = options.lang || 'ru';
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  }

  /**
   * Universal GET so'rovi
   */
  async get(url, params = {}) {
    const urlObj = new URL(url);
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null) {
        urlObj.searchParams.append(k, params[k]);
      }
    });

    const headers = {
      'User-Agent': this.userAgent,
      'Accept': '*/*',
      'Accept-Language': 'ru-RU,ru;q=0.9,uz;q=0.8,en;q=0.7',
      'Origin': 'https://www.wildberries.ru',
      'Referer': 'https://www.wildberries.ru/'
    };

    return new Promise((resolve, reject) => {
      const client = urlObj.protocol === 'https:' ? https : http;
      client.get(urlObj.toString(), { headers }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ data: JSON.parse(data), statusCode: res.statusCode });
          } catch (e) {
            resolve({ raw: data, statusCode: res.statusCode });
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * WB Basket raqamini hisoblash (vol bo'yicha)
   */
  getBasketNumber(vol) {
    if (vol >= 0 && vol <= 143) return '01';
    if (vol <= 287) return '02';
    if (vol <= 431) return '03';
    if (vol <= 719) return '04';
    if (vol <= 1007) return '05';
    if (vol <= 1061) return '06';
    if (vol <= 1115) return '07';
    if (vol <= 1169) return '08';
    if (vol <= 1313) return '09';
    if (vol <= 1601) return '10';
    if (vol <= 1655) return '11';
    if (vol <= 1919) return '12';
    if (vol <= 2045) return '13';
    if (vol <= 2189) return '14';
    if (vol <= 2405) return '15';
    if (vol <= 2621) return '16';
    if (vol <= 2837) return '17';
    if (vol <= 3053) return '18';
    if (vol <= 3269) return '19';
    if (vol <= 3485) return '20';
    if (vol <= 3701) return '21';
    if (vol <= 3917) return '22';
    if (vol <= 4133) return '23';
    if (vol <= 4349) return '24';
    if (vol <= 4565) return '25';
    if (vol <= 4781) return '26';
    if (vol <= 4997) return '27';
    if (vol <= 5213) return '28';
    if (vol <= 5429) return '29';
    if (vol <= 5645) return '30';
    if (vol <= 5861) return '31';
    if (vol <= 6077) return '32';
    if (vol <= 6293) return '33';
    if (vol <= 6509) return '34';
    if (vol <= 6725) return '35';
    if (vol <= 6941) return '36';
    if (vol <= 7157) return '37';
    if (vol <= 8505) return '38';
    return '39';
  }

  /**
   * Mahsulot rasmi URL manzilini yaratish
   */
  getImageUrl(nmId, index = 1, size = 'big') {
    const vol = Math.floor(nmId / 100000);
    const part = Math.floor(nmId / 1000);
    const basket = this.getBasketNumber(vol);
    return `https://basket-${basket}.wbbasket.ru/vol${vol}/part${part}/${nmId}/images/${size}/${index}.webp`;
  }

  /**
   * Mahsulot card.json URL manzilini olish
   */
  getCardJsonUrl(nmId) {
    const vol = Math.floor(nmId / 100000);
    const part = Math.floor(nmId / 1000);
    const basket = this.getBasketNumber(vol);
    return `https://basket-${basket}.wbbasket.ru/vol${vol}/part${part}/${nmId}/info/ru/card.json`;
  }
}

module.exports = WildberriesClient;
