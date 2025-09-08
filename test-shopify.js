// test-shopify.js
import 'dotenv/config';
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient(
  `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2025-07/graphql.json`,
  {
    headers: {
      'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
  }
);

const COLLECTION_QUERY = gql`
  query CollectionWithProducts($handle: String!, $first: Int = 10) {
    collection(handle: $handle) {
      id
      title
      description
      products(first: $first) {
        nodes {
          id
          title
          handle
          description
          availableForSale
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          isPopular: metafield(namespace: "custom", key: "is_popular") {
            value
          }
          features: metafield(namespace: "custom", key: "features") {
            value
          }
          isDigital: metafield(namespace: "custom", key: "is_digital") {
            value
          }
        }
      }
    }
  }
`;

async function fetchCollection() {
  try {
    const data = await client.request(COLLECTION_QUERY, {
      handle: 'coaching-programs', // your collection handle
      first: 10,
    });
    console.log('✅ Collection & Products fetched successfully:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Shopify connection failed:', err);
  }
}

fetchCollection();
