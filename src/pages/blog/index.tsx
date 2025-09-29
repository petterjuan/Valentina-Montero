
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Post } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

export default function BlogIndexPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPosts() {
            try {
                const response = await fetch('/api/posts?limit=20');
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }
                const fetchedPosts = await response.json();
                setPosts(fetchedPosts);
            } catch(e) {
                console.error("[BlogIndexPage] Error fetching posts, page will show empty state.", e);
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, []);
    
    // Separate Shopify (manual) from MongoDB (AI) posts
    const manualPosts = posts.filter(p => p.source === 'Shopify');
    const aiPosts = posts.filter(p => p.source === 'MongoDB');

    const featuredPost = manualPosts[0] || aiPosts[0]; // Prioritize manual post as featured
    const otherPosts = posts.filter(p => p.id !== featuredPost?.id);

    if (loading) {
        return (
             <section className="py-16 sm:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
                            Blog de Fitness y Bienestar
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Bienvenida a mi rincón de conocimiento. Aquí comparto todo lo que he aprendido para ayudarte a alcanzar tus metas.
                        </p>
                    </div>
                    <p className="text-center mt-16">Cargando artículos...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
                        Blog de Fitness y Bienestar
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Bienvenida a mi rincón de conocimiento. Aquí comparto todo lo que he aprendido para ayudarte a alcanzar tus metas.
                    </p>
                </div>

                {posts.length > 0 && featuredPost && (
                  <div className="mt-16 space-y-16">
                      {/* Featured Post */}
                      <article className="group grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                          <Link href={`/blog/${featuredPost.slug}`} className="aspect-video relative block w-full overflow-hidden rounded-lg">
                              <Image
                                  src={featuredPost.imageUrl || "https://picsum.photos/seed/blog-fallback/600/400"}
                                  alt={featuredPost.title}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  priority
                                  data-ai-hint={featuredPost.aiHint}
                              />
                          </Link>
                          <div>
                              <p className="text-sm text-primary font-semibold">Más Reciente</p>
                              <h2 className="mt-2 text-3xl font-bold font-headline group-hover:text-primary transition-colors">
                                  <Link href={`/blog/${featuredPost.slug}`}>
                                      {featuredPost.title}
                                  </Link>
                              </h2>
                              <p className="mt-4 text-muted-foreground">{featuredPost.excerpt}</p>
                              <Button asChild variant="link" className="px-0 mt-4">
                                  <Link href={`/blog/${featuredPost.slug}`}>Leer Más</Link>
                              </Button>
                          </div>
                      </article>
                      
                      <Separator />

                      {/* Other Posts */}
                      {otherPosts.length > 0 && (
                          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                              {otherPosts.map((post) => (
                                  <Card key={post.slug} className="flex flex-col overflow-hidden">
                                      <Link href={`/blog/${post.slug}`} className="aspect-video relative block">
                                          <Image
                                              src={post.imageUrl || "https://picsum.photos/seed/blog-fallback-2/600/400"}
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
                              ))}
                          </div>
                      )}
                  </div>
                )}
                
                {posts.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">
                        <h3 className="text-xl font-semibold">No hay artículos aún</h3>
                        <p className="text-muted-foreground mt-2">Vuelve pronto para leer nuevos artículos o comprueba las conexiones si eres el administrador.</p>
                    </div>
                )}
            </div>
        </section>
    )
}
