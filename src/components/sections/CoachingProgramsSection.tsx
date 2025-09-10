
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { gql } from "graphql-request";
import { shopifyClient } from "@/lib/shopify";
import PlanSignupDialog from "@/components/sections/PlanSignupDialog";
import Image from "next/image";

// Interfaces
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

export interface Program {
  title: string;
  price: number;
  features: string[];
  image?: {
    src: string;
    alt: string;
  };
  isPopular?: boolean;
  isDigital?: boolean;
  handle?: string;
}

interface CoachingProgramsSectionProps {
  collectionHandle?: string;
  title?: string;
  description?: string;
  maxProducts?: number;
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

function getFallbackPrograms(): Program[] {
  return [
    {
      title: "Plan de Coaching de 6 Semanas",
      price: 167,
      image: { src: "https://picsum.photos/seed/p1/600/400", alt: "Plan de 6 semanas" },
      features: [
        "Plan de entrenamiento personalizado",
        "Seguimiento de progreso quincenal",
        "Guía de nutrición y macros",
        "Soporte 24/7 para preguntas",
        "Enfoque en mentalidad y motivación",
      ],
    },
    {
      title: "Plan de Coaching de 12 Semanas",
      price: 267,
      isPopular: true,
      image: { src: "https://picsum.photos/seed/p2/600/400", alt: "Plan de 12 semanas" },
      features: [
        "Todo lo del plan de 6 semanas",
        "+ Mini Guía de Suplementos y Vitaminas",
        "Seguimiento avanzado del progreso",
        "Sugerencias de comidas personalizadas",
        "Sesión de estrategia al final del plan",
      ],
    },
    {
      title: 'Muscle Bites',
      price: 25,
      isDigital: true,
      image: { src: "https://picsum.photos/seed/p3/600/400", alt: "Guía Muscle Bites" },
      features: [
        "4 Tips para Combinar Snacks en el día",
        "10 Recetas (Pre-Entrenamiento)",
        "5 Recetas (Post-Entrenamiento)",
      ],
    },
  ];
}

const transformShopifyProducts = (products: ShopifyProduct[]): Program[] => {
  return products.map((product) => {
    let featuresList = [];
    if (product.features?.value) {
        try {
            featuresList = JSON.parse(product.features.value);
        } catch (e) {
            console.error(`Failed to parse features for product ${product.handle}:`, e);
            featuresList = [];
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

async function getProgramsFromShopify(collectionHandle: string, maxProducts: number): Promise<Program[] | null> {
    if (!shopifyClient) {
        console.warn("Shopify client not available. Skipping fetch.");
        return null;
    }
    try {
        const data = await shopifyClient.request<{ collection: { products: { nodes: ShopifyProduct[] } } }>(COLLECTION_QUERY, {
          handle: collectionHandle,
          first: maxProducts,
        });

        const shopifyProducts = data.collection?.products?.nodes;
        if (shopifyProducts && shopifyProducts.length > 0) {
          return transformShopifyProducts(shopifyProducts);
        }
        return null;
    } catch (err: any) {
        console.error("Error loading products from Shopify:", err.message);
        return null;
    }
}


export default async function CoachingProgramsSection({
  collectionHandle = "coaching-programs",
  title = "¿Lista para Comprometerte?",
  description = "Elige el plan que mejor se adapte a tus metas. Empecemos este viaje juntas.",
  maxProducts = 10,
}: CoachingProgramsSectionProps) {
  
  let programs = await getProgramsFromShopify(collectionHandle, maxProducts);
  let usingFallback = false;

  if (!programs) {
    programs = getFallbackPrograms();
    usingFallback = true;
  }

  return (
    <section id="programs" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
            {title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          {usingFallback && (
              <p className="mt-2 text-sm text-yellow-600">
                ⚠️ Mostrando datos de respaldo. Verifica la conexión con Shopify.
              </p>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:max-w-7xl lg:mx-auto">
          {programs.map((program) => (
            <Card
              key={program.handle || program.title}
              className={`flex flex-col ${program.isPopular ? "border-primary shadow-lg" : ""}`}
            >
              <CardHeader className="p-0">
                 {program.image && (
                    <div className="aspect-video relative w-full overflow-hidden rounded-t-lg">
                        <Image 
                            src={program.image.src}
                            alt={program.image.alt}
                            fill
                            className="object-cover"
                        />
                    </div>
                 )}
                <div className="p-6 items-center flex flex-col">
                    {program.isPopular && (
                      <div className="mb-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        MÁS POPULAR
                      </div>
                    )}
                    <CardTitle className="text-2xl font-headline text-center">{program.title}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight">${program.price}</span>
                      {!program.isDigital && <span className="text-sm font-semibold text-muted-foreground">/ plan</span>}
                    </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {program.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="mr-2 mt-1 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                 <PlanSignupDialog program={program}>
                    <Button className="w-full font-bold">
                        {program.isDigital ? 'Comprar PDF' : 'Elegir Plan'}
                    </Button>
                 </PlanSignupDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
