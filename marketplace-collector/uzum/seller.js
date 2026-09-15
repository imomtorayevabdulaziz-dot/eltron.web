const UzumClient = require('./client');

const SHOP_SEARCH_QUERY = `query MakeSearch_ItemsAndFilters($queryInput: MakeSearchQueryInput!) {
  makeSearch(query: $queryInput) {
    total
    items {
      catalogCard {
        id
        productId
        title
        minSellPrice
        minFullPrice
        rating
        feedbackQuantity
        adult
        photos {
          key
          link(trans: PRODUCT_540) {
            high
            low
          }
        }
      }
    }
  }
}`;

class UzumSeller {
  constructor(client = new UzumClient()) {
    this.client = client;
  }

  /**
   * Do'kon (Shop slug) bo'yicha do'kon ma'lumotlarini olish
   * @param {string} shopSlug - Masalan: 'lavido'
   */
  async getShopInfo(shopSlug) {
    const slug = shopSlug.replace(/^https?:\/\/uzum\.uz\/[a-z]+\/shop\//i, '').replace(/\/$/, '').trim();
    const res = await this.client.restGet(`shop/${slug}`);
    if (res && res.payload) {
      return res.payload;
    }
    return null;
  }

  /**
   * Do'kondagi barcha mahsulotlarni sahifalab (pagination) to'liq yuklab olish
   * @param {number|string} shopIdOrSlug - shopId (masalan: 19851) yoki shopSlug (masalan: 'lavido')
   * @param {object} options - limitPerPage, lang, sort
   */
  async getAllShopProducts(shopIdOrSlug, options = {}) {
    const {
      limitPerPage = 48,
      lang = 'uz-UZ',
      sort = 'BY_RELEVANCE_DESC'
    } = options;

    let shopId = shopIdOrSlug;
    let shopInfo = null;

    // Agar slug berilgan bo'lsa, avval shopId ni aniqlaymiz
    if (typeof shopIdOrSlug === 'string' && isNaN(Number(shopIdOrSlug))) {
      shopInfo = await this.getShopInfo(shopIdOrSlug);
      if (!shopInfo || !shopInfo.id) {
        throw new Error(`Do'kon topilmadi: "${shopIdOrSlug}"`);
      }
      shopId = shopInfo.id;
    }

    let offset = 0;
    let allProducts = [];
    let total = 0;

    console.log(`[UzumSeller] Do'kon ID: ${shopId} bo'yicha mahsulotlar yuklanmoqda...`);

    while (true) {
      const res = await this.client.graphql('MakeSearch_ItemsAndFilters', SHOP_SEARCH_QUERY, {
        queryInput: {
          text: '',
          shopId: Number(shopId),
          showAdultContent: 'TRUE',
          filters: [],
          sort,
          pagination: { offset, limit: limitPerPage }
        }
      }, lang);

      const searchData = res.data?.makeSearch;
      if (!searchData) break;

      total = searchData.total || 0;
      const items = (searchData.items || []).map(i => {
        const card = i.catalogCard;
        return {
          id: card.id,
          productId: card.productId,
          title: card.title,
          price: card.minSellPrice ? Number(card.minSellPrice) : null,
          fullPrice: card.minFullPrice ? Number(card.minFullPrice) : null,
          rating: card.rating,
          feedbackCount: card.feedbackQuantity,
          images: (card.photos || []).map(p => p.link?.high || p.link?.low).filter(Boolean),
          isAdult: card.adult,
          url: `https://uzum.uz/${lang === 'uz-UZ' ? 'uz' : 'ru'}/product/${card.productId}`
        };
      });

      allProducts.push(...items);
      console.log(`[UzumSeller] Yuklandi: ${allProducts.length}/${total} ta mahsulot...`);

      if (allProducts.length >= total || items.length === 0) {
        break;
      }

      offset += limitPerPage;
      await new Promise(r => setTimeout(r, 100)); // Rate limit himoyasi
    }

    return {
      shopId,
      shopInfo,
      total: allProducts.length,
      products: allProducts
    };
  }

  /**
   * Do'kondagi barcha mahsulotlarni ikki tilda (UZ & RU) to'liq yig'ish
   */
  async getShopProductsBilingual(shopIdOrSlug) {
    const [uzRes, ruRes] = await Promise.all([
      this.getAllShopProducts(shopIdOrSlug, { lang: 'uz-UZ' }),
      this.getAllShopProducts(shopIdOrSlug, { lang: 'ru-RU' })
    ]);

    const ruMap = {};
    ruRes.products.forEach(p => ruMap[p.productId] = p);

    const merged = uzRes.products.map(uzItem => {
      const ruItem = ruMap[uzItem.productId] || {};
      return {
        productId: uzItem.productId,
        title_uz: uzItem.title,
        title_ru: ruItem.title || uzItem.title,
        price: uzItem.price,
        fullPrice: uzItem.fullPrice,
        rating: uzItem.rating,
        feedbackCount: uzItem.feedbackCount,
        images: uzItem.images,
        url_uz: uzItem.url,
        url_ru: ruItem.url || uzItem.url.replace('/uz/', '/ru/')
      };
    });

    return {
      shopId: uzRes.shopId,
      shopInfo: uzRes.shopInfo,
      total: merged.length,
      products: merged
    };
  }
}

module.exports = UzumSeller;
