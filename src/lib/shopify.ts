// /lib/shopify.ts
import { GraphQLClient } from "graphql-request";

// Construye el endpoint de la Storefront API usando variables de entorno
const endpoint = process.env.SHOPIFY_STORE_DOMAIN
  ? `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`
  : "";

// Inicializa el cliente GraphQL con las credenciales
export const shopifyClient = new GraphQLClient(endpoint, {
  headers: {
    "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "",
    "Content-Type": "application/json",
  },
});
