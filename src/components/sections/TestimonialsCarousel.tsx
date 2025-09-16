
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
import type { Testimonial } from "@/types";
import { Star } from "lucide-react";

interface TestimonialsCarouselProps {
    testimonials: (Testimonial | Omit<Testimonial, "id" | "_id">)[];
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/50"
        }`}
      />
    ))}
  </div>
);

export default function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  return (
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
          <CarouselItem key={'id' in testimonial ? testimonial.id : index} className="md:basis-1/2 lg:basis-1/2">
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
                  <div className="mt-2">
                    <StarRating rating={testimonial.rating || 5} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  )
}
