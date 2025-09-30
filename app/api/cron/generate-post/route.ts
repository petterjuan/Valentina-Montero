
import { NextResponse } from 'next/server';
import { logEvent } from 'lib/logger';
import { generateNewBlogPost } from 'lib/actions';

export const revalidate = 0;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(req: Request) {
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
      
      const result = await generateNewBlogPost();

      if (result.success) {
        logEvent('Cron Job Succeeded', { title: result.title, slug: result.slug });
        return NextResponse.json({ success: true, title: result.title, slug: result.slug });
      } else {
        throw new Error(result.error || 'La acción de generar post falló sin un error específico.');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
      console.error(`Error durante la ejecución de la tarea CRON (Intento ${attempt}/${MAX_RETRIES}):`, errorMessage);
      logEvent('Cron Job Attempt Failed', { error: errorMessage, attempt }, 'warn');

      if (attempt === MAX_RETRIES) {
        logEvent('Cron Job Failed After Max Retries', { error: errorMessage }, 'error');
        return NextResponse.json({ message: 'Error al generar el artículo después de varios intentos.', error: errorMessage }, { status: 500 });
      }
      
      await sleep(RETRY_DELAY_MS);
    }
  }

  // This part should ideally not be reached, but it's a fallback.
  return NextResponse.json({ message: 'La tarea CRON falló inesperadamente.' }, { status: 500 });
}
