
import { getBlogPostBySlug } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DOMPurify from 'isomorphic-dompurify';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
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

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const sanitizedContent = DOMPurify.sanitize(post.content || "");

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

          <div className="text-center">
            <h3 className="text-2xl font-bold font-headline">¿Lista para el siguiente paso?</h3>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              La información es poder, pero la acción es la clave. Si estás lista para una guía personalizada y un plan que funcione, explora mis programas.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/#programs">Ver mis Programas</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
