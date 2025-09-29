
import { getFirestore } from "@/lib/firebase";
import connectToDb from "@/lib/mongoose";
import PostModel from "@/models/Post";
import TestimonialModel from "@/models/Testimonial";
import { Post, Testimonial, Program, Lead, LogEntry } from "@/types";
import { shopifyStorefront } from "@/lib/shopify";

// This is not a Server Actions file anymore.
// These are regular functions that can be called from the client-side in useEffect hooks.

export async function getPrograms(collectionHandle: string, maxProducts: number = 10): Promise<Program[] | null> {
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
        return null;
    }
}

export async function getBlogPosts(limit: number = 3): Promise<Post[]> {
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
                blog(handle: "news") { # Assuming default blog handle "news"
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

export async function getLeadsForAdmin(): Promise<Lead[]> {
    const firestore = getFirestore();
    if (!firestore) {
      console.error("Firestore not configured, cannot fetch leads.");
      throw new Error("La base de datos de Firestore no está disponible.");
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
      throw new Error("No se pudieron cargar los prospectos desde la base de datos.");
    }
}

export interface SystemStatus {
  firebase?: { status: 'success' | 'error'; message: string };
  mongo?: { status: 'success' | 'error'; message: string };
  mongoData?: { status: 'success' | 'error'; message: string };
  shopify?: { status: 'success' | 'error'; message: string };
}

export async function getSystemStatuses(): Promise<SystemStatus> {
    const statuses: SystemStatus = {};

    // Check Firebase
    try {
        const firestore = getFirestore();
        if (!firestore) {
            throw new Error("El SDK de Firebase Admin no está inicializado.");
        }
        await firestore.collection('system-check').limit(1).get();
        statuses.firebase = { status: 'success', message: 'Conexión a Firestore exitosa.' };
    } catch (error: any) {
        statuses.firebase = { status: 'error', message: `Error de conexión a Firestore: ${error.message}` };
    }

    // Check MongoDB Connection
    try {
        await connectToDb();
        statuses.mongo = { status: 'success', message: 'Conexión a MongoDB exitosa.' };
    } catch (error: any) {
        statuses.mongo = { status: 'error', message: `Error de conexión a MongoDB: ${error.message}` };
    }

    // Check MongoDB Data Reading
    if (statuses.mongo?.status === 'success') {
        try {
            await TestimonialModel.findOne();
            statuses.mongoData = { status: 'success', message: 'Lectura de datos de MongoDB exitosa (colección de testimonios).' };
        } catch (error: any) {
            statuses.mongoData = { status: 'error', message: `Error al leer datos de MongoDB: ${error.message}` };
        }
    } else {
        statuses.mongoData = { status: 'error', message: 'No se puede intentar la lectura de datos porque la conexión a MongoDB falló.' };
    }

    // Check Shopify
    try {
        const { shop } = await shopifyStorefront.request(`query { shop { name } }`);
        statuses.shopify = { status: 'success', message: `Conexión a la tienda de Shopify "${shop.name}" exitosa.` };
    } catch (error: any) {
        let errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Failed to fetch')) {
          errorMessage = 'No se pudo conectar al API de Shopify. Verifica el dominio de la tienda y el token de acceso.';
        } else if (errorMessage.includes('401')) {
          errorMessage = 'No autorizado. El token de acceso de Shopify Storefront es inválido.';
        }
        statuses.shopify = { status: 'error', message: `Error de conexión a Shopify: ${errorMessage}` };
    }

    return statuses;
}

export async function getLogs(limit: number = 25): Promise<LogEntry[]> {
    const firestore = getFirestore();
    if (!firestore) {
        console.error("Firestore not available, cannot fetch logs.");
        return [{
            id: 'local-error',
            message: 'Firestore no está disponible para obtener los registros.',
            level: 'error',
            timestamp: new Date(),
        }];
    }

    try {
        const logsSnapshot = await firestore.collection('logs')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        return logsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                message: data.message,
                level: data.level,
                timestamp: data.timestamp.toDate(),
                metadata: data.metadata,
            };
        });
    } catch (error: any) {
        console.error("Error fetching logs from Firestore:", error.message);
        return [{
            id: 'fetch-error',
            message: 'Error al obtener registros de Firestore: ' + error.message,
            level: 'error',
            timestamp: new Date(),
        }];
    }
}
