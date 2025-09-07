// /lib/shopify.ts
import { GraphQLClient } from 'graphql-request';

export const shopifyClient = new GraphQLClient(
  `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2025-07/graphql.json`,
  {
    headers: {
      'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
      'Content-Type': 'application/json',
    },
  }
);
