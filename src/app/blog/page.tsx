import { getBlogPosts } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Post } from "@/types";
import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import placeholderImages from "@/lib/placeholder-images.json";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Blog | Valentina Montero Fitness",
  description: "Consejos, trucos e ideas sobre fitness, nutrición y mentalidad de la mano de Valentina Montero.",
};

const fallbackPosts: Omit<Post, "_id" | "id">[] = [
    {
        title: "5 Mitos del Fitness que Debes Dejar de Creer Hoy",
        slug: "5-mitos-fitness",
        excerpt: "Desmentimos las creencias más comunes que te impiden alcanzar tus metas. Prepárate para sorprenderte y cambiar tu enfoque.",
        content: "<p>...</p>",
        imageUrl: placeholderImages.blog.fallback1.src,
        aiHint: placeholderImages.blog.fallback1.aiHint,
        createdAt: new Date("2024-05-10T10:00:00Z"),
    },
    {
        title: "Nutrición 101: Cómo Balancear tus Macronutrientes",
        slug: "nutricion-101-macros",
        excerpt: "Proteínas, carbohidratos y grasas. Te explicamos de forma sencilla qué son, por qué los necesitas y cómo distribuirlos para tus objetivos.",
        content: "<p>...</p>",
        imageUrl: placeholderImages.blog.fallback2.src,
        aiHint: placeholderImages.blog.fallback2.aiHint,
        createdAt: new Date("2024-05-15T11:30:00Z"),
    },
    {
        title: "La Importancia del Descanso: Más Allá del Gimnasio",
        slug: "importancia-del-descanso",
        excerpt: "El entrenamiento es solo una parte de la ecuación. Descubre por qué el sueño y la recuperación activa son cruciales para tu transformación.",
        content: "<p>...</p>",
imageUrl: placeholderImages.blog.fallback3.src,
        aiHint: placeholderImages.blog.fallback3.aiHint,
        createdAt: new Date("2024-05-20T09:00:00Z"),
    },
];

export default async function BlogIndexPage() {
    let posts: (Post | Omit<Post, "_id" | "id">)[] = [];
    try {
        const fetchedPosts = await getBlogPosts();
        if (fetchedPosts && fetchedPosts.length > 0) {
            posts = fetchedPosts;
        } else {
            posts = fallbackPosts;
        }
    } catch(e) {
        console.error("[BlogIndexPage] Error fetching posts, using fallback.");
        posts = fallbackPosts;
    }
    
    const featuredPost = posts[0];
    const otherPosts = posts.slice(1);

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

                {posts.length > 0 && (
                  <div className="mt-16 space-y-16">
                      {/* Featured Post */}
                      <article className="group grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                          <Link href={`/blog/${featuredPost.slug}`} className="aspect-video relative block w-full overflow-hidden rounded-lg">
                              <Image
                                  src={featuredPost.imageUrl || "https://picsum.photos/600/400?random=8"}
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
                                              src={post.imageUrl || "https://picsum.photos/600/400?random=8"}
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
                        <p className="text-muted-foreground mt-2">Vuelve pronto para leer nuevos artículos o comprueba la conexión con la base de datos si eres el administrador.</p>
                    </div>
                )}
            </div>
        </section>
    )
}
