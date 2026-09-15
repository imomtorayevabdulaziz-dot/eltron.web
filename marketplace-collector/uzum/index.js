const UzumClient = require('./client');
const UzumSearch = require('./search');
const UzumProduct = require('./product');
const UzumCategory = require('./category');
const UzumCities = require('./cities');
const UzumSeller = require('./seller');

class UzumSDK {
  constructor(options = {}) {
    this.client = new UzumClient(options);
    this.search = new UzumSearch(this.client);
    this.product = new UzumProduct(this.client);
    this.category = new UzumCategory(this.client);
    this.cities = new UzumCities(this.client);
    this.seller = new UzumSeller(this.client);
  }

  /**
   * Qidiruv
   */
  async searchProducts(query, options = {}) {
    return this.search.search(query, options);
  }

  /**
   * Ikki tilda qidiruv
   */
  async searchBilingual(query, options = {}) {
    return this.search.searchBilingual(query, options);
  }

  /**
   * Mahsulot kartasi
   */
  async getProduct(productId, lang = 'uz-UZ') {
    return this.product.getDetails(productId, lang);
  }

  /**
   * Kategoriyalar
   */
  async getCategories(text = '', lang = 'uz-UZ') {
    return this.category.getCategoryTree(text, lang);
  }

  /**
   * Do'kondagi barcha mahsulotlarni skraping qilish
   */
  async scrapeShop(shopSlugOrId, bilingual = true) {
    if (bilingual) {
      return this.seller.getShopProductsBilingual(shopSlugOrId);
    }
    return this.seller.getAllShopProducts(shopSlugOrId);
  }
}

module.exports = {
  UzumSDK,
  UzumClient,
  UzumSearch,
  UzumProduct,
  UzumCategory,
  UzumCities,
  UzumSeller,
  default: UzumSDK
};
