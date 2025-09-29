
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDb from "@/lib/mongoose";
import PostModel from "@/models/Post";
import { shopifyStorefront } from "@/lib/shopify";
import { Post } from "@/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { slug } = req.query;

    if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ message: 'Slug is required' });
    }

    try {
        await connectToDb();
        const mongoPost = await PostModel.findOne({ slug: slug }).lean().exec();
        if (mongoPost) {
            const post: Post = {
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
            return res.status(200).json(post);
        }
    } catch (error) {
        console.error(`Error fetching post by slug "${slug}" from MongoDB:`, error);
        // Do not return here, continue to check Shopify
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
            const post: Post = {
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
            return res.status(200).json(post);
        }
    } catch (error) {
        console.error(`Error fetching article by handle "${slug}" from Shopify:`, error);
    }
    
    return res.status(404).json({ message: 'Post not found' });
}
