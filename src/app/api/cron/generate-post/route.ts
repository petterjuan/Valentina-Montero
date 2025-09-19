
import { NextRequest, NextResponse } from 'next/server';
import { getBlogPosts } from '@/app/actions';
import { generateBlogPost } from '@/ai/flows/generate-blog-post';
import { logEvent } from '@/lib/logger';
import { Post } from '@/types';
import PostModel from '@/models/Post';
import connectToDb from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Vercel Cron Job security
  const authHeader = request.headers.get('authorization');
  const vercelCronSecret = request.headers.get('x-vercel-cron-secret');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
      console.error('CRON_SECRET no está configurado en las variables de entorno.');
      return NextResponse.json({ message: 'Error de configuración del servidor.' }, { status: 500 });
  }
  
  const providedSecret = vercelCronSecret || (authHeader ? authHeader.replace('Bearer ', '') : undefined);

  if (providedSecret !== cronSecret) {
    logEvent('Cron Job Failed - Unauthorized', { reason: 'Secret mismatch or not provided' }, 'error');
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  try {
    logEvent('Cron Job Started: Generate Blog Post', {});
    console.log('Iniciando tarea CRON: Generación de artículo de blog.');
    
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
    logEvent('Cron Job Success: Blog Post Generated and Saved to MongoDB', { title: newPost.title, slug: newPost.slug });
    
    return NextResponse.json({ success: true, title: newPost.title, slug: newPost.slug });
    
  } catch (error) {
    console.error('Error durante la ejecución de la tarea CRON:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
    logEvent('Cron Job Failed', { error: errorMessage }, 'error');
    return NextResponse.json({ message: 'Error al generar el artículo.', error: errorMessage }, { status: 500 });
  }
}
