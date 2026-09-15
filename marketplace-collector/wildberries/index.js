const WildberriesClient = require('./client');
const WildberriesSearch = require('./search');
const WildberriesProduct = require('./product');
const WildberriesSeller = require('./seller');

class WildberriesSDK {
  constructor(options = {}) {
    this.client = new WildberriesClient(options);
    this.search = new WildberriesSearch(this.client);
    this.product = new WildberriesProduct(this.client);
    this.seller = new WildberriesSeller(this.client);
  }

  /**
   * Mahsulot qidirish
   */
  async searchProducts(query, options = {}) {
    return this.search.search(query, options);
  }

  /**
   * Mahsulot kartasi va xususiyatlari
   */
  async getProduct(nmId) {
    return this.product.getDetails(nmId);
  }

  /**
   * Sotuvchi ma'lumotlari
   */
  async getSeller(supplierId) {
    return this.seller.getSellerInfo(supplierId);
  }

  /**
   * Rasm URL olish
   */
  getImageUrl(nmId, index = 1, size = 'big') {
    return this.client.getImageUrl(nmId, index, size);
  }
}

module.exports = {
  WildberriesSDK,
  WildberriesClient,
  WildberriesSearch,
  WildberriesProduct,
  WildberriesSeller,
  default: WildberriesSDK
};
