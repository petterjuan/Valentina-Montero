
import { NextRequest, NextResponse } from 'next/server';
import { getBlogPosts } from '@/app/actions';
import { generateBlogPost } from '@/ai/flows/generate-blog-post';
import { logEvent } from '@/lib/logger';
import { Post } from '@/types';
import PostModel from '@/models/Post';
import connectToDb from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
      console.error('CRON_SECRET no está configurado en las variables de entorno.');
      logEvent('Cron Job Failed - Server Misconfiguration', { reason: 'CRON_SECRET is not set' }, 'error');
      return NextResponse.json({ message: 'Error de configuración del servidor.' }, { status: 500 });
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    logEvent('Cron Job Failed - Unauthorized', { reason: 'Authorization header is invalid or not provided' }, 'error');
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logEvent('Cron Job Started: Generate Blog Post', { attempt });
      console.log(`Iniciando tarea CRON (Intento ${attempt}/${MAX_RETRIES}): Generación de artículo de blog.`);
      
      await connectToDb();

      // 1. Obtener los últimos 10 títulos para evitar repeticiones (de ambas fuentes)
      const recentPosts: Post[] = await getBlogPosts(10);
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
      
      return NextResponse.json({ success: true, title: newPost.title, slug: newPost.slug });
      
    } catch (error) {
      console.error(`Error durante la ejecución de la tarea CRON (Intento ${attempt}/${MAX_RETRIES}):`, error);
      const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
      logEvent('Cron Job Attempt Failed', { error: errorMessage, attempt }, 'warn');

      if (attempt === MAX_RETRIES) {
        logEvent('Cron Job Failed After Max Retries', { error: errorMessage }, 'error');
        return NextResponse.json({ message: 'Error al generar el artículo después de varios intentos.', error: errorMessage }, { status: 500 });
      }
      
      await sleep(RETRY_DELAY_MS);
    }
  }

  // This part should not be reachable if logic is correct, but serves as a fallback.
  return NextResponse.json({ message: 'La tarea CRON falló inesperadamente.' }, { status: 500 });
}
