
import { NextRequest, NextResponse } from 'next/server';
import { getBlogPosts } from '@/app/actions';
import { generateBlogPost } from '@/ai/flows/generate-blog-post';
import { logEvent } from '@/lib/logger';
import { Post } from '@/types';

export const dynamic = 'force-dynamic';

const CREATE_ARTICLE_MUTATION = /* GraphQL */`
  mutation createArticle($input: ArticleInput!) {
    articleCreate(input: $input) {
      article {
        id
        handle
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function publishArticleToShopify(articleData: {
    title: string;
    content: string;
    slug: string;
    excerpt: string;
    tags: string;
}) {
    const { SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_BLOG_HANDLE } = process.env;

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_ACCESS_TOKEN || !SHOPIFY_BLOG_HANDLE) {
        throw new Error("Shopify environment variables for Admin API are not configured.");
    }
    
    const adminEndpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/graphql.json`;

    const input = {
        title: articleData.title,
        contentHtml: articleData.content,
        handle: articleData.slug,
        excerpt: articleData.excerpt,
        blogHandle: SHOPIFY_BLOG_HANDLE,
        published: true,
        tags: articleData.tags,
    };

    const response = await fetch(adminEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
        },
        body: JSON.stringify({
            query: CREATE_ARTICLE_MUTATION,
            variables: { input },
        }),
    });

    const responseBody = await response.json();

    if (responseBody.errors) {
        throw new Error(`Shopify Admin API GraphQL errors: ${JSON.stringify(responseBody.errors)}`);
    }

    const userErrors = responseBody.data?.articleCreate?.userErrors;
    if (userErrors && userErrors.length > 0) {
        throw new Error(`Shopify Admin API user errors: ${userErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ')}`);
    }

    return responseBody.data.articleCreate.article;
}


export async function GET(request: NextRequest) {
  // Vercel Cron Job security
  const authHeader = request.headers.get('authorization');
  const vercelCronSecret = request.headers.get('x-vercel-cron-secret');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
      console.error('CRON_SECRET no está configurado en las variables de entorno.');
      return NextResponse.json({ message: 'Error de configuración del servidor.' }, { status: 500 });
  }
  
  const providedSecret = vercelCronSecret || authHeader?.split(' ')[1];

  if (providedSecret !== cronSecret) {
    logEvent('Cron Job Failed - Unauthorized', {}, 'error');
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  try {
    logEvent('Cron Job Started: Generate Blog Post', {});
    console.log('Iniciando tarea CRON: Generación de artículo de blog.');

    // 1. Obtener los últimos 10 títulos para evitar repeticiones
    const recentPosts: Post[] = await getBlogPosts(10);
    const existingTitles = recentPosts.map(p => p.title);
    console.log(`Títulos existentes enviados a la IA: ${existingTitles.join(', ')}`);

    // 2. Llamar al flujo de IA para generar un nuevo artículo
    const newPostData = await generateBlogPost({ existingTitles });
    console.log(`IA generó un nuevo artículo con título: "${newPostData.title}"`);

    // 3. Publicar el nuevo artículo en Shopify
    const shopifyArticle = await publishArticleToShopify({
        ...newPostData,
        tags: "AI Generated"
    });

    console.log(`Tarea CRON completada: Nuevo artículo publicado en Shopify con ID: ${shopifyArticle.id}`);
    logEvent('Cron Job Success: Blog Post Generated and Published to Shopify', { title: newPostData.title, shopifyId: shopifyArticle.id });
    
    return NextResponse.json({ success: true, title: newPostData.title, shopifyId: shopifyArticle.id });
    
  } catch (error) {
    console.error('Error durante la ejecución de la tarea CRON:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
    logEvent('Cron Job Failed', { error: errorMessage }, 'error');
    return NextResponse.json({ message: 'Error al generar el artículo.', error: errorMessage }, { status: 500 });
  }
}
