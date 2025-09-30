
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Clock } from "lucide-react";
import PlanSignupDialog from "@/components/sections/PlanSignupDialog";
import Image from "next/image";
import placeholderImages from "@/lib/placeholder-images.json";
import Link from "next/link";
import type { Program } from "@/types";
import { getPrograms } from "@/app/actions";

const fallbackPrograms: Program[] = [
    {
      title: "Plan de Coaching de 12 Semanas",
      price: 499,
      features: [
        "Seguimiento personalizado semanal",
        "Plan de nutrición adaptado a tus metas",
        "Acceso a comunidad privada",
        "Check-ins por video llamada",
      ],
      isPopular: true,
      image: { src: placeholderImages.programs.fallback1.src, alt: placeholderImages.programs.fallback1.alt },
    },
    {
      title: "Plan de Coaching de 6 Semanas",
      price: 299,
      features: [
        "Plan de entrenamiento intensivo",
        "Guía de nutrición y recetas",
        "Soporte por email",
        "Revisión de progreso quincenal",
      ],
      image: { src: placeholderImages.programs.fallback2.src, alt: placeholderImages.programs.fallback2.alt },
    },
    {
      title: 'Guía PDF "Muscle Bites"',
      price: 29,
      features: [
        "Más de 50 recetas altas en proteína",
        "Tips para meal prep",
        "Guía de suplementación básica",
        "Acceso instantáneo de por vida",
      ],
      isDigital: true,
      image: { src: placeholderImages.programs.fallback3.src, alt: placeholderImages.programs.fallback3.alt },
      handle: 'muscle-bites-pdf-guide',
    },
];

interface CoachingProgramsSectionProps {
  collectionHandle?: string;
  title?: string;
  description?: string;
  maxProducts?: number;
}

export default async function CoachingProgramsSection({
  collectionHandle = "coaching-programs",
  title = "¿Lista para Comprometerte?",
  description = "Elige el plan que mejor se adapte a tus metas. Empecemos este viaje juntas.",
  maxProducts = 10,
}: CoachingProgramsSectionProps) {
  
  let displayPrograms: Program[] = [];
  let connectionFailed = false;

  try {
    const fetchedPrograms = await getPrograms(collectionHandle, maxProducts);
    if (fetchedPrograms && fetchedPrograms.length > 0) {
      displayPrograms = fetchedPrograms;
    } else {
      displayPrograms = fallbackPrograms;
    }
  } catch (e) {
    console.error(`[CoachingProgramsSection] Error fetching programs, using fallback. Error: ${e instanceof Error ? e.message : String(e)}`);
    displayPrograms = fallbackPrograms;
    connectionFailed = true;
  }

  return (
    <section id="programs" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">
            {title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:max-w-7xl lg:mx-auto">
          {displayPrograms && displayPrograms.length > 0 ? (
            displayPrograms.map((program) => (
              <Card
                key={program.handle || program.title}
                className={`flex flex-col ${program.isPopular ? "border-primary shadow-lg" : ""}`}
              >
                <CardHeader className="p-0">
                   {program.image && (
                      <div className="aspect-video relative w-full overflow-hidden rounded-t-lg">
                          <Image 
                              src={program.image.src}
                              alt={program.image.alt}
                              fill
                              className="object-cover"
                          />
                      </div>
                   )}
                  <div className="p-6 items-center flex flex-col">
                      {program.isPopular && (
                        <div className="mb-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                          MÁS POPULAR
                        </div>
                      )}
                      <CardTitle className="text-2xl font-headline text-center">{program.title}</CardTitle>
                      <div className="flex items-baseline gap-1 font-code">
                        <span className="text-4xl font-bold tracking-tight">${program.price}</span>
                        {!program.isDigital && <span className="text-sm font-semibold text-muted-foreground">/ plan</span>}
                      </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {program.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="mr-2 mt-1 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="flex flex-col items-stretch gap-3">
                   {!program.isDigital && (
                     <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                       <Clock className="h-3 w-3"/>
                       ¡Plazas limitadas para asegurar la calidad!
                     </p>
                   )}
                   {program.isDigital && program.handle === 'muscle-bites-pdf-guide' ? (
                       <Button asChild className="w-full font-bold">
                           <Link href="/muscle-bites">Comprar Guía</Link>
                       </Button>
                   ) : (
                       <PlanSignupDialog program={program}>
                          <Button className="w-full font-bold">
                              {program.isDigital ? 'Comprar PDF' : 'Elegir Plan'}
                          </Button>
                       </PlanSignupDialog>
                   )}
                </CardFooter>
              </Card>
            ))
          ) : (
             <div className="col-span-1 md:col-span-3 text-center py-12 bg-muted/50 rounded-lg">
                <h3 className="text-xl font-semibold text-foreground">
                  {connectionFailed 
                    ? "No se pudieron cargar los programas."
                    : "No hay programas disponibles en esta colección."
                  }
                </h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    {connectionFailed
                      ? "Si eres el administrador, verifica que las credenciales de la API de Shopify (token y dominio) sean correctas en las variables de entorno."
                      : `Si eres el administrador, asegúrate de que haya productos activos en la colección de Shopify con el handle: \`${collectionHandle}\`.`
                    }
                </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
