
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import PlanSignupForm from "@/components/sections/PlanSignupForm";

import { gql } from "graphql-request";
import { shopifyClient } from "@/lib/shopify";

// Interfaces
interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
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

interface Program {
  title: string;
  price: number;
  features: string[];
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

export default function CoachingProgramsSection({
  collectionHandle = "coaching-programs",
  title = "¿Lista para Comprometerte?",
  description = "Elige el plan que mejor se adapte a tus metas. Empecemos este viaje juntas.",
  maxProducts = 10,
}: CoachingProgramsSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<Program | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const openDialog = (program: Program) => setSelectedPlan(program);
  const closeDialog = () => setSelectedPlan(null);

  const transformShopifyProducts = (products: ShopifyProduct[]): Program[] => {
    return products.map((product) => ({
      title: product.title,
      price: Math.round(parseFloat(product.priceRange.minVariantPrice.amount)),
      features: product.features?.value ? JSON.parse(product.features.value) : [],
      isPopular: product.isPopular?.value === 'true',
      isDigital: product.isDigital?.value === 'true',
      handle: product.handle,
    }));
  };

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await shopifyClient.request(COLLECTION_QUERY, {
          handle: collectionHandle,
          first: maxProducts,
        });

        const shopifyProducts = data.collection?.products?.nodes || [];
        if (shopifyProducts.length > 0) {
          setPrograms(transformShopifyProducts(shopifyProducts));
        } else {
          setPrograms(getFallbackPrograms());
        }
      } catch (err: any) {
        console.error("Error loading products:", err);
        setFetchError("No se pudieron cargar productos");
        setPrograms(getFallbackPrograms());
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [collectionHandle, maxProducts]);

  if (loading) return <LoadingSkeleton />;
  if (fetchError) return <FallbackPrograms onPlanSelect={openDialog} selectedPlan={selectedPlan} onClose={closeDialog} />;

  return (
    <>
      <section id="programs" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
              {title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:max-w-7xl lg:mx-auto">
            {programs.map((program) => (
              <Card
                key={program.handle || program.title}
                className={`flex flex-col ${program.isPopular ? "border-primary shadow-lg" : ""}`}
              >
                <CardHeader className="items-center pb-4">
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
                  <Button onClick={() => openDialog(program)} className="w-full font-bold">
                    {program.isDigital ? 'Comprar PDF' : 'Elegir Plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!selectedPlan} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedPlan && <PlanSignupForm plan={selectedPlan} onSubmitted={closeDialog} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

// GraphQL query
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

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <section id="programs" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="h-10 bg-gray-200 rounded animate-pulse mb-4 w-3/4 mx-auto"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse max-w-md mx-auto"></div>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:max-w-7xl lg:mx-auto">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col animate-pulse">
              <CardHeader className="items-center pb-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Fallback programs
function getFallbackPrograms(): Program[] {
  return [
    {
      title: "Plan de Coaching de 6 Semanas",
      price: 167,
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
      features: [
        "4 Tips para Combinar Snacks en el día",
        "10 Recetas (Pre-Entrenamiento)",
        "5 Recetas (Post-Entrenamiento)",
      ],
    },
  ];
}

// Fallback component
function FallbackPrograms({
  onPlanSelect,
  selectedPlan,
  onClose
}: {
  onPlanSelect: (program: Program) => void;
  selectedPlan: Program | null;
  onClose: () => void;
}) {
  const programs = getFallbackPrograms();

  return (
    <>
      <section id="programs" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
              ¿Lista para Comprometerte?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Elige el plan que mejor se adapte a tus metas. Empecemos este viaje juntas.
            </p>
            <p className="mt-2 text-sm text-yellow-600">
              ⚠️ Mostrando datos de respaldo. Verifica la conexión con Shopify.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:max-w-7xl lg:mx-auto">
            {programs.map((program) => (
              <Card key={program.title} className={`flex flex-col ${program.isPopular ? "border-primary shadow-lg" : ""}`}>
                <CardHeader className="items-center pb-4">
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
                  <Button onClick={() => onPlanSelect(program)} className="w-full font-bold">
                    {program.isDigital ? 'Comprar PDF' : 'Elegir Plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!selectedPlan} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedPlan && <PlanSignupForm plan={selectedPlan} onSubmitted={onClose} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

    