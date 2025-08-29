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
    title: "5 Common Fitness Myths Debunked",
    excerpt: "Stop letting these common misconceptions hold you back from achieving your fitness goals. We're setting the record straight.",
    imageUrl: "https://picsum.photos/600/400?random=5",
    aiHint: "gym equipment",
    slug: "#",
  },
  {
    title: "The Ultimate Guide to Meal Prepping",
    excerpt: "Save time, eat healthier, and stay on track with your nutrition. Our step-by-step guide makes meal prep easy and enjoyable.",
    imageUrl: "https://picsum.photos/600/400?random=6",
    aiHint: "healthy food",
    slug: "#",
  },
  {
    title: "How to Stay Motivated on Your Fitness Journey",
    excerpt: "Motivation comes and goes. Learn the secrets to building discipline and staying consistent even when you don't feel like it.",
    imageUrl: "https://picsum.photos/600/400?random=7",
    aiHint: "person running",
    slug: "#",
  },
];

export default function BlogSection() {
  return (
    <section id="blog" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
            From the Blog
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get the latest tips, tricks, and insights on fitness, nutrition, and mindset.
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
                  <Link href={post.slug}>Read More</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
