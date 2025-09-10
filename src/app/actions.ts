
"use server";

import { generatePersonalizedWorkout, GeneratePersonalizedWorkoutInput, GeneratePersonalizedWorkoutOutput } from "@/ai/flows/generate-personalized-workout";
import { processPlanSignup, PlanSignupInput } from "@/ai/flows/plan-signup-flow";
import { z } from "zod";
import { MongoClient, ObjectId } from "mongodb";
import { Post, Testimonial } from "@/types";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}
if (!dbName) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_DB_NAME"');
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
    const client = new MongoClient(uri);
    try {
        const { email } = leadSchema.parse(formData);
        
        await client.connect();
        const db = client.db(dbName);
        
        await db.collection("leads").insertOne({
            email,
            source: "Guía Gratuita - 10k Pasos",
            createdAt: new Date(),
        });
        
        return { success: true, message: "¡Éxito! Tu guía está en camino." };
    } catch (e) {
        console.error(e);
        if (e instanceof z.ZodError) {
            return { success: false, message: e.errors[0].message };
        }
        return { success: false, message: "Hubo un problema con tu solicitud. Por favor, inténtalo de nuevo." };
    } finally {
        await client.close();
    }
}

export async function getBlogPosts(limit?: number): Promise<Post[]> {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    const postsCollection = db.collection<Post>("posts");
    let query = postsCollection.find({}).sort({ createdAt: -1 });

    if (limit) {
      query = query.limit(limit);
    }
    
    const posts = await query.toArray();

    return posts.map(post => ({
        ...post,
        id: post._id.toString(),
        createdAt: new Date(post.createdAt),
    }))

  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  } finally {
      await client.close();
  }
}

export async function getBlogPostBySlug(slug: string): Promise<Post | null> {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    
    const postsCollection = db.collection<Post>("posts");
    const post = await postsCollection.findOne({ slug });

    if (!post) {
      return null;
    }
    
    return {
        ...post,
        id: post._id.toString(),
        createdAt: new Date(post.createdAt),
    };

  } catch (error) {
    console.error(`Error fetching post with slug "${slug}":`, error);
    return null;
  } finally {
      await client.close();
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);

        const testimonialsCollection = db.collection<Testimonial>("testimonials");
        const testimonials = await testimonialsCollection.find({}).sort({ order: 1 }).toArray();

        return testimonials.map(testimonial => ({
            ...testimonial,
            id: testimonial._id.toString(),
        }));
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        return [];
    } finally {
        await client.close();
    }
}
