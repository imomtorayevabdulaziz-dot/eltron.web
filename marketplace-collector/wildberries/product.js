const WildberriesClient = require('./client');

class WildberriesProduct {
  constructor(client = new WildberriesClient()) {
    this.client = client;
  }

  /**
   * Mahsulot ID (nmId) bo'yicha to'liq ma'lumot olish
   * @param {number|string} nmId - Wildberries artikul raqami
   */
  async getDetails(nmId) {
    const id = Number(nmId);

    // 1. Narxlar, sotuvchi va qoldiqlar (u-card API)
    const detailUrl = 'https://u-card.wb.ru/cards/v4/detail';
    const detailParams = {
      appType: this.client.appType,
      curr: this.client.curr,
      dest: this.client.dest,
      spp: this.client.spp,
      mtype: '257',
      lang: this.client.lang,
      ab_testing: 'false',
      nm: id
    };

    // 2. Tavsif va xususiyatlar (card.json)
    const cardJsonUrl = this.client.getCardJsonUrl(id);

    const [detailRes, cardJsonRes] = await Promise.all([
      this.client.get(detailUrl, detailParams).catch(() => ({ data: {} })),
      this.client.get(cardJsonUrl).catch(() => ({ data: {} }))
    ]);

    const p = detailRes.data?.products?.[0] || {};
    const c = cardJsonRes.data || {};

    const priceObj = p.sizes?.[0]?.price || {};
    const rawPrice = priceObj.product || priceObj.total || 0;
    const rawBasicPrice = priceObj.basic || 0;
    const price = rawPrice > 0 ? rawPrice / 100 : null;
    const fullPrice = rawBasicPrice > 0 ? rawBasicPrice / 100 : null;

    const photosCount = p.pics || c.media?.photo_count || 1;
    const images = [];
    for (let i = 1; i <= Math.min(photosCount, 12); i++) {
      images.push(this.client.getImageUrl(id, i));
    }

    const characteristics = (c.options || []).map(opt => ({
      name: opt.name,
      value: opt.value
    }));

    return {
      id,
      name: p.name || c.imt_name,
      slug: c.slug,
      brand: p.brand,
      brandId: p.brandId,
      category: c.subj_name || p.entity,
      rootCategory: c.subj_root_name,
      description: c.description || '',
      price,
      fullPrice,
      currency: this.client.curr.toUpperCase(),
      rating: p.reviewRating || p.rating || 0,
      feedbackCount: p.feedbacks || 0,
      seller: p.supplier,
      sellerId: p.supplierId,
      colors: (p.colors || []).map(color => color.name),
      totalQuantity: p.totalQuantity || 0,
      images,
      characteristics,
      url: `https://www.wildberries.uz/catalog/${id}/detail.aspx`
    };
  }

  /**
   * Bir nechta mahsulotlarni artikul ro'yxati (batch) bo'yicha olish
   */
  async getBatch(nmIds = []) {
    if (!nmIds || nmIds.length === 0) return [];
    const listUrl = 'https://u-card.wb.ru/cards/v4/list';
    const params = {
      appType: this.client.appType,
      curr: this.client.curr,
      dest: this.client.dest,
      spp: this.client.spp,
      lang: this.client.lang,
      nm: nmIds.join(';')
    };

    const res = await this.client.get(listUrl, params);
    const products = res.data?.products || [];

    return products.map(p => {
      const priceObj = p.sizes?.[0]?.price || {};
      const rawPrice = priceObj.product || priceObj.total || 0;
      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: rawPrice > 0 ? rawPrice / 100 : null,
        rating: p.reviewRating || p.rating,
        feedbacks: p.feedbacks,
        url: `https://www.wildberries.uz/catalog/${p.id}/detail.aspx`
      };
    });
  }
}

module.exports = WildberriesProduct;
