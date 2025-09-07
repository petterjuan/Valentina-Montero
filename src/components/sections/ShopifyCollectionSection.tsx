/**
 * This is a self-contained example component for a Shopify Hydrogen storefront.
 * It demonstrates how to fetch and display products from a specific collection
 * using Hydrogen's `useShopQuery` and the Storefront API.
 *
 * To use this in your Hydrogen project:
 * 1. Place this file in your components directory.
 * 2. Ensure your `hydrogen.config.ts` (or equivalent) is configured with your
 *    store domain and storefront API token.
 * 3. Import and use this component on a page, passing the desired collection
 *    handle as a prop (e.g., <ShopifyCollectionSection collectionHandle="coaching-programs" />).
 *
 * Note: This component uses UI components (`Card`, `Button`, etc.) and styles
 * from the existing project to maintain design consistency. You may need to

 * adjust imports based on your Hydrogen project's structure.
 */

import {
  gql,
  type HydrogenApiVersion,
  type Storefront,
  useShopQuery,
} from '@shopify/hydrogen';
import {Check, FileText} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Define the shape of the product data we expect from the query
interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  featuredImage: {
    url: string;
    altText: string | null;
  } | null;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  // Example of a metafield for the "Popular" badge
  isPopular?: {
    value: boolean;
  };
  // Example of metafields for features list
  features?: {
    value: string;
  };
}

// Props for our component, allowing us to specify which collection to display
interface ShopifyCollectionSectionProps {
  collectionHandle: string;
  title?: string;
  description?: string;
}

/**
 * A server component that fetches and displays products from a
 * specific collection in a Shopify store.
 */
export function ShopifyCollectionSection({
  collectionHandle,
  title = 'Descubre Nuestros Programas',
  description = 'Soluciones diseñadas para ayudarte a alcanzar tus metas de fitness y bienestar.',
}: ShopifyCollectionSectionProps) {
  // The GraphQL query to fetch collection data and its products
  const {data} = useShopQuery<Storefront<HydrogenApiVersion>>({
    query: COLLECTION_QUERY,
    variables: {
      handle: collectionHandle,
    },
    // Optional: caching strategy
    // cache: CacheLong(),
    // preload: true,
  });

  const collection = data?.collection;
  const products = collection?.products?.nodes || [];

  if (!collection) {
    return (
      <section className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <p>Colección no encontrada.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="programs" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
            {title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:max-w-7xl lg:mx-auto">
          {products.map((product: ShopifyProduct) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * A component to render a single product card.
 */
function ProductCard({product}: {product: ShopifyProduct}) {
  const price = new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: product.priceRange.minVariantPrice.currencyCode,
  }).format(parseFloat(product.priceRange.minVariantPrice.amount));

  const isDigital = product.handle.includes('pdf'); // Example logic
  const features = product.features?.value
    ? JSON.parse(product.features.value)
    : [];

  return (
    <Card
      className={`flex flex-col ${
        product.isPopular?.value ? 'border-primary shadow-lg' : ''
      }`}
    >
      <CardHeader className="items-center pb-4">
        {product.isPopular?.value && (
          <div className="mb-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            MÁS POPULAR
          </div>
        )}
        {product.featuredImage && (
          <div className="aspect-video relative w-full mb-4">
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText || product.title}
              fill
              className="object-cover rounded-t-lg"
            />
          </div>
        )}
        <CardTitle className="text-2xl font-headline text-center">
          {product.title}
        </CardTitle>
        <CardDescription className="text-center h-12">
          {product.description}
        </CardDescription>
        <div className="flex items-baseline gap-1 pt-2">
          <span className="text-4xl font-bold tracking-tight">{price}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {features.length > 0 && (
          <ul className="space-y-3 text-sm">
            {features.map((feature: string, index: number) => (
              <li key={index} className="flex items-start">
                {isDigital ? (
                  <FileText className="mr-2 mt-1 h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Check className="mr-2 mt-1 h-4 w-4 shrink-0 text-primary" />
                )}
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full font-bold">
          {/* This link should go to the product details page in a real app */}
          <Link href={`/products/${product.handle}`}>Ver Detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// GraphQL query to fetch a collection and its products.
// It also fetches metafields used for custom data like "Popular" badges or feature lists.
// To make this work, you must define these metafields in your Shopify Admin:
// 1. `custom.is_popular` (Boolean) - for the "Popular" badge
// 2. `custom.features` (JSON string) - for the features list (e.g., ["Feature 1", "Feature 2"])
const COLLECTION_QUERY = gql`
  query CollectionDetails($handle: String!) {
    collection(handle: $handle) {
      id
      title
      description
      products(first: 3) {
        nodes {
          id
          title
          handle
          description
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          # Example of a metafield for a "Popular" badge
          isPopular: metafield(namespace: "custom", key: "is_popular") {
            value
          }
          # Example of a metafield for a JSON list of features
          features: metafield(namespace: "custom", key: "features") {
            value
          }
        }
      }
    }
  }
`;
