const UzumClient = require('./uzum/client');
const client = new UzumClient();

const SEARCH_QUERY = `query MakeSearch_ItemsAndFilters($queryInput: MakeSearchQueryInput!) {
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
        photos {
          link(trans: PRODUCT_540) {
            high
            low
          }
        }
      }
    }
  }
}`;

async function testShopProducts() {
  const shopId = 19851;
  console.log(`Fetching products for Shop ID: ${shopId} (LaVIDO)...`);

  const res = await client.graphql('MakeSearch_ItemsAndFilters', SEARCH_QUERY, {
    queryInput: {
      text: '',
      shopId: shopId,
      showAdultContent: 'TRUE',
      filters: [],
      sort: 'BY_RELEVANCE_DESC',
      pagination: { offset: 0, limit: 20 }
    }
  }, 'uz-UZ');

  const data = res.data?.makeSearch;
  console.log(`\nTotal products in LaVIDO shop: ${data?.total} ta!`);
  console.log(`Fetched: ${data?.items?.length} ta mahsulot:`);

  data?.items?.forEach((i, idx) => {
    const p = i.catalogCard;
    console.log(`${idx + 1}. [ID: ${p.productId}] ${p.title} — ${p.minSellPrice ? Number(p.minSellPrice).toLocaleString() + ' so\'m' : 'N/A'}`);
  });
}

testShopProducts().catch(console.error);
