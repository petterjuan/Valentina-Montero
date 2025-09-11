
import { getTestimonials } from "@/app/actions";
import type { Testimonial } from "@/types";
import TestimonialsCarousel from "./TestimonialsCarousel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";


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
    let dbError: string | null = null;

    try {
        const fetchedTestimonials = await getTestimonials();
        if (fetchedTestimonials && fetchedTestimonials.length > 0) {
            testimonials = fetchedTestimonials;
        } else {
            // This case can mean empty collection or an issue, we rely on fallback
            testimonials = fallbackTestimonials;
        }
    } catch(e) {
        if (e instanceof Error) {
            dbError = e.message;
        } else {
            dbError = "Ocurrió un error desconocido al cargar los testimonios.";
        }
        console.error(`[TestimonialsSection] Error: ${dbError}, using fallback.`);
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
        
        {dbError && (
          <Alert variant="destructive" className="my-8 max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de Conexión con la Base de Datos</AlertTitle>
            <AlertDescription>
              {dbError}
            </AlertDescription>
          </Alert>
        )}

        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
