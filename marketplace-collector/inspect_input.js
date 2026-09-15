const UzumClient = require('./uzum/client');
const client = new UzumClient();

async function inspectInputType() {
  const query = `
    query {
      __type(name: "MakeSearchQueryInput") {
        name
        inputFields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `;
  const res = await client.graphql('InspectInput', query);
  console.log('MakeSearchQueryInput fields:');
  res.data?.__type?.inputFields?.forEach(f => {
    console.log(` - ${f.name}: ${f.type?.name || f.type?.ofType?.name || f.type?.kind}`);
  });
}

inspectInputType().catch(console.error);
