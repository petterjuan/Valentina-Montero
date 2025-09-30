import { Button } from "components/ui/button";
import Image from "next/image";
import Link from "next/link";
import placeholderImages from "lib/placeholder-images.json";

export default function MeetTheCoachSection() {
  return (
    <section id="about" className="py-16 sm:py-24 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
              Conoce a tu Coach, Valentina Montero
            </h2>
            <p className="mt-6 text-muted-foreground">
              Con más de una década de experiencia en entrenamiento personal y ciencia de la nutrición, he dedicado mi carrera a ayudar a las personas a desbloquear su verdadero potencial. Mi filosofía va más allá de la transformación física; se trata de construir hábitos sostenibles, fomentar una mentalidad resiliente y crear una vida que ames en un cuerpo del que te sientas orgullosa.
            </p>
            <p className="mt-4 text-muted-foreground">
              Ya sea que estés empezando o buscando superar un estancamiento, te proporciono la experiencia, el apoyo y la responsabilidad que necesitas para tener éxito.
            </p>
            <Button asChild size="lg" className="mt-8 font-bold">
              <Link href="#programs">¡Estoy Lista!</Link>
            </Button>
          </div>
          <div className="order-1 md:order-2">
            <Image
              src={placeholderImages.meetTheCoach.src}
              alt="Coach Valentina Montero"
              width={600}
              height={700}
              className="rounded-lg shadow-lg aspect-[6/7] object-cover w-full"
              data-ai-hint={placeholderImages.meetTheCoach.aiHint}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
