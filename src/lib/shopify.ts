
// This file is for BACKEND USE ONLY, as it might handle sensitive logic,
// but the Storefront API is public-facing.

if (!process.env.SHOPIFY_STORE_DOMAIN) {
  throw new Error('SHOPIFY_STORE_DOMAIN is not set in environment variables');
}
if (!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
  throw new Error('SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set in environment variables');
}

export const shopifyStorefront = {
    request: async (query: string, { variables }: { variables?: Record<string, any> } = {}) => {
        const response = await fetch(
            `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2023-10/graphql.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
                },
                body: JSON.stringify({ query, variables }),
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Shopify request failed with status ${response.status}: ${errorBody}`);
        }

        const json = await response.json();
        if (json.errors) {
            console.error('Shopify GraphQL Errors:', json.errors);
            throw new Error('Error executing Shopify GraphQL query.');
        }

        return json.data;
    },
};
