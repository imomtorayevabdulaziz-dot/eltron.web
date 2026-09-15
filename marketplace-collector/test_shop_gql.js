const UzumClient = require('./uzum/client');
const client = new UzumClient();

async function testShopQueries() {
  console.log('--- Testing Shop queries on Uzum GraphQL ---');

  // Test 1: Introspect query fields related to shop/seller
  const INTROSPECT = `
    query {
      __schema {
        queryType {
          fields {
            name
            args {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    }
  `;
  const res1 = await client.graphql('Introspect', INTROSPECT);
  const fields = res1.data?.__schema?.queryType?.fields || [];
  const relevant = fields.filter(f => f.name.toLowerCase().includes('shop') || f.name.toLowerCase().includes('seller') || f.name.toLowerCase().includes('search') || f.name.toLowerCase().includes('vendor'));
  console.log('Relevant GraphQL fields:');
  relevant.forEach(f => {
    console.log(` - ${f.name}(${f.args.map(a => `${a.name}: ${a.type?.name || a.type?.kind}`).join(', ')})`);
  });

  // Test 2: makeSearch with shop/seller filter
  const SEARCH_QUERY = `query MakeSearch_ItemsAndFilters($queryInput: MakeSearchQueryInput!) {
    makeSearch(query: $queryInput) {
      total
      facets {
        filter {
          id
          title
        }
        buckets {
          filterValue {
            id
            name
          }
          total
        }
      }
      items {
        catalogCard {
          id
          productId
          title
        }
      }
    }
  }`;

  // Try text "lavido"
  const res2 = await client.graphql('MakeSearch_ItemsAndFilters', SEARCH_QUERY, {
    queryInput: {
      text: 'lavido',
      showAdultContent: 'TRUE',
      filters: [],
      sort: 'BY_RELEVANCE_DESC',
      pagination: { offset: 0, limit: 10 }
    }
  });

  console.log('\nMakeSearch for "lavido": Total =', res2.data?.makeSearch?.total);
  if (res2.data?.makeSearch?.facets) {
    console.log('Facets found:');
    res2.data.makeSearch.facets.forEach(fc => {
      console.log(`  Filter: ${fc.filter.title} (ID: ${fc.filter.id}), Buckets count: ${fc.buckets?.length}`);
      if (fc.filter.title?.toLowerCase().includes('do\'kon') || fc.filter.title?.toLowerCase().includes('sotuvchi') || fc.filter.title?.toLowerCase().includes('shop')) {
        console.log('  Shop bucket values:', fc.buckets);
      }
    });
  }
}

testShopQueries().catch(console.error);
