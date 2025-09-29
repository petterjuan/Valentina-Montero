
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDb from "@/lib/mongoose";
import PostModel from "@/models/Post";
import { shopifyStorefront } from "@/lib/shopify";
import { Post } from "@/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

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

    res.status(200).json(allPosts.slice(0, limit));
}
