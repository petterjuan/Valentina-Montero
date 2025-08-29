"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import Autoplay from "embla-carousel-autoplay";

const testimonials = [
  {
    name: "Maria G.",
    story: "Valentina changed my life! I lost 20lbs and gained so much confidence. Her 12-week plan was tough but incredibly rewarding.",
    image: "https://picsum.photos/100/100?random=1",
    aiHint: "happy woman",
  },
  {
    name: "Carlos S.",
    story: "I never thought I'd enjoy working out. The personalized plan kept me engaged, and I've never felt stronger. Highly recommend the 6-week kickstart!",
    image: "https://picsum.photos/100/100?random=2",
    aiHint: "smiling man",
  },
  {
    name: "Ana P.",
    story: "The nutrition guidance was a game-changer. I finally understand how to fuel my body properly. Valentina is supportive and knowledgeable.",
    image: "https://picsum.photos/100/100?random=3",
    aiHint: "woman portrait",
  },
  {
    name: "David L.",
    story: "After just 12 weeks, my energy levels are through the roof and I've hit all my initial strength goals. This was the best investment in my health.",
    image: "https://picsum.photos/100/100?random=4",
    aiHint: "man hiking",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
            Success Stories
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See what my clients have to say about their transformation journey.
          </p>
        </div>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          className="mt-12 w-full max-w-4xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
                <div className="p-1">
                  <Card className="h-full">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={80}
                        height={80}
                        className="rounded-full mb-4"
                        data-ai-hint={testimonial.aiHint}
                      />
                      <p className="text-muted-foreground italic">
                        &quot;{testimonial.story}&quot;
                      </p>
                      <p className="mt-4 font-bold font-headline text-lg text-foreground">
                        - {testimonial.name}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  );
}
