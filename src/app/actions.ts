
"use server";

import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput, GeneratePersonalizedWorkoutOutput } from "@/ai/flows/generate-personalized-workout";
import { processPlanSignup, PlanSignupInput } from "@/ai/flows/plan-signup-flow";
import { z } from "zod";
import { Post, Testimonial, Lead, LogEntry } from "@/types";
import { getFirestore } from "@/lib/firebase";
import { Program } from "@/components/sections/CoachingProgramsSection";
import connectToDb from "@/lib/mongoose";
import PostModel from "@/models/Post";
import TestimonialModel from "@/models/Testimonial";
import crypto from 'crypto';
import { generateBlogPost } from "@/ai/flows/generate-blog-post";
import { logEvent } from "@/lib/logger";

// Schemas
const aiGeneratorSchema = z.object({
  fitnessGoal: z.string().min(1, "El objetivo de fitness es requerido"),
  experienceLevel: z.string().min(1, "El nivel de experiencia es requerido"),
  equipment: z.string().min(1, "El equipo disponible es requerido"),
  workoutFocus: z.string().min(1, "El enfoque es requerido"),
  duration: z.number().min(1, "La duración debe ser mayor a 0"),
  frequency: z.number().min(1, "La frecuencia debe ser mayor a 0"),
  email: z.string().email({ message: "Por favor, introduce un email válido." }).optional().or(z.literal('')),
});

const leadSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
});

// Types
export type AiGeneratorFormState = {
  data?: GeneratePersonalizedWorkoutOutput;
  error?: string;
  inputs?: z.infer<typeof aiGeneratorSchema>;
  isFullPlan?: boolean;
};

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


// Server Actions
export async function handleAiGeneration(
    prevState: AiGeneratorFormState, 
    formData: FormData
): Promise<AiGeneratorFormState> {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const dataToValidate = {
        ...rawData,
        duration: parseInt(rawData.duration as string, 10),
        frequency: parseInt(rawData.frequency as string, 10),
    };

    const validatedInput = aiGeneratorSchema.parse(dataToValidate);
    const { email, ...workoutInput } = validatedInput;

    // Use previous data if email is now provided for an existing plan
    const previousData = prevState.data;
    let result = previousData;

    if (!previousData || email) {
       logEvent('AI Workout Generation Triggered', { fitnessGoal: workoutInput.fitnessGoal, experienceLevel: workoutInput.experienceLevel });
       result = await generatePersonalizedWorkout(workoutInput);
    }
    
    if (!result) {
      logEvent('AI Workout Generation Failed', { error: 'No content from AI' }, 'error');
      return { error: "No se pudo generar el entrenamiento. Por favor, inténtalo de nuevo." };
    }
    
    if (email) {
      const firestore = getFirestore();
      if (firestore) {
        const now = new Date();
        const safeId = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
        const leadRef = firestore.collection("leads").doc(safeId);

        const leadData = {
          email,
          source: "IA Workout - Full Plan",
          status: "subscribed",
          tags: {
            goal: validatedInput.fitnessGoal,
            level: validatedInput.experienceLevel,
            focus: validatedInput.workoutFocus,
          },
          updatedAt: now,
          createdAt: now,
        };
        
        await leadRef.set(leadData, { merge: true });
        logEvent('New Lead from AI Workout', { email });
      }
      return { data: result, inputs: validatedInput, isFullPlan: true };
    }
    
    return { data: result, inputs: validatedInput, isFullPlan: false };

  } catch (error) {
    let errorDetails: Record<string, any> = {
        message: error instanceof Error ? error.message : String(error),
    };
    if (error instanceof Error && error.stack) {
        errorDetails.stack = error.stack;
    }
    if (error instanceof z.ZodError) {
      errorDetails.zodIssues = error.issues;
      const firstError = error.errors[0];
      logEvent('AI Workout Validation Error', { ...errorDetails, message: firstError?.message }, 'error');
      return { 
        error: firstError?.message || "Los datos de entrada no son válidos. Por favor, revisa el formulario." 
      };
    }
    
    logEvent('AI Workout Generation Error', errorDetails, 'error');
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
    logEvent(input.isDigital ? 'Digital Product Purchase Started' : 'Coaching Plan Signup Started', { planName: input.planName, email: input.email });
    const result = await processPlanSignup(input);
    return { data: result, error: null };
  } catch (error) {
    console.error("Error in handlePlanSignup:", error);
    
    const isStripeError = error instanceof Error && error.message.includes("STRIPE_NOT_CONFIGURED");
    if (isStripeError) {
      logEvent('Stripe Signup Failed - Not Configured', { planName: input.planName }, 'error');
      return { 
        data: null, 
        error: "El sistema de pagos aún no está configurado. Por favor, inténtalo más tarde." 
      };
    }
    
    logEvent('Plan Signup Failed', { planName: input.planName, error: error instanceof Error ? error.message : String(error) }, 'error');
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
      logEvent('Lead Submission Failed - Firestore Not Configured', { email }, 'error');
      return { success: false, message: "Servicio temporalmente no disponible. Por favor, inténtalo más tarde." };
    }

    const now = new Date();
    const safeId = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
    const leadRef = firestore.collection("leads").doc(safeId);

    const leadData = {
      email,
      source: "Guía Gratuita - 10k Pasos",
      status: "subscribed",
      updatedAt: now,
      createdAt: now,
    };
    
    await leadRef.set(leadData, { merge: true });
    logEvent('New Lead from Free Guide', { email });

    return {
      success: true,
      message: "¡Éxito! Tu guía está en camino.",
    };
  } catch (error) {
    console.error("Error in handleLeadSubmission:", error instanceof Error ? error.stack : String(error));
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0]?.message || "Email inválido." };
    }
    logEvent('Lead Submission Failed', { error: error instanceof Error ? error.message : String(error) }, 'error');
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
        
        if (!posts) return [];
        
        return posts.map(post => {
            const { _id, ...rest } = post;
            return { id: _id.toString(), ...rest } as Post;
        });

    } catch (error) {
        console.error("Error fetching blog posts:", error);
        logEvent('Fetch Blog Posts Failed', { error: error instanceof Error ? error.message : String(error) }, 'error');
        return [];
    }
}

export async function getBlogPostBySlug(slug: string): Promise<Post | null> {
    try {
        if (!slug) {
            console.warn("getBlogPostBySlug called with an empty slug.");
            return null;
        }
        
        await connectToDb();
        const post = await PostModel.findOne({ slug }).lean().exec();

        if (!post) {
            console.warn(`No post found for slug: "${slug}"`);
            return null;
        }
        
        const { _id, ...rest } = post;
        return { id: _id.toString(), ...rest } as Post;

    } catch (error) {
        console.error(`Error fetching post by slug "${slug}":`, error);
        logEvent('Fetch Blog Post By Slug Failed', { slug, error: error instanceof Error ? error.message : String(error) }, 'error');
        return null;
    }
}

export async function getTestimonials(): Promise<Testimonial[]> {
    try {
        await connectToDb();
        const testimonials = await TestimonialModel.find({})
            .sort({ order: 1 })
            .limit(10)
            .lean()
            .exec();
        
        if (!testimonials) return [];
        
        return testimonials.map(doc => {
            const { _id, ...rest } = doc;
            return { id: _id.toString(), ...rest } as Testimonial;
        });

    } catch (error) {
        console.error("Error fetching testimonials:", error);
        logEvent('Fetch Testimonials Failed', { error: error instanceof Error ? error.message : String(error) }, 'error');
        return [];
    }
}

export async function getLeads(): Promise<Lead[]> {
  try {
    const firestore = getFirestore();
    if (!firestore) {
      console.error("Firestore not configured, cannot fetch leads.");
      return [];
    }

    const leadsSnapshot = await firestore.collection('leads')
        .orderBy('createdAt', 'desc')
        .get();
        
    if (leadsSnapshot.empty) {
      return [];
    }
    
    const leads = leadsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        source: data.source || 'N/A',
        status: data.status || 'N/A',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as Lead;
    });

    return leads;
  } catch (error) {
    console.error("Error fetching leads from Firestore:", error);
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
    logEvent('Fetch Shopify Programs Failed', { collectionHandle, error: error instanceof Error ? error.message : String(error) }, 'error');
    return null;
  }
}

export async function getLogs(limit: number = 15): Promise<LogEntry[]> {
    try {
        const firestore = getFirestore();
        if (!firestore) {
            console.error("Firestore not configured, cannot fetch logs.");
            return [];
        }

        const logsSnapshot = await firestore.collection('logs')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        
        if (logsSnapshot.empty) {
            return [];
        }

        const logs = logsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                message: data.message,
                level: data.level,
                timestamp: data.timestamp.toDate(),
                metadata: data.metadata || null,
            } as LogEntry;
        });

        return logs;

    } catch (error) {
        console.error("Error fetching logs from Firestore:", error);
        return [];
    }
}
    
// --- Actions for Troubleshoot Page ---

type Status = {
    status: 'success' | 'error';
    message: string;
};
    
async function checkFirebase(): Promise<Status> {
  try {
    const firestore = getFirestore();
    if (!firestore) {
       return {
            status: "error" as const,
            message: `La inicialización de Firebase falló. Revisa los logs del servidor para ver el error. Asegúrate de que <b>FIREBASE_SERVICE_ACCOUNT_KEY</b> esté configurada correctamente.`,
        };
    }
    
    await firestore.listCollections();

    let projectId = 'tu-proyecto';
    try {
        const key = process.env.NEXT_PUBLIC_FIREBASE_CONFIG!;
        const config = JSON.parse(key);
        projectId = config.projectId;
    } catch (e) {}

    return { status: "success" as const, message: `Conectado exitosamente al proyecto de Firebase: <b>${projectId}</b>.` };
  } catch (error: any) {
    let errorMessage = `Falló la conexión a Firestore. Error: ${error.message}`;
    if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('ENOTFOUND'))) {
       errorMessage = `No se pudo conectar al host de Firestore. Revisa tu conexión a internet o la configuración de red.`;
    }
    if (error.code === 7 || (error.message && error.message.includes('PERMISSION_DENIED'))) {
       errorMessage = `Permiso denegado. La API de Cloud Firestore no ha sido habilitada en el proyecto o las credenciales no tienen los permisos correctos. <a href="https://console.developers.google.com/apis/api/firestore.googleapis.com/overview" target="_blank" rel="noopener noreferrer" class="underline font-bold">Haz clic aquí para habilitar la API</a>, espera 5 minutos y refresca.`;
    } else if (error.code === 5 || (error.message && error.message.includes('NOT_FOUND'))) {
       errorMessage = `Error: <b>5 NOT_FOUND</b>. Esto casi siempre significa que la base de datos de Firestore aún no ha sido creada en tu proyecto. <br><b>Solución:</b> Ve a la <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" class="underline font-bold">Consola de Firebase</a>, selecciona tu proyecto, haz clic en <b>Build > Firestore Database</b> y luego en <b>'Crear base de datos'</b>.`;
    }
    return { status: "error" as const, message: errorMessage };
  }
}

async function checkMongoDB(): Promise<Status> {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        return { status: 'error' as const, message: 'La variable de entorno <b>MONGODB_URI</b> no está configurada.' };
    }
    
    if (!uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
        return { status: 'error' as const, message: `Formato de MONGODB_URI inválido. Debe empezar con 'mongodb+srv://' o 'mongodb://'.` };
    }

    try {
        const client = await connectToDb();
        const dbName = client.connection.db.databaseName;
        
        await client.connection.db.command({ ping: 1 });
        
        return { status: 'success' as const, message: `Conectado exitosamente a la base de datos: <b>${dbName}</b>.` };
    } catch (error: any) {
        let errorMessage = `Falló la conexión a MongoDB. Error: ${error.message}`;
        if (error.message && (error.message.includes('bad auth') || error.message.includes('Authentication failed'))) {
            errorMessage = "Falló la autenticación con MongoDB. Revisa que el usuario y la contraseña en la <b>MONGODB_URI</b> sean correctos."
        }
        if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('ENOTFOUND'))) {
             errorMessage = `No se pudo encontrar el host del servidor de MongoDB. Revisa que el hostname en tu <b>MONGODB_URI</b> sea correcto. Error: ${error.message}`;
        }
        return { status: 'error' as const, message: errorMessage };
    }
}

async function checkShopify(): Promise<Status> {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    if (!domain) return { status: 'error' as const, message: `Configuración incompleta. Falta la variable de entorno: <b>SHOPIFY_STORE_DOMAIN</b>.` };
    if (!token) return { status: 'error' as const, message: `Configuración incompleta. Falta la variable de entorno: <b>SHOPIFY_STOREFRONT_ACCESS_TOKEN</b>.` };

    const endpoint = `https://${domain}/api/2024-04/graphql.json`;
    const query = `{ shop { name } }`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'X-Shopify-Storefront-Access-Token': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                 throw new Error(`Error de autenticación (Unauthorized). El <b>Storefront Access Token</b> es inválido o no tiene los permisos necesarios. Revisa que el token en Vercel sea correcto y que los permisos de Storefront API en tu app de Shopify estén habilitados (ej. 'unauthenticated_read_products').`);
            }
            if (response.status === 404) {
                 throw new Error(`La URL de la API de Shopify no fue encontrada (404 Not Found). Revisa que el SHOPIFY_STORE_DOMAIN (<b>'${domain}'</b>) sea correcto. Debe ser del tipo 'tu-tienda.myshopify.com', sin 'https://'.`);
            }
            const errorText = await response.text();
            throw new Error(`La API de Shopify devolvió un estado <b>${response.status}</b>. Respuesta: ${errorText}`);
        }
        
        const json = await response.json();
        
        if (json.errors) {
             throw new Error(`Errores de GraphQL: ${json.errors.map((e: any) => e.message).join(', ')}. Esto casi siempre significa que al token le faltan permisos. En Shopify, ve a tu App > Configuration > Storefront API integration y asegúrate de que todos los permisos de lectura de productos estén marcados (ej. 'unauthenticated_read_products').`);
        }

        const shopName = json.data?.shop?.name;
        return { status: 'success' as const, message: `Conectado exitosamente a la tienda de Shopify: <b>${shopName}</b>.` };

    } catch (error: any) {
        return { status: 'error' as const, message: `Falló la conexión a Shopify. Error: ${error.message}` };
    }
}

async function checkMongoData(): Promise<Status> {
    try {
        const client = await connectToDb();
        if(!client) {
             return { status: 'error' as const, message: `No se pudo establecer conexión con MongoDB para la lectura de datos.` };
        }

        const postCount = await PostModel.countDocuments();
        const testimonialCount = await TestimonialModel.countDocuments();
        const dbName = client.connection.db.databaseName;

        return { 
            status: 'success' as const, 
            message: `Lectura exitosa. Se encontraron <b>${postCount} posts</b> y <b>${testimonialCount} testimonios</b> en la base de datos <b>${dbName}</b>.`
        };

    } catch (error: any) {
        return { status: 'error' as const, message: `Falló la lectura de datos de MongoDB. Error: ${error.message}` };
    }
}

export type SystemStatus = { [key: string]: Status | null };

export async function getSystemStatuses(): Promise<SystemStatus> {
    const [
        firebaseStatus, 
        mongoStatus, 
        shopifyStatus, 
        mongoDataStatus
    ] = await Promise.all([
        checkFirebase(),
        checkMongoDB(),
        checkShopify(),
        checkMongoData(),
    ]);

    return {
        firebase: firebaseStatus,
        mongo: mongoStatus,
        shopify: shopifyStatus,
        mongoData: mongoDataStatus,
    };
}

    