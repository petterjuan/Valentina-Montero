
// This file is for BACKEND USE ONLY, as it might handle sensitive logic,
// but the Storefront API is public-facing.

let shopifyStorefront: {
    request: (query: string, { variables }?: { variables?: Record<string, any> }) => Promise<any>;
} | null = null;

if (process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    shopifyStorefront = {
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
                    // Adding a timeout for the request
                    signal: AbortSignal.timeout(10000), 
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
} else {
    console.warn("SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN are not set. Shopify features will be disabled and the app will run in demo mode.");
}

// Export a function that returns the instance, or null if not configured
export const getShopifyStorefront = () => shopifyStorefront;
