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

const blogPosts = [
  {
    title: "5 Mitos Comunes del Fitness Desmentidos",
    excerpt: "Deja que estas ideas falsas te impidan alcanzar tus metas. Aclaramos las cosas de una vez por todas.",
    imageUrl: "https://picsum.photos/600/400?random=8",
    aiHint: "woman working-out",
    slug: "#",
  },
  {
    title: "La Guía Definitiva para Preparar Comidas",
    excerpt: "Ahorra tiempo, come más sano y mantén tu nutrición bajo control. Nuestra guía paso a paso hace que la preparación de comidas sea fácil y agradable.",
    imageUrl: "https://picsum.photos/600/400?random=9",
    aiHint: "woman eating-healthy",
    slug: "#",
  },
  {
    title: "Cómo Mantener la Motivación en tu Viaje Fitness",
    excerpt: "La motivación va y viene. Aprende los secretos para desarrollar la disciplina y ser constante incluso cuando no tienes ganas.",
    imageUrl: "https://picsum.photos/600/400?random=10",
    aiHint: "woman running",
    slug: "#",
  },
];

export default function BlogSection() {
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
          {blogPosts.map((post) => (
            <Card key={post.title} className="flex flex-col overflow-hidden">
              <div className="aspect-video relative">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  data-ai-hint={post.aiHint}
                />
              </div>
              <CardHeader>
                <CardTitle className="font-headline">{post.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription>{post.excerpt}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={post.slug}>Leer Más</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
