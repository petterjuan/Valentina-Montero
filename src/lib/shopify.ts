// /lib/shopify.ts
import { GraphQLClient } from 'graphql-request';

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

if (!domain || !token) {
  console.warn("Shopify domain or token not provided. Shopify features will be disabled.");
}

export const shopifyClient = new GraphQLClient(
  `https://${domain}/api/2025-07/graphql.json`,
  {
    headers: {
      'X-Shopify-Storefront-Access-Token': token || '',
      'Content-Type': 'application/json',
    },
  }
);
