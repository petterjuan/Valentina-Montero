// pages/blog/[slug].tsx
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { getFirestore } from '../../lib/firebase';
import { type Post, PostDocument } from '@/types';
import connectToDb from "@/lib/mongoose";
import PostModel from "@/models/Post";


async function getBlogPostBySlug(slug: string): Promise<Post | null> {
    // In Pages Router, this function runs on the client or server (with getServerSideProps), but not as a Server Action.
    // We will call it client-side in useEffect for simplicity.

    // Priority is not relevant here as we fetch one or the other.
    // This is a simplified version. A complete version would query Shopify API as well.
    try {
        await connectToDb();
        const post = await PostModel.findOne({ slug: slug }).lean().exec() as PostDocument | null;
        if (post) {
            return {
                id: post._id.toString(),
                source: 'MongoDB',
                title: post.title,
                slug: post.slug,
                content: post.content,
                excerpt: post.excerpt,
                imageUrl: post.imageUrl,
                aiHint: post.aiHint,
                createdAt: new Date(post.createdAt),
            };
        }
    } catch (error) {
        console.error(`Error fetching post by slug "${slug}" from MongoDB:`, error);
    }
    
    // Here you would add the Shopify fetch logic if needed.
    // For now, we return null if not found in Mongo.
    return null;
}


export default function BlogPost() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    
    async function fetchPost() {
      const data = await getBlogPostBySlug(slug);
      setPost(data);
    }
    
    fetchPost();
  }, [slug]);

  if (!post) return <p>Cargando...</p>;

  return (
    <article>
      <h1>{post.title}</h1>
      {post.imageUrl && <img src={post.imageUrl} alt={post.title} style={{maxWidth: '100%'}} />}
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}