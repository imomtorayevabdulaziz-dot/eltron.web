const UzumClient = require('./uzum/client');
const client = new UzumClient();

const testVars = [
  { shopId: 100 },
  { sellerId: 100 },
  { shop: 'lavido' },
  { shopSlug: 'lavido' },
  { sellerSlug: 'lavido' },
  { vendor: 'lavido' }
];

async function testVariables() {
  const SEARCH_QUERY = `query MakeSearch_ItemsAndFilters($queryInput: MakeSearchQueryInput!) {
    makeSearch(query: $queryInput) {
      total
      items {
        catalogCard {
          id
          title
        }
      }
    }
  }`;

  for (const v of testVars) {
    const key = Object.keys(v)[0];
    const res = await client.graphql('MakeSearch_ItemsAndFilters', SEARCH_QUERY, {
      queryInput: {
        text: '',
        ...v,
        showAdultContent: 'TRUE',
        filters: [],
        sort: 'BY_RELEVANCE_DESC',
        pagination: { offset: 0, limit: 5 }
      }
    });

    if (res.data?.makeSearch) {
      console.log(`+ ACCEPTED FIELD: ${key} -> Total items: ${res.data.makeSearch.total}`);
    } else {
      console.log(`- REJECTED: ${key} -> ${res.errors?.[0]?.message}`);
    }
  }
}

testVariables().catch(console.error);
