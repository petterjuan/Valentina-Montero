import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Award, HeartPulse, Sparkles } from "lucide-react";
import placeholderImages from "@/lib/placeholder-images.json";

const benefits = [
    {
        icon: <Sparkles className="h-6 w-6 text-accent" />,
        text: "Planes 100% Personalizados",
    },
    {
        icon: <HeartPulse className="h-6 w-6 text-accent" />,
        text: "Enfoque en Salud Sostenible",
    },
    {
        icon: <Award className="h-6 w-6 text-accent" />,
        text: "Resultados que Inspiran",
    },
]

export default function HeroSection() {
  return (
    <section className="relative h-[90vh] min-h-[650px] w-full flex items-center justify-center text-center text-white overflow-hidden">
      <Image
        src={placeholderImages.hero.src}
        alt="Valentina Montero entrenando a una clienta"
        fill
        className="object-cover object-center"
        priority
        data-ai-hint={placeholderImages.hero.aiHint}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight uppercase text-white drop-shadow-lg animate-fade-in-up">
                Transforma Tu Cuerpo, Eleva Tu Vida
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-xl text-primary-foreground/90 drop-shadow-md animate-fade-in-up animation-delay-300">
                Soy Valentina Montero, y estoy aquí para guiarte en un viaje de transformación hacia una versión más fuerte, saludable y segura de ti misma.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600">
                <Button asChild size="lg" className="font-bold">
                    <Link href="#programs">Comienza Tu Viaje</Link>
                </Button>
            </div>
            
            <div className="mt-12 w-full max-w-3xl animate-fade-in-up animation-delay-600">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    {benefits.map((benefit) => (
                        <div key={benefit.text} className="flex flex-col items-center gap-2">
                           {benefit.icon}
                           <span className="font-semibold text-base">{benefit.text}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </section>
  );
}
