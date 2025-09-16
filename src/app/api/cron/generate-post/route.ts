
import { NextRequest, NextResponse } from 'next/server';
import { getBlogPosts } from '@/app/actions';
import { generateBlogPost } from '@/ai/flows/generate-blog-post';
import connectToDb from '@/lib/mongoose';
import PostModel from '@/models/Post';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
      console.error('CRON_SECRET no está configurado en las variables de entorno.');
      return NextResponse.json({ message: 'Error de configuración del servidor.' }, { status: 500 });
  }
  
  const providedSecret = authHeader?.split(' ')[1];

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  try {
    console.log('Iniciando tarea CRON: Generación de artículo de blog.');

    // 1. Conectar a la base de datos
    await connectToDb();

    // 2. Obtener los últimos 10 títulos para evitar repeticiones
    const recentPosts = await getBlogPosts(10);
    const existingTitles = recentPosts.map(p => p.title);
    console.log(`Títulos existentes enviados a la IA: ${existingTitles.join(', ')}`);

    // 3. Llamar al flujo de IA para generar un nuevo artículo
    const newPostData = await generateBlogPost({ existingTitles });
    console.log(`IA generó un nuevo artículo con título: "${newPostData.title}"`);

    // 4. Guardar el nuevo artículo en la base de datos
    const postToSave = new PostModel({
      ...newPostData,
      createdAt: new Date(),
    });
    await postToSave.save();

    console.log('Tarea CRON completada: Nuevo artículo guardado en la base de datos.');
    return NextResponse.json({ success: true, title: newPostData.title });
    
  } catch (error) {
    console.error('Error durante la ejecución de la tarea CRON:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
    return NextResponse.json({ message: 'Error al generar el artículo.', error: errorMessage }, { status: 500 });
  }
}
