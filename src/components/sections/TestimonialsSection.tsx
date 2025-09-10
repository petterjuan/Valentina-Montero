
import { getTestimonials } from "@/app/actions";
import type { Testimonial } from "@/types";
import TestimonialsCarousel from "./TestimonialsCarousel";

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

export default async function TestimonialsSection() {
    let testimonials: (Testimonial | Omit<Testimonial, "id" | "_id">)[] = await getTestimonials();

    let usingFallback = false;
    if (!testimonials || testimonials.length === 0) {
        testimonials = fallbackTestimonials;
        usingFallback = true;
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
           {usingFallback && (
              <p className="mt-2 text-sm text-yellow-600">
                ⚠️ Mostrando datos de respaldo. Verifica la conexión con MongoDB.
              </p>
          )}
        </div>
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
