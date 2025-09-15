
"use server";

import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput, GeneratePersonalizedWorkoutOutput } from "@/ai/flows/generate-personalized-workout";
import { processPlanSignup, PlanSignupInput } from "@/ai/flows/plan-signup-flow";
import { z } from "zod";
import { Post, Testimonial, PostDocument, TestimonialDocument } from "@/types";
import { getFirestore } from "@/lib/firebase";
import { Program } from "@/components/sections/CoachingProgramsSection";
import connectToDb from "@/lib/mongoose";
import PostModel from "@/models/Post";
import TestimonialModel from "@/models/Testimonial";
import crypto from 'crypto';

// Schemas
const aiGeneratorSchema = z.object({
  fitnessGoal: z.string().min(1, "El objetivo de fitness es requerido"),
  experienceLevel: z.string().min(1, "El nivel de experiencia es requerido"),
  equipment: z.string().min(1, "El equipo disponible es requerido"),
  duration: z.number().min(1, "La duración debe ser mayor a 0"),
  frequency: z.number().min(1, "La frecuencia debe ser mayor a 0"),
});

const leadSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
});

// Types
export type AiGeneratorFormState = {
  data?: GeneratePersonalizedWorkoutOutput;
  error?: string;
  inputs?: z.infer<typeof aiGeneratorSchema>;
};

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

interface ShopifyCollectionResponse {
  data?: {
    collection?: {
      id: string;
      title: string;
      description: string;
      products: {
        nodes: ShopifyProduct[];
      };
    };
  };
  errors?: Array<{ message: string; [key: string]: any }>;
}

// GraphQL Query
const COLLECTION_QUERY = /* GraphQL */`
  query CollectionDetails($handle: String!, $first: Int!) {
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

// Helper functions
const transformShopifyProducts = (products: ShopifyProduct[]): Program[] => {
  return products.map((product) => {
    let featuresList: string[] = [];
    if (product.features?.value) {
      try {
        const parsedFeatures = JSON.parse(product.features.value);
        if (Array.isArray(parsedFeatures)) {
          featuresList = parsedFeatures
            .filter((f): f is string => typeof f === 'string')
            .map(f => f.trim())
            .filter(Boolean);
        }
      } catch (error) {
        featuresList = product.features.value
          .split(",")
          .map(f => f.trim())
          .filter(Boolean);
      }
    }
    
    return {
      title: product.title,
      price: Math.round(parseFloat(product.priceRange.minVariantPrice.amount)),
      features: featuresList,
      isPopular: product.isPopular?.value?.toLowerCase() === 'true',
      isDigital: product.isDigital?.value?.toLowerCase() === 'true',
      handle: product.handle,
      image: product.featuredImage ? {
        src: product.featuredImage.url,
        alt: product.featuredImage.altText || product.title,
      } : undefined,
    };
  });
};

const normalizeMongoDoc = (doc: any): any => {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: _id.toString(), ...rest };
};


// Server Actions
export async function handleAiGeneration(input: GeneratePersonalizedWorkoutInput): Promise<AiGeneratorFormState> {
  try {
    const validatedInput = aiGeneratorSchema.parse(input);
    
    const result = await generatePersonalizedWorkout(validatedInput);
    
    if (!result) {
      return { error: "No se pudo generar el entrenamiento. Por favor, inténtalo de nuevo." };
    }
    
    return { data: result, inputs: validatedInput };
  } catch (error) {
    console.error("Error in handleAiGeneration:", error);
    
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        error: firstError?.message || "Los datos de entrada no son válidos. Por favor, revisa el formulario." 
      };
    }
    
    return { 
      error: "No se pudo generar el contenido. Por favor, inténtalo de nuevo más tarde." 
    };
  }
}

export async function handlePlanSignup(input: PlanSignupInput) {
  try {
    if (!input) {
      return { data: null, error: "Los datos de entrada son requeridos." };
    }
    
    const result = await processPlanSignup(input);
    return { data: result, error: null };
  } catch (error) {
    console.error("Error in handlePlanSignup:", error);
    
    const isStripeError = error instanceof Error && error.message.includes("STRIPE_NOT_CONFIGURED");
    if (isStripeError) {
      return { 
        data: null, 
        error: "El sistema de pagos aún no está configurado. Por favor, inténtalo más tarde." 
      };
    }
    
    return { 
      data: null, 
      error: "Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo." 
    };
  }
}

export async function handleLeadSubmission(formData: { email: string }) {
  try {
    const { email } = leadSchema.parse(formData);

    const firestore = getFirestore();
    if (!firestore) {
      console.error("Firestore not configured");
      return { success: false, message: "Servicio temporalmente no disponible. Por favor, inténtalo más tarde." };
    }

    const now = new Date();
    const safeId = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
    const leadRef = firestore.collection("leads").doc(safeId);
    const existingLead = await leadRef.get();

    const existed = typeof (existingLead as any).exists === "function"
        ? (existingLead as any).exists()
        : !!(existingLead as any).exists;

    const leadData = {
      email,
      source: "Guía Gratuita - 10k Pasos",
      status: "subscribed",
      updatedAt: now,
      ...(existed ? {} : { createdAt: now }),
    };

    await leadRef.set(leadData, { merge: true });

    return {
      success: true,
      message: existed ? "Ya estás suscrito. Tu guía está en camino." : "¡Éxito! Tu guía está en camino.",
    };
  } catch (error) {
    console.error("Error in handleLeadSubmission:", error instanceof Error ? error.stack : String(error));
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0]?.message || "Email inválido." };
    }
    return { success: false, message: "Hubo un problema con tu solicitud. Por favor, inténtalo de nuevo." };
  }
}

// Data Fetching Actions
export async function getBlogPosts(limit?: number): Promise<Post[]> {
    try {
        await connectToDb();
        const validLimit = Math.min(Math.max(limit || 20, 1), 100);
        const posts = await PostModel.find({})
            .sort({ createdAt: -1 })
            .limit(validLimit)
            .lean()
            .exec();
        
        if (!posts || posts.length === 0) return [];
        
        return posts.map(post => {
            const { _id, ...rest } = post;
            return { id: _id.toString(), ...rest } as Post;
        });

    } catch (error) {
        console.error("Error fetching blog posts:", error instanceof Error ? error.stack : String(error));
        return [];
    }
}

export async function getBlogPostBySlug(slug: string): Promise<Post | null> {
    try {
        if (!slug || typeof slug !== 'string') {
            console.warn(`Invalid or empty slug provided: ${slug}`);
            return null;
        }
        
        await connectToDb();
        
        const post = await PostModel.findOne({ slug }).lean().exec();

        if (!post) {
            console.warn(`No post found for slug: ${slug}`);
            return null;
        }
        
        const { _id, ...rest } = post;
        return { id: _id.toString(), ...rest } as Post;

    } catch (error) {
        console.error(`Error fetching post by slug "${slug}":`, error instanceof Error ? error.stack : String(error));
        return null;
    }
}

export async function getTestimonials(): Promise<Testimonial[]> {
    try {
        await connectToDb();
        const testimonials: TestimonialDocument[] = await TestimonialModel.find({})
            .sort({ order: 1 })
            .limit(10)
            .lean()
            .exec();
        
        if (!testimonials || testimonials.length === 0) return [];
        
        return testimonials.map(doc => ({
            ...doc,
            id: doc._id.toString(),
            _id: doc._id.toString(),
        })) as Testimonial[];

    } catch (error) {
        console.error("Error fetching testimonials:", error instanceof Error ? error.stack : String(error));
        return [];
    }
}


export async function getPrograms(collectionHandle: string, maxProducts: number = 10): Promise<Program[] | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!domain || !token) {
    console.error("Shopify domain or token not configured in environment variables.");
    return null;
  }

  if (!collectionHandle || typeof collectionHandle !== 'string') {
    console.error("Invalid collection handle provided");
    return null;
  }

  const validMaxProducts = Math.min(Math.max(maxProducts, 1), 100);
  const endpoint = `https://${domain}/api/2024-04/graphql.json`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: COLLECTION_QUERY, 
        variables: { handle: collectionHandle, first: validMaxProducts } 
      }),
      next: { revalidate: 3600, tags: ['shopify'] },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Shopify API request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`Shopify API request failed: ${response.statusText}`);
    }

    const responseBody: ShopifyCollectionResponse = await response.json();

    if (responseBody.errors && responseBody.errors.length > 0) {
      const errorMessages = responseBody.errors.map(err => err.message).join(', ');
      throw new Error(`GraphQL errors: ${errorMessages}`);
    }
    
    const shopifyProducts = responseBody.data?.collection?.products?.nodes;
    
    if (!shopifyProducts || !Array.isArray(shopifyProducts)) {
      console.warn(`No products found for collection: ${collectionHandle}`);
      return [];
    }
    
    return transformShopifyProducts(shopifyProducts);
  } catch (error) {
    console.error("Error fetching Shopify data:", {
      error: error instanceof Error ? error.message : String(error),
      collectionHandle,
      maxProducts: validMaxProducts,
      domain,
      hasToken: !!token
    });
    return null;
  }
}

    