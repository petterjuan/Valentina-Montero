
"use server";
require('dotenv').config();

import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput, GeneratePersonalizedWorkoutOutput } from "@/ai/flows/generate-personalized-workout";
import { processPlanSignup, PlanSignupInput } from "@/ai/flows/plan-signup-flow";
import { z } from "zod";
import { MongoClient, Db, ObjectId } from "mongodb";
import { Post, Testimonial } from "@/types";
import { getFirestore } from "@/lib/firebase";
import { Program } from "@/components/sections/CoachingProgramsSection";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}
if (!dbName) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_DB_NAME"');
}

let client: MongoClient;
let db: Db;

async function connectToDb() {
  if (client && db) {
    return { client, db };
  }
  
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    client = await global._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    await client.connect();
  }
  db = client.db(dbName);
  return { client, db };
}


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

export async function getBlogPosts(limit?: number): Promise<Post[]> {
  try {
    const { db } = await connectToDb();
    const postsCollection = db.collection<Post>("posts");
    const query = postsCollection.find({}).sort({ createdAt: -1 }).limit(limit || 20);
    const posts = await query.toArray();

    return posts.map(post => ({
        ...post,
        _id: post._id,
        id: post._id.toString(),
        createdAt: new Date(post.createdAt),
    }));

  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<Post | null> {
  try {
    const { db } = await connectToDb();
    const postsCollection = db.collection<Post>("posts");
    const post = await postsCollection.findOne({ slug });

    if (!post) {
      return null;
    }
    
    return {
        ...post,
        _id: post._id,
        id: post._id.toString(),
        createdAt: new Date(post.createdAt),
    };

  } catch (error) {
    console.error(`Error fetching post with slug "${slug}":`, error);
    return null;
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
    try {
        const { db } = await connectToDb();
        const testimonialsCollection = db.collection<Testimonial>("testimonials");
        const testimonials = await testimonialsCollection.find({}).sort({ order: 1 }).limit(10).toArray();

        return testimonials.map(testimonial => ({
            ...testimonial,
            _id: testimonial._id,
            id: testimonial._id.toString(),
        }));
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        return [];
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
    console.warn("Shopify environment variables are not set.");
    return null;
  }
  
  const endpoint = `https://${domain}/api/2024-07/graphql.json`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: COLLECTION_QUERY, variables: { handle: collectionHandle, first: maxProducts } }),
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API request failed: ${response.status} ${errorText}`);
    }

    const jsonResponse = await response.json();
    if(jsonResponse.errors) {
        throw new Error(`GraphQL Errors: ${JSON.stringify(jsonResponse.errors)}`);
    }
    
    const shopifyProducts = jsonResponse.data?.collection?.products?.nodes;
    
    if (shopifyProducts && shopifyProducts.length > 0) {
      return transformShopifyProducts(shopifyProducts);
    }
    
    return []; 
  } catch (err: any) {
    console.error("Error fetching from Shopify:", err.message);
    return null;
  }
}
