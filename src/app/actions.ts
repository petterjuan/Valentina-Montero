
"use server";

import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput, GeneratePersonalizedWorkoutOutput } from "@/ai/flows/generate-personalized-workout";
import { processPlanSignup, PlanSignupInput } from "@/ai/flows/plan-signup-flow";
import { z } from "zod";
import { MongoClient, Db, ObjectId } from "mongodb";
import { Post, Testimonial } from "@/types";
import { getFirestore } from "@/lib/firebase";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}
if (!dbName) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_DB_NAME"');
}

// Per Next.js documentation, use a global variable to preserve the database connection
// across hot reloads in development.
// https://www.mongodb.com/docs/atlas/app-services/functions/nextjs-example/
// https://github.com/vercel/next.js/blob/canary/examples/with-mongodb/lib/mongodb.ts

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

async function getDb(): Promise<Db> {
    const mongoClient = await clientPromise;
    return mongoClient.db(dbName);
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
    const db = await getDb();
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
    const db = await getDb();
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
        const db = await getDb();
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
