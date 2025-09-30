
'use server';

import { z } from 'zod';
import { getFirestore } from "@/lib/firebase";
import { logEvent } from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import { type Lead, type LogEntry, type SystemStatus } from "@/types";
import { generateBlogPost as generateBlogPostFlow } from '@/ai/flows/generate-blog-post';
import { generatePersonalizedWorkout as generatePersonalizedWorkoutFlow, type GeneratePersonalizedWorkoutInput, type GeneratePersonalizedWorkoutOutput } from '@/ai/flows/generate-personalized-workout';
import { planSignupFlow, type PlanSignupInput, type PlanSignupOutput } from '@/ai/flows/plan-signup-flow';
import { getBlogPosts as getBlogPostsData } from './data';
import PostModel from '@/models/Post';
import TestimonialModel from '@/models/Testimonial';
import connectToDb from './mongoose';
import { shopifyStorefront } from './shopify';


const saveLeadSchema = z.object({
  email: z.string().email(),
  source: z.string(),
});
export async function saveLead(input: { email: string, source: string }) {
  'use server';
  const { email, source } = saveLeadSchema.parse(input);
  const firestore = getFirestore();
  if (!firestore) {
    throw new Error("Firestore no está disponible.");
  }
  const leadRef = firestore.collection('leads').doc(email);
  await leadRef.set({
    email,
    source,
    status: 'subscribed',
    createdAt: new Date(),
    updatedAt: new Date(),
  }, { merge: true });
}

const saveWorkoutLeadSchema = z.object({
    email: z.string().email()
});
export async function saveWorkoutLead(input: { email: string }) {
    'use server';
    const { email } = saveWorkoutLeadSchema.parse(input);
    const firestore = getFirestore();
    if (!firestore) {
        throw new Error("Firestore no está disponible.");
    }
    const leadRef = firestore.collection('leads').doc(email);
    await leadRef.set({
        email,
        source: 'Generador IA',
        status: 'subscribed',
        createdAt: new Date(),
        updatedAt: new Date(),
    }, { merge: true });
}

export async function generatePersonalizedWorkout(input: GeneratePersonalizedWorkoutInput): Promise<GeneratePersonalizedWorkoutOutput> {
    'use server';
    try {
        const workoutData = await generatePersonalizedWorkoutFlow(input);
        return workoutData;
    } catch (error: any) {
        const errorMessage = error.message || 'Ocurrió un error al generar tu plan.';
        logEvent('AI Workout Generation Failed', { error: errorMessage }, 'error');
        throw new Error(errorMessage);
    }
}


export async function processPlanSignup(input: PlanSignupInput): Promise<PlanSignupOutput> {
    'use server';
    try {
        const result = await planSignupFlow(input);
        return result;
    } catch (error: any) {
        const errorMessage = error.message || "No se pudo procesar la solicitud.";
        logEvent('Plan Signup Failed', { error: errorMessage }, 'error');
        throw new Error(errorMessage);
    }
}

export async function generateNewBlogPost(): Promise<{ success: boolean, title?: string, slug?: string, error?: string }> {
    'use server';
    try {
        await connectToDb();
        const recentPosts = await getBlogPostsData(10);
        const existingTitles = recentPosts.map(p => p.title);
        console.log(`Títulos existentes enviados a la IA: ${existingTitles.join(', ')}`);

        const newPostData = await generateBlogPostFlow({ existingTitles });
        console.log(`IA generó un nuevo artículo con título: "${newPostData.title}"`);

        const newPost = new PostModel({
            ...newPostData,
            createdAt: new Date(),
        });
        await newPost.save();

        console.log(`Tarea CRON completada: Nuevo artículo guardado en MongoDB con slug: ${newPost.slug}`);
        logEvent('Cron Job Success: Blog Post Generated and Saved', { title: newPost.title, slug: newPost.slug });
        
        return { success: true, title: newPost.title, slug: newPost.slug };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
        console.error(`Error durante la generación del artículo:`, error);
        logEvent('Generate Blog Post Action Failed', { error: errorMessage }, 'error');
        return { success: false, error: errorMessage };
    }
}

export async function getLeadsForAdmin(): Promise<Lead[]> {
    'use server';
    const firestore = getFirestore();
    if (!firestore) {
        console.error("Firestore is not available.");
        return [];
    }

    try {
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
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            } as Lead;
        });

        return leads;
    } catch (error) {
        console.error("Error fetching leads from Firestore:", error);
        return [];
    }
}

export async function getSystemStatuses(): Promise<SystemStatus> {
    'use server';
    const statuses: SystemStatus = {};

    // Check Firebase
    try {
        const firestore = getFirestore();
        if (firestore) {
            await firestore.collection('__healthcheck__').limit(1).get();
            statuses.firebase = { status: 'success', message: 'Conectado a Firestore y autenticado correctamente.' };
        } else {
            throw new Error("La inicialización de Firebase Admin falló.");
        }
    } catch (error) {
        statuses.firebase = { status: 'error', message: `Falló la conexión a Firestore: ${error instanceof Error ? error.message : String(error)}` };
    }

    // Check MongoDB
    try {
        await connectToDb();
        statuses.mongo = { status: 'success', message: 'Conectado a MongoDB a través de Mongoose.' };
        try {
            await TestimonialModel.findOne();
            statuses.mongoData = { status: 'success', message: 'Se pudo leer la colección de testimonios en MongoDB.' };
        } catch(e) {
             statuses.mongoData = { status: 'error', message: `Conectado a MongoDB, pero falló la lectura de datos: ${e instanceof Error ? e.message : String(e)}` };
        }
    } catch (error) {
        statuses.mongo = { status: 'error', message: `Falló la conexión a MongoDB: ${error instanceof Error ? error.message : String(error)}` };
        statuses.mongoData = { status: 'error', message: 'No se pudo intentar leer datos de MongoDB porque la conexión falló.' };
    }

    // Check Shopify
    try {
        await shopifyStorefront.request(`query { shop { name } }`);
        statuses.shopify = { status: 'success', message: 'Conectado a la API de Shopify Storefront.' };
    } catch (error) {
        statuses.shopify = { status: 'error', message: `Falló la conexión a Shopify: ${error instanceof Error ? error.message : String(error)}. Verifica el dominio y el token de acceso.` };
    }

    return statuses;
}

export async function getLogs(limit: number = 15): Promise<LogEntry[]> {
    'use server';
    const firestore = getFirestore();
    if (!firestore) {
        console.error("Firestore is not available for fetching logs.");
        return [];
    }

    try {
        const logsSnapshot = await firestore.collection('logs')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        if (logsSnapshot.empty) {
            return [];
        }

        return logsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                message: data.message,
                level: data.level,
                timestamp: data.timestamp.toDate(),
                metadata: data.metadata,
            } as LogEntry;
        });
    } catch (error) {
        console.error("Error fetching logs from Firestore:", error);
        return [];
    }
}
