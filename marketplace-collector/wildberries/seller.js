const WildberriesClient = require('./client');

class WildberriesSeller {
  constructor(client = new WildberriesClient()) {
    this.client = client;
  }

  /**
   * Sotuvchi (Supplier) haqida ma'lumot olish
   * @param {number|string} supplierId 
   */
  async getSellerInfo(supplierId) {
    const url = `https://suppliers-shipment-2.wildberries.ru/api/v1/suppliers/${supplierId}?curr=UZS`;
    const res = await this.client.get(url);
    const s = res.data || {};

    return {
      id: s.id,
      name: s.name || s.fullName,
      rating: s.rating,
      valuation: s.valuation,
      feedbackCount: s.feedbacksCount,
      registrationDate: s.registrationDate,
      hasLogo: s.hasLogo,
      hasBanner: s.hasBanner
    };
  }

  /**
   * Brend ma'lumotlari
   */
  async getBrandInfo(brandId) {
    const url = `https://static-basket-01.wbbasket.ru/vol0/data/brands-by-id/${brandId}.json`;
    const res = await this.client.get(url);
    return res.data || null;
  }
}

module.exports = WildberriesSeller;
