import { GraphQLClient, gql } from 'graphql-request';
import type { Program } from '@/components/sections/CoachingProgramsSection';

// Interfaces for stronger typing
interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  featuredImage?: {
    url: string;
    altText: string;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  isPopular?: { value: string };
  features?: { value: string };
  isDigital?: { value: string };
}

interface CollectionData {
  collection: {
    products: {
      nodes: ShopifyProduct[];
    };
  };
}

// Create a single, reusable client instance
let shopifyClient: GraphQLClient | null = null;

function getClient(): GraphQLClient | null {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!domain || !token) {
    console.warn("Shopify domain or token not provided. Shopify features will be disabled.");
    return null;
  }
  
  // Create client only if it doesn't exist
  if (!shopifyClient) {
    const endpoint = `https://${domain}/api/2025-07/graphql.json`;
    shopifyClient = new GraphQLClient(endpoint, {
      headers: {
        'X-Shopify-Storefront-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });
  }

  return shopifyClient;
}


const COLLECTION_QUERY = gql`
  query CollectionDetails($handle: String!, $first: Int = 10) {
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
          featuredImage {
              url(transform: {maxWidth: 600, maxHeight: 400, crop: CENTER})
              altText
          }
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

const transformShopifyProducts = (products: ShopifyProduct[]): Program[] => {
  return products.map((product) => {
    let featuresList: string[] = [];
    if (product.features?.value) {
      try {
        const parsedFeatures = JSON.parse(product.features.value);
        if (Array.isArray(parsedFeatures)) {
          featuresList = parsedFeatures;
        }
      } catch (e) {
        console.error(`Failed to parse features for product ${product.handle}:`, e);
      }
    }
    
    return {
      title: product.title,
      price: Math.round(parseFloat(product.priceRange.minVariantPrice.amount)),
      features: featuresList,
      isPopular: product.isPopular?.value === 'true',
      isDigital: product.isDigital?.value === 'true',
      handle: product.handle,
      image: product.featuredImage ? {
        src: product.featuredImage.url,
        alt: product.featuredImage.altText || product.title,
      } : undefined,
    };
  });
};

export async function getProgramsFromShopify(collectionHandle: string, maxProducts: number): Promise<Program[] | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  try {
    const data = await client.request<CollectionData>(COLLECTION_QUERY, {
      handle: collectionHandle,
      first: maxProducts,
    });
    
    const shopifyProducts = data.collection?.products?.nodes;
    if (shopifyProducts && shopifyProducts.length > 0) {
      return transformShopifyProducts(shopifyProducts);
    }
    
    // Return null if collection is empty or doesn't exist
    return null;
  } catch (err: any) {
    // Log the actual error for easier debugging
    console.error("Error loading products from Shopify:", err.message);
    return null;
  }
}
