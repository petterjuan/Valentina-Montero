
import { getTestimonials } from "@/app/actions";
import type { Testimonial } from "@/types";
import TestimonialsCarousel from "./TestimonialsCarousel";

const fallbackTestimonials: Omit<Testimonial, "_id" | "id">[] = [
  {
    name: "Clienta Satisfecha",
    story: "Este programa superó mis expectativas. ¡Me siento más fuerte y con más energía que nunca!",
    image: "https://picsum.photos/seed/test1/100/100",
    aiHint: "happy woman",
  },
  {
    name: "Participante Feliz",
    story: "La guía y el apoyo de Valentina fueron clave para mi transformación. ¡Totalmente recomendado!",
    image: "https://picsum.photos/seed/test2/100/100",
    aiHint: "smiling person",
  },
  {
    name: "Testimonio de Éxito",
    story: "Un enfoque muy profesional y personalizado. Los resultados hablan por sí solos.",
    image: "https://picsum.photos/seed/test3/100/100",
    aiHint: "woman portrait",
  },
];

export default async function TestimonialsSection() {
    let testimonials: (Testimonial | Omit<Testimonial, "id" | "_id">)[] = [];

    try {
        const fetchedTestimonials = await getTestimonials();
        if (fetchedTestimonials && fetchedTestimonials.length > 0) {
            testimonials = fetchedTestimonials;
        } else {
            // This case can mean empty collection or an issue, we rely on fallback
            testimonials = fallbackTestimonials;
        }
    } catch(e) {
        // Errors are logged in the action, here we just ensure fallback.
        console.error(`[TestimonialsSection] Could not fetch testimonials, will use fallback data.`);
        testimonials = fallbackTestimonials;
    }

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
