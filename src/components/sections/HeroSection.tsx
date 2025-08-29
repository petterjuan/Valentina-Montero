import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center text-center text-white overflow-hidden">
      <Image
        src="https://picsum.photos/1920/1080?random=11"
        alt="Valentina Montero entrenando a una clienta"
        fill
        className="object-cover object-center"
        priority
        data-ai-hint="female fitness"
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
                <Button asChild variant="link" size="lg" className="text-white hover:text-accent">
                    <Link href="#">Visita Mi Tienda</Link>
                </Button>
            </div>
        </div>
      </div>
    </section>
  );
}
