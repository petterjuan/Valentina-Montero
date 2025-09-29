
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBlogPosts } from "@/app/actions";
import { Post } from "@/types";
import { useEffect, useState } from "react";

export default function BlogSection() {
  const [displayPosts, setDisplayPosts] = useState<Post[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const posts = await getBlogPosts(3);
        setDisplayPosts(posts);
      } catch (e) {
        console.error(`[BlogSection] Could not fetch posts, section will be empty.`, e);
      }
    }
    fetchPosts();
  }, []);

  return (
    <section id="blog" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
            Desde el Blog
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Obtén los últimos consejos, trucos e ideas sobre fitness, nutrición y mentalidad.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayPosts.length > 0 ? (
            displayPosts.map((post) => (
              <Card key={post.slug} className="flex flex-col overflow-hidden">
                <Link href={`/blog/${post.slug}`} className="aspect-video relative block">
                  <Image
                    src={post.imageUrl || "https://picsum.photos/seed/blog-fallback/600/400"}
                    alt={post.title}
                    fill
                    className="object-cover"
                    data-ai-hint={post.aiHint}
                  />
                </Link>
                <CardHeader>
                  <CardTitle className="font-headline">{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription>{post.excerpt}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/blog/${post.slug}`}>Leer Más</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
             <div className="md:col-span-2 lg:col-span-3 text-center py-12">
                <h3 className="text-xl font-semibold">No hay artículos para mostrar</h3>
                <p className="text-muted-foreground mt-2">Vuelve pronto para leer nuevos artículos.</p>
            </div>
          )}
        </div>
        {displayPosts.length > 0 && (
            <div className="mt-12 text-center">
                <Button asChild>
                    <Link href="/blog">Ver todos los artículos</Link>
                </Button>
            </div>
        )}
      </div>
    </section>
  );
}
