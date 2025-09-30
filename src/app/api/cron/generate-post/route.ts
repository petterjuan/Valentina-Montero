
import { NextRequest, NextResponse } from 'next/server';
import { getBlogPosts } from '@/app/actions';
import { generateBlogPost } from '@/ai/flows/generate-blog-post';
import { logEvent } from '@/lib/logger';
import { Post } from '@/types';
import PostModel from '@/models/Post';
import connectToDb from '@/lib/mongoose';

export const revalidate = 0;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
      console.error('CRON_SECRET no está configurado en las variables de entorno.');
      logEvent('Cron Job Failed - Server Misconfiguration', { reason: 'CRON_SECRET is not set' }, 'error');
      return NextResponse.json({ message: 'Error de configuración del servidor.' }, { status: 500 });
  }
  
  if (secret !== cronSecret) {
    logEvent('Cron Job Failed - Unauthorized', { reason: 'Secret in query does not match CRON_SECRET' }, 'error');
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logEvent('Cron Job Started: Generate Blog Post', { attempt });
      console.log(`Iniciando tarea CRON (Intento ${attempt}/${MAX_RETRIES}): Generación de artículo de blog.`);
      
      await connectToDb();

      const recentPosts: Post[] = await getBlogPosts(10);
      const existingTitles = recentPosts.map(p => p.title);
      console.log(`Títulos existentes enviados a la IA: ${existingTitles.join(', ')}`);

      const newPostData = await generateBlogPost({ existingTitles });
      console.log(`IA generó un nuevo artículo con título: "${newPostData.title}"`);

      const newPost = new PostModel({
        ...newPostData,
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

  return NextResponse.json({ message: 'La tarea CRON falló inesperadamente.' }, { status: 500 });
}
