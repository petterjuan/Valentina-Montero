
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

const aiGeneratorSchema = z.object({
  fitnessGoal: z.string(),
  experienceLevel: z.string(),
  equipment: z.string(),
  duration: z.number(),
  frequency: z.number(),
});

export type AiGeneratorFormState = {
  data?: GeneratePersonalizedWorkoutOutput;
  error?: string;
  inputs?: z.infer<typeof aiGeneratorSchema>;
};

export async function handleAiGeneration(input: GeneratePersonalizedWorkoutInput): Promise<AiGeneratorFormState> {
  try {
    const validatedInput = aiGeneratorSchema.parse(input);
    const result = await generatePersonalizedWorkout(validatedInput);
    return { data: result, inputs: validatedInput };
  } catch (e) {
    console.error(e);
    if (e instanceof z.ZodError) {
      return { error: "Los datos de entrada no son válidos. Por favor, revisa el formulario." };
    }
    return { error: "No se pudo generar el contenido. Por favor, inténtalo de nuevo más tarde." };
  }
}

export async function handlePlanSignup(input: PlanSignupInput) {
  try {
    const result = await processPlanSignup(input);
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
     const isStripeError = e instanceof Error && e.message.includes("STRIPE_NOT_CONFIGURED");
      if (isStripeError) {
        return { data: null, error: "El sistema de pagos aún no está configurado. Por favor, inténtalo más tarde." };
      }
    return { data: null, error: "Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo." };
  }
}

const leadSchema = z.object({
    email: z.string().email({ message: "Por favor, introduce un email válido." }),
});

export async function handleLeadSubmission(formData: { email: string }) {
    try {
        const { email } = leadSchema.parse(formData);
        
        const firestore = getFirestore();
        if (!firestore) {
            throw new Error("Firestore no está configurado. No se puede guardar el lead.");
        }

        const leadRef = firestore.collection('leads').doc(email);
        await leadRef.set({
            email,
            source: "Guía Gratuita - 10k Pasos",
            status: "subscribed",
            createdAt: new Date(),
        }, { merge: true });
        
        return { success: true, message: "¡Éxito! Tu guía está en camino." };
    } catch (e) {
        console.error(e);
        if (e instanceof z.ZodError) {
            return { success: false, message: e.errors[0].message };
        }
        return { success: false, message: "Hubo un problema con tu solicitud. Por favor, inténtalo de nuevo." };
    }
}

export async function getBlogPosts(limit?: number): Promise<Post[] | null> {
  try {
    await connectToDb();
    const posts: PostDocument[] = await PostModel.find({})
      .sort({ createdAt: -1 })
      .limit(limit || 20)
      .lean();

    return posts.map(post => ({
        ...post,
        id: post._id.toString(),
        _id: post._id.toString(),
        createdAt: new Date(post.createdAt),
    }));
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return null;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<Post | null> {
  try {
    await connectToDb();
    const post: PostDocument | null = await PostModel.findOne({ slug }).lean();

    if (!post) {
      return null;
    }
    
    return {
        ...post,
        id: post._id.toString(),
        _id: post._id.toString(),
        createdAt: new Date(post.createdAt),
    };
  } catch (error) {
    console.error(`Error fetching post with slug "${slug}":`, error);
    return null;
  }
}

export async function getTestimonials(): Promise<Testimonial[] | null> {
    try {
        await connectToDb();
        const testimonials: TestimonialDocument[] = await TestimonialModel.find({})
            .sort({ order: 1 })
            .limit(10)
            .lean();
        
        return testimonials.map(testimonial => ({
            ...testimonial,
            _id: testimonial._id.toString(),
            id: testimonial._id.toString(),
        }));
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        return null;
    }
}

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
        // Silently fail if parsing fails, default to empty array
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

export async function getPrograms(collectionHandle: string, maxProducts: number): Promise<Program[] | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!domain || !token) {
    console.error("Shopify domain or token not configured in environment variables.");
    return null;
  }
  
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
        variables: { handle: collectionHandle, first: maxProducts } 
      }),
      next: { revalidate: 3600 }
    });

    const responseBody = await response.json();

    if (!response.ok || responseBody.errors) {
      const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          responseBody: responseBody
      };
      throw new Error(`Shopify API request failed: ${JSON.stringify(errorDetails)}`);
    }
    
    const shopifyProducts = responseBody.data?.collection?.products?.nodes;
    
    if (shopifyProducts && Array.isArray(shopifyProducts)) {
      return transformShopifyProducts(shopifyProducts);
    }
    
    return null;
  } catch (err) {
    console.error("Error completo al obtener datos de Shopify:", err);
    return null;
  }
}
