
"use client";

import { getTestimonials } from "@/app/actions";
import type { Testimonial } from "@/types";
import TestimonialsCarousel from "./TestimonialsCarousel";
import placeholderImages from "@/lib/placeholder-images.json";
import { useEffect, useState } from "react";

const fallbackTestimonials: Omit<Testimonial, "_id" | "id">[] = [
  {
    name: "Clienta Satisfecha",
    story: "Este programa superó mis expectativas. ¡Me siento más fuerte y con más energía que nunca!",
    image: placeholderImages.testimonials.fallback1.src,
    aiHint: placeholderImages.testimonials.fallback1.aiHint,
    rating: 5,
  },
  {
    name: "Participante Feliz",
    story: "La guía y el apoyo de Valentina fueron clave para mi transformación. ¡Totalmente recomendado!",
    image: placeholderImages.testimonials.fallback2.src,
    aiHint: placeholderImages.testimonials.fallback2.aiHint,
    rating: 5,
  },
  {
    name: "Testimonio de Éxito",
    story: "Un enfoque muy profesional y personalizado. Los resultados hablan por sí solos.",
    image: placeholderImages.testimonials.fallback3.src,
    aiHint: placeholderImages.testimonials.fallback3.aiHint,
    rating: 5,
  },
];

export default function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState<(Testimonial | Omit<Testimonial, "id" | "_id">)[]>([]);

    useEffect(() => {
      async function fetchTestimonials() {
        try {
            const fetchedTestimonials = await getTestimonials();
            if (fetchedTestimonials && fetchedTestimonials.length > 0) {
                setTestimonials(fetchedTestimonials);
            } else {
                setTestimonials(fallbackTestimonials);
            }
        } catch(e) {
            console.error(`[TestimonialsSection] Could not fetch testimonials, will use fallback data.`);
            setTestimonials(fallbackTestimonials);
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
        
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
