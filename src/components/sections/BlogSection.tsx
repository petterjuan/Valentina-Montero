
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

const fallbackPosts: Omit<Post, "_id" | "id">[] = [
    {
        title: "5 Mitos del Fitness que Debes Dejar de Creer Hoy",
        slug: "5-mitos-fitness",
        excerpt: "Desmentimos las creencias más comunes que te impiden alcanzar tus metas. Prepárate para sorprenderte y cambiar tu enfoque.",
        content: "<p>El mundo del fitness está lleno de información, pero no toda es correcta. Aquí desmentimos 5 mitos que probablemente has escuchado y que podrían estar saboteando tu progreso. Desde 'sudar más es quemar más grasa' hasta 'las pesas te harán voluminosa', es hora de separar la realidad de la ficción para que puedas entrenar de manera más inteligente y efectiva.</p>",
        imageUrl: "https://picsum.photos/seed/post1/600/400",
        aiHint: "fitness myth",
        createdAt: new Date("2024-05-10T10:00:00Z"),
    },
    {
        title: "Nutrición 101: Cómo Balancear tus Macronutrientes",
        slug: "nutricion-101-macros",
        excerpt: "Proteínas, carbohidratos y grasas. Te explicamos de forma sencilla qué son, por qué los necesitas y cómo distribuirlos para tus objetivos.",
        content: "<p>Entender los macronutrientes es la base de una nutrición exitosa. En este artículo, te guiaremos a través de los conceptos básicos de las proteínas, los carbohidratos y las grasas. Aprenderás por qué cada uno es vital para tu energía, recuperación y salud general, y te daremos estrategias prácticas para balancearlos según si tu objetivo es perder peso, ganar músculo o simplemente sentirte mejor.</p>",
        imageUrl: "https://picsum.photos/seed/post2/600/400",
        aiHint: "healthy food",
        createdAt: new Date("2024-05-15T11:30:00Z"),
    },
    {
        title: "La Importancia del Descanso: Más Allá del Gimnasio",
        slug: "importancia-del-descanso",
        excerpt: "El entrenamiento es solo una parte de la ecuación. Descubre por qué el sueño y la recuperación activa son cruciales para tu transformación.",
        content: "<p>Puedes entrenar tan duro como quieras, pero si no le das a tu cuerpo el tiempo y las herramientas para recuperarse, no verás los resultados que esperas. Hablamos sobre la ciencia del descanso, la importancia del sueño de calidad y las técnicas de recuperación activa que puedes implementar para reducir el dolor muscular, prevenir lesiones y maximizar tus ganancias. ¡El verdadero crecimiento ocurre cuando descansas!</p>",
        imageUrl: "https://picsum.photos/seed/post3/600/400",
        aiHint: "woman resting",
        createdAt: new Date("2024-05-20T09:00:00Z"),
    },
];


export default async function BlogSection() {
  let fetchedPosts: Post[] | null = null;

  try {
    fetchedPosts = await getBlogPosts(3);
  } catch (e) {
     // Errors are logged in the action, here we just ensure fallback.
     console.error(`[BlogSection] Could not fetch posts, will use fallback data.`);
  }
  
  const displayPosts = (fetchedPosts && fetchedPosts.length > 0) ? fetchedPosts : fallbackPosts;

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
            ))
          ) : (
             <div className="md:col-span-2 lg:col-span-3 text-center py-12">
                <h3 className="text-xl font-semibold">No hay artículos aún</h3>
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
