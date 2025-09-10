
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
import { getTestimonials } from "@/app/actions";
import { useEffect, useState } from "react";

const fallbackTestimonials: Omit<Testimonial, "id" | "_id">[] = [
  {
    name: "Maria G.",
    story: "¡Valentina cambió mi vida! Perdí 9 kilos y gané muchísima confianza. Su plan de 12 semanas fue duro pero increíblemente gratificante.",
    image: "https://picsum.photos/100/100?random=13",
    aiHint: "happy woman",
  },
  {
    name: "Ana P.",
    story: "La guía de nutrición fue un antes y un después. Finalmente entiendo cómo alimentar mi cuerpo correctamente. Valentina es un gran apoyo y sabe mucho.",
    image: "https://picsum.photos/100/100?random=14",
    aiHint: "woman portrait",
  },
  {
    name: "Laura M.",
    story: "Después de solo 12 semanas, mis niveles de energía están por las nubes y he alcanzado todas mis metas de fuerza iniciales. Fue la mejor inversión en mi salud.",
    image: "https://picsum.photos/100/100?random=15",
    aiHint: "woman hiking",
  },
  {
    name: "Sofia R.",
    story: "Nunca pensé que disfrutaría hacer ejercicio. El plan personalizado me mantuvo enganchada y nunca me he sentido más fuerte. ¡Recomiendo el plan de 6 semanas!",
    image: "https://picsum.photos/100/100?random=16",
    aiHint: "smiling woman",
  },
];

export default function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState<Omit<Testimonial, "id" | "_id">[]>(fallbackTestimonials);

    useEffect(() => {
        async function fetchTestimonials() {
            const fetchedTestimonials = await getTestimonials();
            if (fetchedTestimonials && fetchedTestimonials.length > 0) {
                setTestimonials(fetchedTestimonials);
            }
        }
        fetchTestimonials();
    }, []);


  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
            Historias de Éxito
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Mira lo que mis clientas tienen que decir sobre su viaje de transformación.
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
