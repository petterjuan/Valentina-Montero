
import { getBlogPosts } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Blog | Valentina Montero Fitness",
  description: "Consejos, trucos e ideas sobre fitness, nutrición y mentalidad de la mano de Valentina Montero.",
};

export default async function BlogIndexPage() {
    const posts = await getBlogPosts();

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

                <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {posts && posts.length > 0 ? (
                        posts.map((post) => (
                            <Card key={post.id} className="flex flex-col overflow-hidden">
                                <Link href={`/blog/${post.slug}`} className="aspect-video relative block">
                                    <Image
                                        src={post.imageUrl || "https://picsum.photos/600/400?random=8"}
                                        alt={post.title}
                                        fill
                                        className="object-cover"
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
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">
                            <h3 className="text-xl font-semibold">No hay artículos aún</h3>
                            <p className="text-muted-foreground mt-2">Vuelve pronto para leer nuevos artículos o comprueba la conexión con la base de datos si eres el administrador.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
