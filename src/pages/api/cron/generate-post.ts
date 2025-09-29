import { NextApiRequest, NextApiResponse } from 'next';
import { getBlogPosts } from '@/pages/api/posts'; // This function needs to be adapted or imported differently
import { generateBlogPost } from '@/ai/flows/generate-blog-post';
import { logEvent } from '@/lib/logger';
import { Post } from '@/types';
import PostModel from '@/models/Post';
import connectToDb from '@/lib/mongoose';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to get posts within the API route context
// This avoids cross-importing from other API routes.
async function fetchExistingPosts(limit: number): Promise<Post[]> {
    try {
        const posts = await getBlogPosts(limit);
        return posts;
    } catch(e) {
        console.error("Cron job: Failed to fetch existing posts", e);
        return [];
    }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { secret } = req.query;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
      console.error('CRON_SECRET no está configurado en las variables de entorno.');
      logEvent('Cron Job Failed - Server Misconfiguration', { reason: 'CRON_SECRET is not set' }, 'error');
      return res.status(500).json({ message: 'Error de configuración del servidor.' });
  }
  
  if (secret !== cronSecret) {
    logEvent('Cron Job Failed - Unauthorized', { reason: 'Secret in query does not match CRON_SECRET' }, 'error');
    return res.status(401).json({ message: 'No autorizado.' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logEvent('Cron Job Started: Generate Blog Post', { attempt });
      console.log(`Iniciando tarea CRON (Intento ${attempt}/${MAX_RETRIES}): Generación de artículo de blog.`);
      
      await connectToDb();

      // 1. Obtener los últimos 10 títulos para evitar repeticiones (de ambas fuentes)
      const recentPosts: Post[] = await fetchExistingPosts(10);
      const existingTitles = recentPosts.map(p => p.title);
      console.log(`Títulos existentes enviados a la IA: ${existingTitles.join(', ')}`);

      // 2. Llamar al flujo de IA para generar un nuevo artículo
      const newPostData = await generateBlogPost({ existingTitles });
      console.log(`IA generó un nuevo artículo con título: "${newPostData.title}"`);

      // 3. Guardar el nuevo artículo en MongoDB
      const newPost = new PostModel({
        title: newPostData.title,
        slug: newPostData.slug,
        excerpt: newPostData.excerpt,
        content: newPostData.content,
        imageUrl: newPostData.imageUrl,
        aiHint: newPostData.aiHint,
        createdAt: new Date(),
      });
      
      await newPost.save();

      console.log(`Tarea CRON completada: Nuevo artículo guardado en MongoDB con slug: ${newPost.slug}`);
      logEvent('Cron Job Success: Blog Post Generated and Saved', { title: newPost.title, slug: newPost.slug, attempts: attempt });
      
      return res.status(200).json({ success: true, title: newPost.title, slug: newPost.slug });
      
    } catch (error) {
      console.error(`Error durante la ejecución de la tarea CRON (Intento ${attempt}/${MAX_RETRIES}):`, error);
      const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
      logEvent('Cron Job Attempt Failed', { error: errorMessage, attempt }, 'warn');

      if (attempt === MAX_RETRIES) {
        logEvent('Cron Job Failed After Max Retries', { error: errorMessage }, 'error');
        return res.status(500).json({ message: 'Error al generar el artículo después de varios intentos.', error: errorMessage });
      }
      
      await sleep(RETRY_DELAY_MS);
    }
  }

  // This part should not be reachable if logic is correct, but serves as a fallback.
  return res.status(500).json({ message: 'La tarea CRON falló inesperadamente.' });
}
