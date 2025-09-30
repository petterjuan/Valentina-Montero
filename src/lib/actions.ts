
'use server';

import { z } from 'zod';
import { getFirestore } from "@/lib/firebase";
import { logEvent } from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import { type Lead, type LogEntry, type SystemStatus, type Post, type Program, type Testimonial } from "@/types";
import { generateBlogPost as generateBlogPostFlow, type GenerateBlogPostInput, type GenerateBlogPostOutput } from '@/ai/flows/generate-blog-post';
import { generatePersonalizedWorkout as generatePersonalizedWorkoutFlow, type GeneratePersonalizedWorkoutInput, type GeneratePersonalizedWorkoutOutput } from '@/ai/flows/generate-personalized-workout';
import { processPlanSignup as processPlanSignupFlow, type PlanSignupInput, type PlanSignupOutput } from '@/ai/flows/plan-signup-flow';
import PostModel from '@/models/Post';
import TestimonialModel from '@/models/Testimonial';
import connectToDb from './mongoose';
import { shopifyStorefront } from './shopify';
import { revalidatePath } from 'next/cache';

//========================================================================
//  DATA FETCHING FUNCTIONS (Called from Server Components)
//========================================================================

export async function getPrograms(collectionHandle: string, maxProducts: number): Promise<Program[]> {
    try {
        const { collection } = await shopifyStorefront.request(
            `query getCollectionByHandle($handle: String!, $first: Int!) {
                collection(handle: $handle) {
                    products(first: $first) {
                        edges {
                            node {
                                title
                                handle
                                priceRange {
                                    minVariantPrice {
                                        amount
                                    }
                                }
                                features: metafield(namespace: "custom", key: "features") {
                                    value
                                }
                                is_popular: metafield(namespace: "custom", key: "is_popular") {
                                    value
                                }
                                is_digital: metafield(namespace: "custom", key: "is_digital") {
                                    value
                                }
                                images(first: 1) {
                                    edges {
                                        node {
                                            url
                                            altText
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`,
            {
                variables: {
                    handle: collectionHandle,
                    first: maxProducts,
                },
            }
        );

        if (!collection) {
            console.warn(`Shopify collection with handle "${collectionHandle}" not found.`);
            return [];
        }

        const programs: Program[] = collection.products.edges.map(({ node }: any) => ({
            title: node.title,
            handle: node.handle,
            price: parseFloat(node.priceRange.minVariantPrice.amount),
            features: node.features ? JSON.parse(node.features.value) : [],
            isPopular: node.is_popular ? JSON.parse(node.is_popular.value) : false,
            isDigital: node.is_digital ? JSON.parse(node.is_digital.value) : false,
            image: node.images.edges[0] ? {
                src: node.images.edges[0].node.url,
                alt: node.images.edges[0].node.altText || node.title,
            } : undefined,
        }));

        return programs;
    } catch (error) {
        console.error(`Error fetching Shopify programs for collection "${collectionHandle}":`, error);
        return [];
    }
}

export async function getBlogPosts(limit: number = 10): Promise<Post[]> {
    let shopifyPosts: Post[] = [];
    let mongoPosts: Post[] = [];

    try {
        const { articles } = await shopifyStorefront.request(
            `query getBlogArticles($first: Int!) {
                articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
                    edges {
                        node {
                            id
                            title
                            handle
                            excerpt
                            contentHtml
                            publishedAt
                            image {
                                url
                                altText
                            }
                        }
                    }
                }
            }`,
            {
                variables: {
                    first: limit,
                },
            }
        );
        shopifyPosts = articles.edges.map(({ node }: any) => ({
            id: node.id,
            source: 'Shopify',
            title: node.title,
            slug: node.handle,
            excerpt: node.excerpt,
            content: node.contentHtml,
            imageUrl: node.image?.url,
            aiHint: node.image?.altText,
            createdAt: new Date(node.publishedAt),
        }));
    } catch (error) {
        console.error("Error fetching blog posts from Shopify:", error);
    }

    try {
        await connectToDb();
        const postsFromDb = await PostModel.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        mongoPosts = postsFromDb.map(doc => ({
            id: doc._id.toString(),
            source: 'MongoDB',
            title: doc.title,
            slug: doc.slug,
            excerpt: doc.excerpt,
            content: doc.content,
            imageUrl: doc.imageUrl,
            aiHint: doc.aiHint,
            createdAt: new Date(doc.createdAt),
        }));
    } catch (error) {
        console.error("Error fetching posts from MongoDB:", error);
    }

    const allPosts = [...shopifyPosts, ...mongoPosts];
    allPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return allPosts.slice(0, limit);
}

export async function getBlogPostBySlug(slug: string): Promise<Post | null> {
    if (!slug) {
        return null;
    }

    try {
        await connectToDb();
        const mongoPost = await PostModel.findOne({ slug: slug }).lean().exec();
        if (mongoPost) {
            return {
                id: mongoPost._id.toString(),
                source: 'MongoDB',
                title: mongoPost.title,
                slug: mongoPost.slug,
                excerpt: mongoPost.excerpt,
                content: mongoPost.content,
                imageUrl: mongoPost.imageUrl,
                aiHint: mongoPost.aiHint,
                createdAt: new Date(mongoPost.createdAt),
            };
        }
    } catch (error) {
        console.error(`Error fetching post by slug "${slug}" from MongoDB:`, error);
    }

    try {
        const { blog } = await shopifyStorefront.request(
            `query getArticleByHandle($handle: String!) {
                blog(handle: "news") { 
                    articleByHandle(handle: $handle) {
                        id
                        title
                        handle
                        excerpt
                        contentHtml
                        publishedAt
                        image {
                            url
                            altText
                        }
                    }
                }
            }`,
            {
                variables: { handle: slug },
            }
        );

        if (blog && blog.articleByHandle) {
            const node = blog.articleByHandle;
            return {
                id: node.id,
                source: 'Shopify',
                title: node.title,
                slug: node.handle,
                excerpt: node.excerpt,
                content: node.contentHtml,
                imageUrl: node.image?.url,
                aiHint: node.image?.altText,
                createdAt: new Date(node.publishedAt),
            };
        }
    } catch (error) {
        console.error(`Error fetching article by handle "${slug}" from Shopify:`, error);
    }
    
    return null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
    try {
        await connectToDb();
        const testimonials = await TestimonialModel.find({}).sort({ order: 1 }).lean();
        return testimonials.map(doc => ({
            ...doc,
            id: doc._id.toString(),
            _id: doc._id.toString(),
        }));
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        return [];
    }
}


//========================================================================
//  SERVER ACTIONS (Called from Client Components)
//========================================================================

export async function saveLead(input: { email: string, source: string }): Promise<{ success: boolean, error?: string }> {
  'use server';
  const saveLeadSchema = z.object({
    email: z.string().email(),
    source: z.string(),
  });
  
  const validated = saveLeadSchema.safeParse(input);
  if (!validated.success) {
      return { success: false, error: 'Invalid input.' };
  }
  
  const { email, source } = validated.data;
  const firestore = getFirestore();
  if (!firestore) {
    return { success: false, error: "Firestore no está disponible." };
  }
  try {
    const leadRef = firestore.collection('leads').doc(email);
    await leadRef.set({
      email,
      source,
      status: 'subscribed',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    
    revalidatePath('/admin/leads');
    
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el lead.";
    logEvent('Firestore Write Error', { error: message }, 'error');
    return { success: false, error: message };
  }
}

export async function saveWorkoutLead(input: { email: string }): Promise<{ success: boolean, error?: string }> {
    'use server';
    const saveWorkoutLeadSchema = z.object({
        email: z.string().email()
    });

    const validated = saveWorkoutLeadSchema.safeParse(input);
    if (!validated.success) {
        return { success: false, error: 'Invalid input.' };
    }
    const { email } = validated.data;
    const firestore = getFirestore();
    if (!firestore) {
        return { success: false, error: "Firestore no está disponible." };
    }
    try {
        const leadRef = firestore.collection('leads').doc(email);
        await leadRef.set({
            email,
            source: 'Generador IA',
            status: 'subscribed',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, { merge: true });

        revalidatePath('/admin/leads');
        
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo guardar el lead del generador IA.";
        logEvent('Firestore Write Error', { error: message }, 'error');
        return { success: false, error: message };
    }
}

export async function generatePersonalizedWorkout(input: GeneratePersonalizedWorkoutInput): Promise<GeneratePersonalizedWorkoutOutput> {
    'use server';
    try {
        const workoutData = await generatePersonalizedWorkoutFlow(input);
        return workoutData;
    } catch (error: any) {
        const errorMessage = error.message || 'Ocurrió un error al generar tu plan.';
        logEvent('AI Workout Generation Failed', { error: errorMessage, input: input }, 'error');
        throw new Error(errorMessage);
    }
}

export async function processPlanSignup(input: PlanSignupInput): Promise<PlanSignupOutput> {
    'use server';
    try {
        const result = await processPlanSignupFlow(input);
        
        // Revalidate the leads page since a new lead might have been created
        revalidatePath('/admin/leads');

        return result;
    } catch (error: any) {
        const errorMessage = error.message || "No se pudo procesar la solicitud.";
        logEvent('Plan Signup Failed', { error: errorMessage, input: input }, 'error');
        throw new Error(errorMessage);
    }
}

export async function generateNewBlogPost(): Promise<{ success: boolean, title?: string, slug?: string, error?: string }> {
    'use server';
    try {
        await connectToDb();
        // Fetching both post types to get a comprehensive list of existing titles.
        const recentPosts = await getBlogPosts(10);
        const existingTitles = recentPosts.map(p => p.title);
        
        const newPostData = await generateBlogPostFlow({ existingTitles });
        
        const newPost = new PostModel({
            ...newPostData,
            createdAt: new Date(),
        });
        await newPost.save();

        logEvent('Cron Job Success: Blog Post Generated', { title: newPost.title, slug: newPost.slug });
        
        revalidatePath('/blog');
        revalidatePath(`/blog/${newPost.slug}`);
        
        return { success: true, title: newPost.title, slug: newPost.slug };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
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
