const WildberriesClient = require('./client');

class WildberriesSearch {
  constructor(client = new WildberriesClient()) {
    this.client = client;
  }

  /**
   * Wildberries katalogida qidiruv
   * @param {string} query - Qidiruv so'zi
   * @param {object} options - page, sort, curr, dest
   */
  async search(query, options = {}) {
    const {
      page = 1,
      sort = 'popular', // popular, priceup, pricedown, rate, benefit, newly
      curr = this.client.curr,
      dest = this.client.dest,
      spp = this.client.spp
    } = options;

    const url = 'https://search.wb.ru/exactmatch/ru/common/v7/search';
    const params = {
      ab_testing: 'false',
      appType: this.client.appType,
      curr,
      dest,
      query,
      resultset: 'catalog',
      sort,
      spp,
      suppressSpellcheck: 'false',
      page
    };

    const res = await this.client.get(url, params);
    const data = res.data || {};
    const products = data.products || [];

    const items = products.map(p => {
      const priceObj = p.sizes?.[0]?.price || {};
      const rawPrice = priceObj.product || priceObj.total || 0;
      const rawBasicPrice = priceObj.basic || 0;

      // In UZS, WB prices are divided by 100
      const price = rawPrice > 0 ? (curr.toLowerCase() === 'uzs' ? rawPrice / 100 : rawPrice / 100) : null;
      const fullPrice = rawBasicPrice > 0 ? (curr.toLowerCase() === 'uzs' ? rawBasicPrice / 100 : rawBasicPrice / 100) : null;

      const photosCount = p.pics || 1;
      const images = [];
      for (let i = 1; i <= Math.min(photosCount, 5); i++) {
        images.push(this.client.getImageUrl(p.id, i));
      }

      return {
        id: p.id,
        rootId: p.root,
        name: p.name,
        brand: p.brand,
        brandId: p.brandId,
        seller: p.supplier,
        sellerId: p.supplierId,
        sellerRating: p.supplierRating,
        price,
        fullPrice,
        currency: curr.toUpperCase(),
        rating: p.reviewRating || p.rating,
        feedbackCount: p.feedbacks,
        colors: (p.colors || []).map(c => c.name),
        images,
        totalQuantity: p.totalQuantity || 0,
        url: `https://www.wildberries.ru/catalog/${p.id}/detail.aspx`
      };
    });

    return {
      query,
      total: data.total || items.length,
      page,
      count: items.length,
      items
    };
  }
}

module.exports = WildberriesSearch;
