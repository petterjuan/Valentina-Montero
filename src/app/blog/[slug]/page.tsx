
import { getBlogPostBySlug, getBlogPosts } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Eye, Bot, Building } from "lucide-react";
import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DOMPurify from 'isomorphic-dompurify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60; // Revalidate every 60 seconds

export async function generateStaticParams() {
  const posts = await getBlogPosts(20); // Get recent posts to generate static pages
  if (!posts) return [];
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Post no encontrado",
    };
  }

  return {
    title: `${post.title} | Blog de Valentina Montero`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: post.imageUrl || "",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const sanitizedContent = DOMPurify.sanitize(post.content || "");

  const SourceIcon = post.source === 'MongoDB' ? Bot : Building;
  const sourceText = post.source === 'MongoDB' ? 'Contenido por IA' : 'Escrito por Valentina';

  return (
    <article className="py-12 sm:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" asChild className="mb-8">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Blog
            </Link>
          </Button>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl font-headline">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Publicado el {new Date(post.createdAt).toLocaleDateString("es-ES", {
                  year: 'numeric', month: 'long', day: 'numeric'
              })}</span>
              <span className="text-muted-foreground/50">|</span>
              <Badge variant="outline" className="flex items-center gap-1.5">
                  <SourceIcon className="h-3.5 w-3.5" />
                  {sourceText}
              </Badge>
            </div>
          </div>
          
          {post.imageUrl && (
            <div className="relative aspect-video w-full my-8 overflow-hidden rounded-lg">
                <Image 
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                />
            </div>
          )}
          
          <div 
            className="prose prose-lg dark:prose-invert max-w-none mt-8"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          <Separator className="my-12" />

          <div className="space-y-8">
            <h3 className="text-2xl font-bold font-headline text-center">¿Lista para el Siguiente Paso?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Download className="h-5 w-5 text-primary"/>
                            Guía Gratuita
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <CardDescription>
                        Consigue mi guía "Estrategias para lograr 10k pasos al día" y empieza a transformar tu rutina.
                        </CardDescription>
                    </CardContent>
                    <div className="p-6 pt-0">
                         <Button asChild className="w-full">
                            <Link href="/#lead-magnet">¡La Quiero!</Link>
                        </Button>
                    </div>
                </Card>
                 <Card className="flex flex-col border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                           <Eye className="h-5 w-5 text-primary"/>
                            Ver Programas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <CardDescription>
                            Explora mis planes de coaching personalizados y encontremos el que mejor se adapte a ti.
                        </CardDescription>
                    </CardContent>
                    <div className="p-6 pt-0">
                         <Button asChild className="w-full">
                            <Link href="/#programs">Ver Mis Programas</Link>
                        </Button>
                    </div>
                </Card>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
