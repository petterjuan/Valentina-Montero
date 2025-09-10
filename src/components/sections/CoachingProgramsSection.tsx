
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import PlanSignupDialog from "@/components/sections/PlanSignupDialog";
import Image from "next/image";
import { getPrograms } from "@/app/actions";
import { AlertTriangle } from "lucide-react";

export interface Program {
  title: string;
  price: number;
  features: string[];
  image?: {
    src: string;
    alt: string;
  };
  isPopular?: boolean;
  isDigital?: boolean;
  handle?: string;
}

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
  
  let programs: Program[] | null = null;
  let error: string | null = null;

  try {
    programs = await getPrograms(collectionHandle, maxProducts);
  } catch (e) {
    console.error(`[CoachingProgramsSection] Error: ${e instanceof Error ? e.message : String(e)}`);
    error = "No se pudieron cargar los programas desde Shopify. Por favor, verifica la configuración de la API.";
  }
  
  const hasPrograms = programs && programs.length > 0;

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
          {error && (
             <div className="md:col-span-3">
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <p className="text-sm font-semibold text-destructive">{error}</p>
                        </div>
                    </CardContent>
                </Card>
             </div>
          )}

          {!error && !hasPrograms && (
            <div className="md:col-span-3 text-center py-12">
                <h3 className="text-xl font-semibold">No hay programas disponibles</h3>
                <p className="text-muted-foreground mt-2">No se encontraron productos en la colección '{collectionHandle}'.</p>
            </div>
          )}
          
          {hasPrograms && programs.map((program) => (
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
                    <div className="flex items-baseline gap-1">
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

              <CardFooter>
                 <PlanSignupDialog program={program}>
                    <Button className="w-full font-bold">
                        {program.isDigital ? 'Comprar PDF' : 'Elegir Plan'}
                    </Button>
                 </PlanSignupDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
