import 'server-only';
import connectToDb from "@/lib/mongoose";
import PostModel from "@/models/Post";
import TestimonialModel from "@/models/Testimonial";
import { shopifyStorefront } from "@/lib/shopify";
import { type Post, type Program, type Testimonial } from "@/types";

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
